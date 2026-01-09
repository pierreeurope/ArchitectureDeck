import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { getJobStatus } from "@/lib/redis";

export const jobsRouter = router({
  // Get job status (from Redis for real-time, falls back to DB)
  getStatus: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // First verify the user has access to this job
      const job = await ctx.db.job.findFirst({
        where: { id: input.id },
        include: {
          designRequest: {
            select: { userId: true },
          },
        },
      });

      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      if (job.designRequest.userId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this job",
        });
      }

      // Try to get real-time status from Redis
      const redisStatus = await getJobStatus(input.id);

      if (redisStatus) {
        return {
          id: job.id,
          type: job.type,
          status: redisStatus.status,
          progress: redisStatus.progress,
          message: redisStatus.message,
          designRequestId: job.designRequestId,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        };
      }

      // Fall back to database status
      return {
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
        message: job.error || undefined,
        designRequestId: job.designRequestId,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      };
    }),

  // List jobs for a design request
  listByDesignRequest: protectedProcedure
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

      const jobs = await ctx.db.job.findMany({
        where: { designRequestId: input.designRequestId },
        orderBy: { createdAt: "desc" },
      });

      // Enrich with Redis status if available
      const enrichedJobs = await Promise.all(
        jobs.map(async (job) => {
          const redisStatus = await getJobStatus(job.id);
          return {
            ...job,
            progress: redisStatus?.progress ?? job.progress,
            liveStatus: redisStatus?.status ?? job.status,
            message: redisStatus?.message ?? job.error,
          };
        })
      );

      return enrichedJobs;
    }),
});
