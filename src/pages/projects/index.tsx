import { useState } from "react";
import Head from "next/head";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { LoadingCard, LoadingScreen } from "@/components/ui/LoadingSpinner";
import { EmptyState, EmptyProjectsIcon } from "@/components/ui/EmptyState";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = 
    trpc.projects.list.useInfiniteQuery(
      { limit: 12 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  const projects = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <>
      <Head>
        <title>Projects — ArchitectureDeck</title>
      </Head>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title">Projects</h1>
            <p className="text-void-400 mt-1">
              Organize your architecture designs into projects
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </Button>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            {hasNextPage && (
              <div className="text-center pt-4">
                <Button
                  variant="secondary"
                  onClick={() => fetchNextPage()}
                  isLoading={isFetchingNextPage}
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={<EmptyProjectsIcon />}
            title="No projects yet"
            description="Create your first project to start designing architectures"
            action={
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Create Project
              </Button>
            }
          />
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
