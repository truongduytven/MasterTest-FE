import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Fixed Left Sidebar */}
      <Sidebar className="hidden md:flex shrink-0 fixed top-0 bottom-0 left-0 z-40" />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 pb-12">{children}</main>
      </div>
    </div>
  );
}
