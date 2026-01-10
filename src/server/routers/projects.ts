import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const projectsRouter = router({
  // List all projects for the current user
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const cursor = input?.cursor;

      const projects = await ctx.db.project.findMany({
        where: { userId: ctx.userId },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { designRequests: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (projects.length > limit) {
        const nextItem = projects.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: projects,
        nextCursor,
      };
    }),

  // Get a single project by ID (or template accessible to all)
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.id,
          OR: [
            { userId: ctx.userId },
            { isTemplate: true },
          ],
        },
        include: {
          designRequests: {
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
              _count: {
                select: { designVersions: true },
              },
              jobs: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
          _count: {
            select: { designRequests: true },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      return project;
    }),

  // Create a new project
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // First, ensure the user exists (create if not for MVP)
      await ctx.db.user.upsert({
        where: { id: ctx.userId },
        update: {},
        create: {
          id: ctx.userId,
          email: `${ctx.userId}@demo.architecturedeck.com`,
          name: "Demo User",
        },
      });

      const project = await ctx.db.project.create({
        data: {
          name: input.name,
          description: input.description,
          userId: ctx.userId,
        },
      });

      return project;
    }),

  // Update a project
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.db.project.findFirst({
        where: { id, userId: ctx.userId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      return ctx.db.project.update({
        where: { id },
        data,
      });
    }),

  // Delete a project
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.project.findFirst({
        where: { id: input.id, userId: ctx.userId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      await ctx.db.project.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // List all template projects (accessible to all users)
  listTemplates: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;

      const templates = await ctx.db.project.findMany({
        where: { isTemplate: true },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { designRequests: true },
          },
          designRequests: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              designVersions: {
                orderBy: { version: "desc" },
                take: 1,
              },
            },
          },
        },
      });

      return {
        items: templates,
      };
    }),

  // Get a template project by ID (accessible to all users)
  getTemplate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.db.project.findFirst({
        where: {
          id: input.id,
          isTemplate: true,
        },
        include: {
          designRequests: {
            orderBy: { createdAt: "desc" },
            include: {
              _count: {
                select: { designVersions: true },
              },
              designVersions: {
                orderBy: { version: "desc" },
                take: 1,
                include: {
                  diagramVersions: {
                    orderBy: { version: "desc" },
                    take: 1,
                  },
                },
              },
              jobs: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
          _count: {
            select: { designRequests: true },
          },
        },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template project not found",
        });
      }

      return template;
    }),
});
