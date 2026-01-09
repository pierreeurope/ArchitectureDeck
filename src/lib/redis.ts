import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  
  return new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

// Rate limiting utilities
export async function checkRateLimit(
  userId: string,
  limit: number = 10,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `rate_limit:${userId}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Remove old entries
  await redis.zremrangebyscore(key, 0, windowStart);

  // Count current requests
  const count = await redis.zcard(key);

  if (count >= limit) {
    const oldestEntry = await redis.zrange(key, 0, 0, "WITHSCORES");
    const resetAt = oldestEntry.length > 1 
      ? parseInt(oldestEntry[1]) + windowMs 
      : now + windowMs;
    
    return { allowed: false, remaining: 0, resetAt };
  }

  // Add new request
  await redis.zadd(key, now, `${now}-${Math.random()}`);
  await redis.expire(key, Math.ceil(windowMs / 1000));

  return { allowed: true, remaining: limit - count - 1, resetAt: now + windowMs };
}

// Job status utilities
export async function setJobStatus(
  jobId: string,
  status: {
    status: string;
    progress: number;
    message?: string;
  }
): Promise<void> {
  const key = `job:${jobId}`;
  await redis.hset(key, {
    status: status.status,
    progress: status.progress.toString(),
    message: status.message || "",
    updatedAt: Date.now().toString(),
  });
  await redis.expire(key, 86400); // 24 hours
}

export async function getJobStatus(
  jobId: string
): Promise<{ status: string; progress: number; message?: string } | null> {
  const key = `job:${jobId}`;
  const data = await redis.hgetall(key);
  
  if (!data || !data.status) {
    return null;
  }

  return {
    status: data.status,
    progress: parseInt(data.progress || "0"),
    message: data.message || undefined,
  };
}
