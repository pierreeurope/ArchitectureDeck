import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DesignCardProps {
  design: {
    id: string;
    title: string;
    inputType: "PROMPT" | "REPO_URL";
    scaleProfile: "PROTOTYPE" | "DAU_1K" | "DAU_1M";
    createdAt: Date;
    _count: {
      designVersions: number;
    };
    jobs: Array<{
      status: string;
      progress: number;
    }>;
  };
  projectId: string;
}

const scaleLabels = {
  PROTOTYPE: "Prototype",
  DAU_1K: "1K DAU",
  DAU_1M: "1M DAU",
};

const statusStyles = {
  PENDING: { label: "Pending", class: "badge-neutral" },
  PROCESSING: { label: "Processing", class: "badge-info" },
  COMPLETED: { label: "Completed", class: "badge-success" },
  FAILED: { label: "Failed", class: "badge-error" },
};

export function DesignCard({ design, projectId }: DesignCardProps) {
  const latestJob = design.jobs[0];
  const status = latestJob?.status || "COMPLETED";
  const statusInfo = statusStyles[status as keyof typeof statusStyles] || statusStyles.COMPLETED;

  return (
    <Link href={`/projects/${projectId}/designs/${design.id}`}>
      <article className="card-hover p-5 group cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-void-800 border border-void-700 flex items-center justify-center">
              {design.inputType === "PROMPT" ? (
                <svg className="w-4 h-4 text-void-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-void-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              )}
            </div>
            <span className={cn(statusInfo.class)}>{statusInfo.label}</span>
          </div>
          <span className="text-xs text-void-500 bg-void-800 px-2 py-1 rounded">
            {scaleLabels[design.scaleProfile]}
          </span>
        </div>

        <h4 className="font-medium text-void-100 mb-2 group-hover:text-neon-cyan transition-colors line-clamp-1">
          {design.title}
        </h4>

        <div className="flex items-center justify-between text-xs text-void-500">
          <span>
            {design._count.designVersions} version{design._count.designVersions !== 1 ? 's' : ''}
          </span>
          <span>{formatRelativeTime(design.createdAt)}</span>
        </div>

        {status === "PROCESSING" && latestJob && (
          <div className="mt-3">
            <div className="h-1 w-full bg-void-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-neon-cyan to-emerald-400 transition-all duration-500"
                style={{ width: `${latestJob.progress}%` }}
              />
            </div>
          </div>
        )}
      </article>
    </Link>
  );
}
