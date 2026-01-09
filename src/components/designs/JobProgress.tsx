import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";

interface JobProgressProps {
  jobId: string;
  onComplete?: () => void;
}

const statusMessages: Record<string, string> = {
  PENDING: "Waiting in queue...",
  PROCESSING: "Generating architecture...",
  COMPLETED: "Design complete!",
  FAILED: "Generation failed",
};

export function JobProgress({ jobId, onComplete }: JobProgressProps) {
  const [isComplete, setIsComplete] = useState(false);

  const { data: job, refetch } = trpc.jobs.getStatus.useQuery(
    { id: jobId },
    {
      refetchInterval: isComplete ? false : 2000,
      enabled: !!jobId,
    }
  );

  useEffect(() => {
    if (job?.status === "COMPLETED" || job?.status === "FAILED") {
      setIsComplete(true);
      if (job.status === "COMPLETED" && onComplete) {
        onComplete();
      }
    }
  }, [job?.status, onComplete]);

  if (!job) {
    return (
      <div className="animate-pulse p-4 bg-ink-light rounded-lg border border-void-800">
        <div className="h-4 w-32 bg-void-700 rounded mb-3" />
        <div className="h-2 w-full bg-void-700 rounded" />
      </div>
    );
  }

  const variant = 
    job.status === "COMPLETED" ? "success" :
    job.status === "FAILED" ? "error" :
    "default";

  return (
    <div className={cn(
      "p-4 rounded-lg border transition-all",
      job.status === "COMPLETED" && "bg-emerald-500/10 border-emerald-500/30",
      job.status === "FAILED" && "bg-red-500/10 border-red-500/30",
      job.status === "PROCESSING" && "bg-neon-cyan/10 border-neon-cyan/30",
      job.status === "PENDING" && "bg-ink-light border-void-800"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon status={job.status} />
          <span className="text-sm font-medium text-void-200">
            {statusMessages[job.status] || job.status}
          </span>
        </div>
        <span className="text-xs text-void-500">
          {job.progress}%
        </span>
      </div>

      <ProgressBar progress={job.progress} variant={variant} />

      {job.message && job.status !== "COMPLETED" && (
        <p className="mt-2 text-xs text-void-400">{job.message}</p>
      )}

      {job.status === "FAILED" && job.message && (
        <p className="mt-2 text-xs text-red-400">{job.message}</p>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return (
      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (status === "FAILED") {
    return (
      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }

  if (status === "PROCESSING") {
    return (
      <div className="w-5 h-5 rounded-full bg-neon-cyan flex items-center justify-center">
        <svg className="w-3 h-3 text-ink animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-5 h-5 rounded-full bg-void-600 flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-void-400" />
    </div>
  );
}
