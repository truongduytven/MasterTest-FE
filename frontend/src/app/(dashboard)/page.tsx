"use client";

import * as React from "react";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FolderPlus,
  AlertCircle,
  FileCheck,
  Play,
  Layers,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectCard } from "@/components/projects/project-card";
import { api } from "@/lib/api";
import { Project } from "@/types";
import { useToast } from "@/components/ui/toast";

export default function DashboardPage() {
  const { showToast } = useToast();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterMode, setFilterMode] = React.useState<string>("ALL");

  const loadProjects = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleDeleteProject = async (id: string) => {
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      showToast({
        title: "Đã xóa dự án thành công",
        type: "success",
      });
    } catch (err: any) {
      showToast({
        title: "Lỗi xóa dự án",
        description: err.message,
        type: "error",
      });
    }
  };

  const handleTriggerRun = async (id: string) => {
    try {
      const run = await api.triggerTestRun(id);
      showToast({
        title: "Đã kích hoạt phiên kiểm thử",
        description: `Bắt đầu Test Run #${run.runNumber}. Bạn có thể theo dõi trực tiếp kết quả.`,
        type: "success",
      });
      loadProjects();
    } catch (err: any) {
      showToast({
        title: "Lỗi khởi chạy kiểm thử",
        description: err.message,
        type: "error",
      });
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.targetDomainUrl &&
        project.targetDomainUrl.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterMode === "ALL" || project.inputMode === filterMode;
    return matchesSearch && matchesFilter;
  });

  // Calculate high-level statistics
  const totalProjects = projects.length;
  const totalUseCases = projects.reduce(
    (acc, p) => acc + (p.useCases?.length || p._count?.useCases || 0),
    0
  );
  const totalTestCases = projects.reduce(
    (acc, p) =>
      acc +
      (p.useCases?.reduce((subAcc, uc) => subAcc + (uc.testCases?.length || 0), 0) || 0),
    0
  );
  const totalRuns = projects.reduce(
    (acc, p) => acc + (p.testRuns?.length || p._count?.testRuns || 0),
    0
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Dự án Kiểm thử Tự động"
        subtitle="Quản lý tập trung các bộ Test Suite, kịch bản sinh bởi Gemini 2.5 và báo cáo E2E"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadProjects}
              className="gap-1.5"
              title="Tải lại danh sách"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
            <Link href="/projects/new">
              <Button size="sm" className="gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" />
                <span>Tạo Dự án Mới</span>
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                <FolderKanban className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Tổng Dự án
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {totalProjects}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 shrink-0">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Tổng Use Cases
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {totalUseCases}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Tổng Test Cases
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {totalTestCases}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Lượt Chạy Test
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {totalRuns}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên dự án, domain URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="ALL">Tất cả nguồn đầu vào</option>
              <option value="FIGMA_AND_DOCS">Figma & PRD Docs</option>
              <option value="DOMAIN_ONLY">Live Domain URL</option>
              <option value="HYBRID">Chế độ kết hợp (Hybrid)</option>
            </select>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-60 rounded-xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="h-4 w-24 bg-slate-200 rounded dark:bg-slate-800" />
                <div className="h-6 w-3/4 bg-slate-200 rounded mt-4 dark:bg-slate-800" />
                <div className="h-4 w-full bg-slate-200 rounded mt-2 dark:bg-slate-800" />
                <div className="h-20 bg-slate-100 rounded-lg mt-6 dark:bg-slate-800/50" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-6 text-center dark:border-rose-900/60 dark:bg-rose-950/20">
            <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
            <h3 className="mt-2 text-sm font-semibold text-rose-900 dark:text-rose-200">
              Không thể tải danh sách dự án
            </h3>
            <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadProjects}
              className="mt-4 gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Thử lại</span>
            </Button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <FolderPlus className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
              {searchTerm || filterMode !== "ALL"
                ? "Không tìm thấy dự án phù hợp bộ lọc"
                : "Chưa có dự án kiểm thử nào"}
            </h3>
            <p className="mt-1.5 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              {searchTerm || filterMode !== "ALL"
                ? "Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc nguồn đầu vào."
                : "Khởi tạo dự án mới với Wizard 5 bước: nạp Figma, tài liệu PRD hoặc cào Live Domain để AI sinh toàn bộ kịch bản kiểm thử."}
            </p>
            <Link href="/projects/new" className="mt-5">
              <Button className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                <span>Bắt đầu Tạo Dự án</span>
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDeleteProject}
                onTriggerRun={handleTriggerRun}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
