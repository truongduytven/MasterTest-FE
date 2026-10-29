import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  color?: "default" | "success" | "danger" | "warning";
}

export function Progress({
  value,
  color = "default",
  className,
  ...props
}: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const colorStyles = {
    default: "bg-indigo-600",
    success: "bg-emerald-500",
    danger: "bg-rose-500",
    warning: "bg-amber-500",
  };

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full w-full flex-1 transition-all duration-300 ease-in-out",
          colorStyles[color]
        )}
        style={{ transform: `translateX(-${100 - clampedValue}%)` }}
      />
    </div>
  );
}
