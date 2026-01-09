import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/redis";

// Context type
export interface Context {
  db: typeof db;
  userId: string | null;
}

// Create context for each request
export async function createContext(): Promise<Context> {
  // For MVP, we use a mock user. In production, extract from session/JWT
  const mockUserId = "user_demo_001";
  
  return {
    db,
    userId: mockUserId,
  };
}

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// Auth middleware - ensures user is authenticated
const enforceAuth = middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

// Rate limit middleware
const enforceRateLimit = middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  const rateLimit = await checkRateLimit(ctx.userId, 10, 60000);
  
  if (!rateLimit.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Try again in ${Math.ceil((rateLimit.resetAt - Date.now()) / 1000)} seconds`,
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(enforceAuth);

// Rate limited procedure - requires auth + rate limiting
export const rateLimitedProcedure = t.procedure.use(enforceAuth).use(enforceRateLimit);
