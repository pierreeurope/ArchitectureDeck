import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/LoadingSpinner";
import { EmptyState, EmptyDesignsIcon } from "@/components/ui/EmptyState";
import { DesignCard } from "@/components/designs/DesignCard";
import { formatDate } from "@/lib/utils";

export default function ProjectDetailPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;

  const { data: project, isLoading, error } = trpc.projects.get.useQuery(
    { id: projectId },
    { enabled: !!projectId }
  );

  if (isLoading) {
    return <LoadingScreen message="Loading project..." />;
  }

  if (error || !project) {
    return (
      <EmptyState
        title="Project not found"
        description="The project you're looking for doesn't exist or you don't have access to it."
        action={
          <Link href="/projects">
            <Button variant="secondary">Back to Projects</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <Head>
        <title>{project.name} — ArchitectureDeck</title>
      </Head>

      <div className="space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-void-500">
          <Link href="/projects" className="hover:text-void-300 transition-colors">
            Projects
          </Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-void-300">{project.name}</span>
        </nav>

        {/* Project Header */}
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-emerald-500/20 border border-neon-cyan/30 flex items-center justify-center">
                <svg className="w-7 h-7 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-void-100">{project.name}</h1>
                {project.description && (
                  <p className="text-void-400 mt-1">{project.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-void-500">
                  <span>{project._count.designRequests} designs</span>
                  <span>•</span>
                  <span>Created {formatDate(project.createdAt)}</span>
                </div>
              </div>
            </div>

            <Link href={`/projects/${projectId}/designs/new`}>
              <Button variant="primary">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Design
              </Button>
            </Link>
          </div>
        </div>

        {/* Designs Section */}
        <section>
          <h2 className="text-lg font-semibold text-void-100 mb-4">Designs</h2>

          {project.designRequests.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.designRequests.map((design) => (
                <DesignCard 
                  key={design.id} 
                  design={design} 
                  projectId={projectId}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<EmptyDesignsIcon />}
              title="No designs yet"
              description="Create your first architecture design for this project"
              action={
                <Link href={`/projects/${projectId}/designs/new`}>
                  <Button variant="primary">Create Design</Button>
                </Link>
              }
              className="card"
            />
          )}
        </section>
      </div>
    </>
  );
}
