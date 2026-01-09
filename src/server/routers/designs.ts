import { z } from "zod";
import { router, protectedProcedure, rateLimitedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { enqueueDesignGeneration } from "@/lib/queue";

const constraintsSchema = z.object({
  mustUse: z.array(z.string()).optional().default([]),
  avoid: z.array(z.string()).optional().default([]),
  preferredLanguage: z.string().optional(),
});

const scaleProfileSchema = z.enum(["PROTOTYPE", "DAU_1K", "DAU_1M"]);
const inputTypeSchema = z.enum(["PROMPT", "REPO_URL"]);

export const designsRouter = router({
  // Create a new design request and enqueue generation job
  createRequest: rateLimitedProcedure
    .input(
      z.object({
        projectId: z.string(),
        title: z.string().min(1).max(200),
        inputType: inputTypeSchema,
        promptText: z.string().max(5000).optional(),
        repoUrl: z.string().url().optional(),
        constraints: constraintsSchema.optional().default({}),
        scaleProfile: scaleProfileSchema.default("PROTOTYPE"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate input type matches provided data
      if (input.inputType === "PROMPT" && !input.promptText) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Prompt text is required when input type is PROMPT",
        });
      }
      if (input.inputType === "REPO_URL" && !input.repoUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Repository URL is required when input type is REPO_URL",
        });
      }

      // Verify project exists and belongs to user
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Create design request
      const designRequest = await ctx.db.designRequest.create({
        data: {
          title: input.title,
          inputType: input.inputType,
          promptText: input.promptText,
          repoUrl: input.repoUrl,
          constraints: input.constraints,
          scaleProfile: input.scaleProfile,
          projectId: input.projectId,
          userId: ctx.userId,
        },
      });

      // Enqueue generation job
      const jobId = await enqueueDesignGeneration({
        designRequestId: designRequest.id,
        inputType: input.inputType,
        promptText: input.promptText,
        repoUrl: input.repoUrl,
        constraints: input.constraints,
        scaleProfile: input.scaleProfile,
      });

      return {
        designRequest,
        jobId,
      };
    }),

  // Get a single design request
  getRequest: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const request = await ctx.db.designRequest.findFirst({
        where: {
          id: input.id,
          userId: ctx.userId,
        },
        include: {
          project: true,
          designVersions: {
            orderBy: { version: "desc" },
            take: 1,
          },
          diagramVersions: {
            orderBy: { version: "desc" },
            take: 1,
          },
          jobs: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Design request not found",
        });
      }

      return request;
    }),

  // List design requests for a project
  listRequests: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify project access
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      const requests = await ctx.db.designRequest.findMany({
        where: { projectId: input.projectId },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { designVersions: true },
          },
          jobs: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      let nextCursor: string | undefined;
      if (requests.length > input.limit) {
        const nextItem = requests.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: requests,
        nextCursor,
      };
    }),

  // Get a specific design version
  getVersion: protectedProcedure
    .input(
      z.object({
        designRequestId: z.string(),
        version: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify access
      const request = await ctx.db.designRequest.findFirst({
        where: { id: input.designRequestId, userId: ctx.userId },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Design request not found",
        });
      }

      const whereClause = input.version
        ? { designRequestId: input.designRequestId, version: input.version }
        : { designRequestId: input.designRequestId };

      const version = await ctx.db.designVersion.findFirst({
        where: whereClause,
        orderBy: { version: "desc" },
        include: {
          diagramVersions: {
            orderBy: { version: "desc" },
            take: 1,
          },
        },
      });

      if (!version) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Design version not found",
        });
      }

      return version;
    }),

  // List all versions for a design request
  listVersions: protectedProcedure
    .input(z.object({ designRequestId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify access
      const request = await ctx.db.designRequest.findFirst({
        where: { id: input.designRequestId, userId: ctx.userId },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Design request not found",
        });
      }

      const versions = await ctx.db.designVersion.findMany({
        where: { designRequestId: input.designRequestId },
        orderBy: { version: "desc" },
        include: {
          _count: {
            select: { diagramVersions: true },
          },
        },
      });

      return versions;
    }),

  // Get diagram for a design request
  getDiagram: protectedProcedure
    .input(
      z.object({
        designRequestId: z.string(),
        version: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify access
      const request = await ctx.db.designRequest.findFirst({
        where: { id: input.designRequestId, userId: ctx.userId },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Design request not found",
        });
      }

      const whereClause = input.version
        ? { designRequestId: input.designRequestId, version: input.version }
        : { designRequestId: input.designRequestId };

      const diagram = await ctx.db.diagramVersion.findFirst({
        where: whereClause,
        orderBy: { version: "desc" },
      });

      return diagram;
    }),
});
