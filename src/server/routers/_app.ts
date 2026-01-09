import { router } from "../trpc";
import { projectsRouter } from "./projects";
import { designsRouter } from "./designs";
import { jobsRouter } from "./jobs";

export const appRouter = router({
  projects: projectsRouter,
  designs: designsRouter,
  jobs: jobsRouter,
});

export type AppRouter = typeof appRouter;
