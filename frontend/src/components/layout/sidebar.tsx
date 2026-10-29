"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  PlusCircle,
  FileCheck2,
  Sparkles,
  Layers,
  ChevronRight,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [apiOnline, setApiOnline] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let mounted = true;
    api
      .checkHealth()
      .then((res) => {
        if (mounted) setApiOnline(res.status !== "offline");
      })
      .catch(() => {
        if (mounted) setApiOnline(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const navItems = [
    {
      title: "Danh sách Dự án",
      href: "/",
      icon: FolderKanban,
      match: (path: string) => path === "/",
    },
    {
      title: "Tạo Dự án Mới (Wizard)",
      href: "/projects/new",
      icon: PlusCircle,
      match: (path: string) => path === "/projects/new",
    },
  ];

  return (
    <aside
      className={cn(
        "flex h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6 dark:border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            QA Platform AI
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated Testing & Report
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1.5 p-4">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Quản lý Kiểm thử
        </p>
        {navItems.map((item) => {
          const isActive = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                  )}
                />
                <span>{item.title}</span>
              </div>
              {isActive && (
                <ChevronRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              )}
            </Link>
          );
        })}

        <div className="pt-6">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Quy trình & Chuẩn hóa
          </p>
          <div className="mt-2 space-y-2 px-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              <span>Figma + PRD / Domain</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Gemini 2.5 Structured Gen</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-sky-500" />
              <span>Playwright + Cloudinary</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Xuất Excel 3 Sheets / PDF</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Footer / API Status indicator */}
      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                apiOnline === true
                  ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                  : apiOnline === false
                  ? "bg-rose-500"
                  : "bg-amber-400 animate-pulse"
              )}
            />
            <span className="font-medium text-slate-700 dark:text-slate-200">
              API Backend
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {apiOnline === true
              ? "Kết nối tốt"
              : apiOnline === false
              ? "Chưa kết nối"
              : "Đang kiểm tra"}
          </span>
        </div>
      </div>
    </aside>
  );
}
