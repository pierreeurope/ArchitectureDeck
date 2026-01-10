/**
 * Background Worker Process
 * 
 * Handles job queue processing for design generation and diagram rendering.
 * Run with: npm run worker
 */

import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { generateDesign, DesignInput } from "./generator";
import { renderMermaidToSvg } from "./renderer";
import { GenerateDesignJobData, RenderDiagramJobData } from "@/lib/queue";

// Initialize clients
const db = new PrismaClient();
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

function createConnection() {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

// Helper to update job status in Redis
async function updateJobStatus(
  redis: Redis,
  jobId: string,
  status: string,
  progress: number,
  message?: string
) {
  await redis.hset(`job:${jobId}`, {
    status,
    progress: progress.toString(),
    message: message || "",
    updatedAt: Date.now().toString(),
  });
}

// Design Generation Worker
const designWorker = new Worker<GenerateDesignJobData>(
  "design-generation",
  async (job: Job<GenerateDesignJobData>) => {
    const redis = createConnection();
    const { 
      jobId, 
      designRequestId, 
      inputType, 
      promptText, 
      repoUrl, 
      constraints, 
      scaleProfile,
      detailLevel,
      suggestions,
      refinementPrompt,
      existingDesign,
    } = job.data;

    const isRefinement = !!refinementPrompt && !!existingDesign;
    console.log(`[Worker] Processing ${isRefinement ? 'refinement' : 'design'} job ${jobId} for request ${designRequestId}`);

    try {
      // Update job status: starting
      const startMessage = isRefinement ? "Starting design refinement..." : "Starting design generation...";
      await updateJobStatus(redis, jobId, "PROCESSING", 10, startMessage);
      await db.job.update({
        where: { id: jobId },
        data: { status: "PROCESSING", startedAt: new Date(), progress: 10 },
      });

      // Generate/refine design
      const analyzeMessage = isRefinement ? "Analyzing refinement request..." : "Analyzing requirements...";
      await updateJobStatus(redis, jobId, "PROCESSING", 30, analyzeMessage);

      const input: DesignInput = {
        inputType,
        promptText,
        repoUrl,
        constraints: {
          mustUse: constraints.mustUse || [],
          avoid: constraints.avoid || [],
          preferredLanguage: constraints.preferredLanguage,
        },
        scaleProfile,
        detailLevel: detailLevel || "STANDARD",
        suggestions: suggestions || [],
        refinementPrompt,
        existingDesign: existingDesign as any,
      };

      const genMessage = isRefinement ? "Refining architecture..." : "Generating architecture...";
      await updateJobStatus(redis, jobId, "PROCESSING", 50, genMessage);
      const result = await generateDesign(input);

      // Get next version number
      const latestVersion = await db.designVersion.findFirst({
        where: { designRequestId },
        orderBy: { version: "desc" },
      });
      const nextVersion = (latestVersion?.version || 0) + 1;

      await updateJobStatus(redis, jobId, "PROCESSING", 70, "Saving design version...");

      // Save design version
      const designVersion = await db.designVersion.create({
        data: {
          designRequestId,
          version: nextVersion,
          designData: result.design as any,
        },
      });

      await updateJobStatus(redis, jobId, "PROCESSING", 85, "Rendering diagram...");

      // Render Mermaid diagram
      const renderResult = await renderMermaidToSvg(result.mermaidDiagram);

      // Get next diagram version
      const latestDiagramVersion = await db.diagramVersion.findFirst({
        where: { designRequestId },
        orderBy: { version: "desc" },
      });
      const nextDiagramVersion = (latestDiagramVersion?.version || 0) + 1;

      // Save diagram version
      await db.diagramVersion.create({
        data: {
          designRequestId,
          designVersionId: designVersion.id,
          version: nextDiagramVersion,
          mermaidSource: renderResult.mermaidSource,
          svgContent: renderResult.svgContent,
        },
      });

      // Mark job complete
      await updateJobStatus(redis, jobId, "COMPLETED", 100, "Design generated successfully!");
      await db.job.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          progress: 100,
          completedAt: new Date(),
        },
      });

      console.log(`[Worker] Completed design job ${jobId}`);
      await redis.quit();

      return { success: true, designVersionId: designVersion.id };
    } catch (error) {
      console.error(`[Worker] Error processing design job ${jobId}:`, error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      await updateJobStatus(redis, jobId, "FAILED", 0, errorMessage);
      await db.job.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          error: errorMessage,
          completedAt: new Date(),
        },
      });

      await redis.quit();
      throw error;
    }
  },
  {
    connection: createConnection(),
    concurrency: 5,
  }
);

// Diagram Rendering Worker (for re-rendering)
const diagramWorker = new Worker<RenderDiagramJobData>(
  "diagram-rendering",
  async (job: Job<RenderDiagramJobData>) => {
    const redis = createConnection();
    const { jobId, designRequestId, mermaidSource } = job.data;

    console.log(`[Worker] Processing diagram job ${jobId}`);

    try {
      await updateJobStatus(redis, jobId, "PROCESSING", 50, "Rendering diagram...");
      await db.job.update({
        where: { id: jobId },
        data: { status: "PROCESSING", startedAt: new Date() },
      });

      const renderResult = await renderMermaidToSvg(mermaidSource);

      // Get next version
      const latestVersion = await db.diagramVersion.findFirst({
        where: { designRequestId },
        orderBy: { version: "desc" },
      });
      const nextVersion = (latestVersion?.version || 0) + 1;

      // Save diagram
      await db.diagramVersion.create({
        data: {
          designRequestId,
          version: nextVersion,
          mermaidSource: renderResult.mermaidSource,
          svgContent: renderResult.svgContent,
        },
      });

      await updateJobStatus(redis, jobId, "COMPLETED", 100, "Diagram rendered!");
      await db.job.update({
        where: { id: jobId },
        data: { status: "COMPLETED", progress: 100, completedAt: new Date() },
      });

      await redis.quit();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      await updateJobStatus(redis, jobId, "FAILED", 0, errorMessage);
      await db.job.update({
        where: { id: jobId },
        data: { status: "FAILED", error: errorMessage },
      });

      await redis.quit();
      throw error;
    }
  },
  {
    connection: createConnection(),
    concurrency: 10,
  }
);

// Error handling
designWorker.on("failed", (job, err) => {
  console.error(`[Worker] Design job ${job?.id} failed:`, err.message);
});

diagramWorker.on("failed", (job, err) => {
  console.error(`[Worker] Diagram job ${job?.id} failed:`, err.message);
});

// Graceful shutdown
async function shutdown() {
  console.log("[Worker] Shutting down...");
  await designWorker.close();
  await diagramWorker.close();
  await db.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log("🚀 Worker started and listening for jobs...");
console.log(`   Redis: ${redisUrl}`);
console.log("   Queues: design-generation, diagram-rendering");
