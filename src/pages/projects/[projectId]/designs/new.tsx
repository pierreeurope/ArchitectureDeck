import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { trpc } from "@/lib/trpc";
import { LoadingScreen } from "@/components/ui/LoadingSpinner";
import { CreateDesignForm } from "@/components/designs/CreateDesignForm";
import { JobProgress } from "@/components/designs/JobProgress";
import { Button } from "@/components/ui/Button";

export default function NewDesignPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const [activeJob, setActiveJob] = useState<{ designId: string; jobId: string } | null>(null);

  const { data: project, isLoading } = trpc.projects.get.useQuery(
    { id: projectId },
    { enabled: !!projectId && router.isReady }
  );

  const handleSuccess = (designId: string, jobId: string) => {
    setActiveJob({ designId, jobId });
  };

  const handleJobComplete = () => {
    if (activeJob) {
      router.push(`/projects/${projectId}/designs/${activeJob.designId}`);
    }
  };

  // Show loading while router is initializing or query is loading
  if (!router.isReady || isLoading) {
    return <LoadingScreen message="Loading project..." />;
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-void-400">Project not found</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>New Design — {project.name} — ArchitectureDeck</title>
      </Head>

      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-void-500 mb-8">
          <Link href="/projects" className="hover:text-void-300 transition-colors">
            Projects
          </Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href={`/projects/${projectId}`} className="hover:text-void-300 transition-colors">
            {project.name}
          </Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-void-300">New Design</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="section-title">Create Architecture Design</h1>
          <p className="text-void-400 mt-2">
            Describe your product or provide a GitHub URL to generate an architecture plan.
          </p>
        </div>

        {/* Content */}
        {activeJob ? (
          <div className="card p-8 space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-void-100 mb-2">
                Generating Your Architecture
              </h2>
              <p className="text-void-400">
                Our AI is analyzing your requirements and creating a detailed architecture plan.
              </p>
            </div>

            <JobProgress jobId={activeJob.jobId} onComplete={handleJobComplete} />

            <div className="flex justify-center pt-4">
              <Button 
                variant="secondary"
                onClick={handleJobComplete}
              >
                View Design (Skip Waiting)
              </Button>
            </div>
          </div>
        ) : (
          <div className="card p-8">
            <CreateDesignForm projectId={projectId} onSuccess={handleSuccess} />
          </div>
        )}
      </div>
    </>
  );
}
