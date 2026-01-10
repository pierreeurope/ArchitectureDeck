import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { trpc } from "@/lib/trpc";
import { LoadingScreen } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { DesignViewer } from "@/components/designs/DesignViewer";
import { JobProgress } from "@/components/designs/JobProgress";
import { RefineDesignModal } from "@/components/designs/RefineDesignModal";
import { formatDate } from "@/lib/utils";

const scaleLabels = {
  PROTOTYPE: "Prototype",
  DAU_1K: "1K DAU",
  DAU_1M: "1M DAU",
};

const detailLabels = {
  OVERVIEW: "Overview",
  STANDARD: "Standard",
  DETAILED: "Detailed",
};

export default function DesignDetailPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const designId = router.query.designId as string;
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);

  const { data: design, isLoading, refetch } = trpc.designs.getRequest.useQuery(
    { id: designId },
    { enabled: !!designId && router.isReady }
  );

  const { data: versions, refetch: refetchVersions } = trpc.designs.listVersions.useQuery(
    { designRequestId: designId },
    { enabled: !!designId && router.isReady }
  );

  const { data: currentVersion } = trpc.designs.getVersion.useQuery(
    { 
      designRequestId: designId, 
      version: selectedVersion || undefined 
    },
    { enabled: !!designId && router.isReady && (!!selectedVersion || (versions?.length ?? 0) > 0) }
  );

  const { data: diagram } = trpc.designs.getDiagram.useQuery(
    { 
      designRequestId: designId, 
      version: selectedVersion || undefined 
    },
    { enabled: !!designId && router.isReady }
  );

  const handleRefineSuccess = () => {
    // Refetch data to show the new job
    refetch();
    refetchVersions();
  };

  // Show loading while router is initializing or query is loading
  if (!router.isReady || isLoading) {
    return <LoadingScreen message="Loading design..." />;
  }

  if (!design) {
    return (
      <div className="text-center py-12">
        <p className="text-void-400 mb-4">Design not found</p>
        <Link href={`/projects/${projectId}`}>
          <Button variant="secondary">Back to Project</Button>
        </Link>
      </div>
    );
  }

  const latestJob = design.jobs[0];
  const isProcessing = latestJob?.status === "PENDING" || latestJob?.status === "PROCESSING";
  const hasFailed = latestJob?.status === "FAILED";
  const hasDesign = currentVersion?.designData;

  return (
    <>
      <Head>
        <title>{design.title} — ArchitectureDeck</title>
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
          <Link href={`/projects/${projectId}`} className="hover:text-void-300 transition-colors">
            {design.project.name}
          </Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-void-300 truncate max-w-[200px]">{design.title}</span>
        </nav>

        {/* Design Header */}
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold text-void-100 truncate">{design.title}</h1>
                <span className="badge-neutral shrink-0">{scaleLabels[design.scaleProfile]}</span>
                {(design as any).detailLevel && (
                  <span className="badge-info shrink-0">
                    {detailLabels[(design as any).detailLevel as keyof typeof detailLabels] || (design as any).detailLevel}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-void-500">
                <span className="flex items-center gap-1.5">
                  {design.inputType === "PROMPT" ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      From prompt
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      From repository
                    </>
                  )}
                </span>
                <span>Created {formatDate(design.createdAt)}</span>
                {versions && versions.length > 0 && (
                  <span>{versions.length} version{versions.length !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Refine Button */}
              {hasDesign && !isProcessing && (
                <Button
                  variant="secondary"
                  onClick={() => setIsRefineModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Refine with AI
                </Button>
              )}

              {/* Version Selector */}
              {versions && versions.length > 1 && (
                <select
                  value={selectedVersion || ""}
                  onChange={(e) => setSelectedVersion(e.target.value ? parseInt(e.target.value) : null)}
                  className="select text-sm py-2"
                >
                  <option value="">Latest Version</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.version}>
                      Version {v.version}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Input Preview */}
          {design.promptText && (
            <details className="mt-4 border-t border-void-800 pt-4">
              <summary className="text-sm text-void-400 cursor-pointer hover:text-void-300">
                View original prompt
              </summary>
              <p className="mt-2 text-sm text-void-300 whitespace-pre-wrap">
                {design.promptText}
              </p>
            </details>
          )}

          {design.repoUrl && (
            <div className="mt-4 border-t border-void-800 pt-4">
              <a 
                href={design.repoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-neon-cyan hover:text-neon-cyan/80 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {design.repoUrl}
              </a>
            </div>
          )}
        </div>

        {/* Job Progress (if processing) */}
        {isProcessing && latestJob && (
          <JobProgress jobId={latestJob.id} onComplete={() => {
            refetch();
            refetchVersions();
          }} />
        )}

        {/* Failed State */}
        {hasFailed && (
          <div className="card p-6 bg-red-500/10 border-red-500/30">
            <div className="flex items-center gap-3 text-red-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium">Generation failed</span>
            </div>
            <p className="mt-2 text-sm text-void-400">
              There was an error generating this design. Please try again.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsRefineModalOpen(true)}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Design Content */}
        {hasDesign && (
          <DesignViewer
            designData={currentVersion.designData as any}
            mermaidSource={diagram?.mermaidSource}
            svgContent={diagram?.svgContent || undefined}
          />
        )}

        {/* No Content Yet */}
        {!isProcessing && !hasFailed && !hasDesign && (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-void-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-void-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-void-200 mb-2">No design generated yet</h3>
            <p className="text-sm text-void-500">
              The design generation hasn't completed yet.
            </p>
          </div>
        )}
      </div>

      {/* Refine Modal */}
      <RefineDesignModal
        isOpen={isRefineModalOpen}
        onClose={() => setIsRefineModalOpen(false)}
        designRequestId={designId}
        currentDetailLevel={(design as any).detailLevel || "STANDARD"}
        onSuccess={handleRefineSuccess}
      />
    </>
  );
}
