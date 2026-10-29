"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Sparkles, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header({
  title,
  subtitle,
  actions,
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {title || "Bảng điều khiển Kiểm thử"}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {actions || (
          <Link href="/projects/new">
            <Button size="sm" className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              <span>Tạo Dự án Mới</span>
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
