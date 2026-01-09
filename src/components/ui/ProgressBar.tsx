import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

export function ProgressBar({
  progress,
  showLabel = false,
  size = "md",
  variant = "default",
  className,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const variantClasses = {
    default: "from-neon-cyan to-emerald-400",
    success: "from-emerald-500 to-green-400",
    warning: "from-amber-500 to-yellow-400",
    error: "from-red-500 to-rose-400",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-void-400">Progress</span>
          <span className="text-xs text-void-300 font-medium">{clampedProgress}%</span>
        </div>
      )}
      <div className={cn("w-full bg-void-800 rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className={cn(
            "h-full bg-gradient-to-r transition-all duration-500 ease-out rounded-full",
            variantClasses[variant]
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}
