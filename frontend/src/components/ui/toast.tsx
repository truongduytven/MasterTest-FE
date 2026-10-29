"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: "success" | "error" | "info";
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const showToast = React.useCallback(
    ({ title, description, type }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, description, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all animate-in slide-in-from-bottom-2",
              toast.type === "success" &&
                "border-emerald-200 bg-white/95 text-emerald-950 dark:border-emerald-900 dark:bg-slate-900/95 dark:text-emerald-100",
              toast.type === "error" &&
                "border-rose-200 bg-white/95 text-rose-950 dark:border-rose-900 dark:bg-slate-900/95 dark:text-rose-100",
              toast.type === "info" &&
                "border-slate-200 bg-white/95 text-slate-900 dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100"
            )}
          >
            {toast.type === "success" && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            )}
            {toast.type === "error" && (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            {toast.type === "info" && (
              <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="text-sm font-semibold">{toast.title}</h4>
              {toast.description && (
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
