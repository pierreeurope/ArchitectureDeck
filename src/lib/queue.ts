import { Queue, Worker, Job as BullJob } from "bullmq";
import Redis from "ioredis";
import { db } from "./db";
import { setJobStatus } from "./redis";

// Create a dedicated Redis connection for BullMQ
function createQueueConnection(): Redis {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  return new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

// Job data types
export interface GenerateDesignJobData {
  jobId: string;
  designRequestId: string;
  inputType: "PROMPT" | "REPO_URL";
  promptText?: string;
  repoUrl?: string;
  constraints: {
    mustUse?: string[];
    avoid?: string[];
    preferredLanguage?: string;
  };
  scaleProfile: "PROTOTYPE" | "DAU_1K" | "DAU_1M";
}

export interface RenderDiagramJobData {
  jobId: string;
  designRequestId: string;
  mermaidSource: string;
}

export type JobData = GenerateDesignJobData | RenderDiagramJobData;

// Queues
export const designQueue = new Queue<GenerateDesignJobData>("design-generation", {
  connection: createQueueConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const diagramQueue = new Queue<RenderDiagramJobData>("diagram-rendering", {
  connection: createQueueConnection(),
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "fixed",
      delay: 500,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Helper to enqueue a design generation job
export async function enqueueDesignGeneration(
  data: Omit<GenerateDesignJobData, "jobId">
): Promise<string> {
  // Create job record in database
  const job = await db.job.create({
    data: {
      type: "GENERATE_DESIGN",
      status: "PENDING",
      designRequestId: data.designRequestId,
      metadata: data as object,
    },
  });

  // Enqueue in Redis
  await designQueue.add("generate", { ...data, jobId: job.id });

  // Set initial status in Redis
  await setJobStatus(job.id, {
    status: "PENDING",
    progress: 0,
    message: "Job queued",
  });

  return job.id;
}

// Helper to enqueue a diagram rendering job
export async function enqueueDiagramRendering(
  data: Omit<RenderDiagramJobData, "jobId">
): Promise<string> {
  const job = await db.job.create({
    data: {
      type: "RENDER_DIAGRAM",
      status: "PENDING",
      designRequestId: data.designRequestId,
      metadata: data as object,
    },
  });

  await diagramQueue.add("render", { ...data, jobId: job.id });

  await setJobStatus(job.id, {
    status: "PENDING",
    progress: 0,
    message: "Diagram rendering queued",
  });

  return job.id;
}
