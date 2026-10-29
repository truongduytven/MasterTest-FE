import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={cn("w-full space-y-4", className)}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child as React.ReactElement<any>, {
          currentValue: value,
          onSelect: onValueChange,
        });
      })}
    </div>
  );
}

export function TabsList({
  children,
  className,
  currentValue,
  onSelect,
}: {
  children: React.ReactNode;
  className?: string;
  currentValue?: string;
  onSelect?: (value: string) => void;
}) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-start rounded-lg bg-slate-100 p-1 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child as React.ReactElement<any>, {
          isSelected: (child.props as any).value === currentValue,
          onSelect,
        });
      })}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
  isSelected,
  onSelect,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  isSelected?: boolean;
  onSelect?: (value: string) => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      onClick={() => onSelect?.(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected
          ? "bg-white text-indigo-700 shadow-sm font-semibold dark:bg-slate-900 dark:text-indigo-400"
          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
  currentValue,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  currentValue?: string;
}) {
  if (value !== currentValue) return null;
  return (
    <div
      role="tabpanel"
      className={cn("focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500", className)}
    >
      {children}
    </div>
  );
}
