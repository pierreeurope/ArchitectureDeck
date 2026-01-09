import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./LoadingSpinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ink disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles = {
      primary: "bg-gradient-to-r from-neon-cyan to-emerald-400 text-ink hover:opacity-90 focus:ring-neon-cyan shadow-lg shadow-neon-cyan/20",
      secondary: "bg-void-800 text-void-100 hover:bg-void-700 focus:ring-void-600 border border-void-700",
      ghost: "bg-transparent text-void-300 hover:text-void-100 hover:bg-void-800/50",
      danger: "bg-red-600/20 text-red-400 hover:bg-red-600/30 focus:ring-red-500 border border-red-600/30",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <LoadingSpinner size="sm" className={variant === "primary" ? "text-ink" : ""} />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
