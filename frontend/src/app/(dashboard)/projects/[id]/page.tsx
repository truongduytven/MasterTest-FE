"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Sparkles,
  Plus,
  Layers,
  FileSpreadsheet,
  FileText,
  ExternalLink,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Trash2,
  Edit,
  Code,
  Download,
  Figma,
  Globe,
  RefreshCw,
  Search,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { Project, TestCase, UseCase } from "@/types";
import { formatDate, getStatusColor } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { TestCaseModal } from "@/components/projects/test-case-modal";
import { IngestSourceModal } from "@/components/projects/ingest-source-modal";
import { GenerateModal } from "@/components/projects/generate-modal";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const projectId = params.id as string;

  const [project, setProject] = React.useState<Project | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>("test-suite");

  // Filter & Search states
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [priorityFilter, setPriorityFilter] = React.useState("ALL");

  // Modals
  const [isTestCaseModalOpen, setIsTestCaseModalOpen] = React.useState(false);
  const [editingTestCase, setEditingTestCase] = React.useState<TestCase | null>(null);
  const [activeUseCaseIdForAdd, setActiveUseCaseIdForAdd] = React.useState<string | null>(null);
  const [isIngestModalOpen, setIsIngestModalOpen] = React.useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = React.useState(false);

  const [isRunningSuite, setIsRunningSuite] = React.useState(false);

  const loadProject = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getProject(projectId);
      setProject(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    loadProject();
  }, [loadProject]);

  const handleTriggerRun = async () => {
    try {
      setIsRunningSuite(true);
      const run = await api.triggerTestRun(projectId);
      showToast({
        title: "Bắt đầu chạy kiểm thử!",
        description: `Khởi tạo Test Run #${run.runNumber}. Chuyển hướng tới kết quả thời gian thực.`,
        type: "success",
      });
      router.push(`/projects/${projectId}/runs/${run.id}`);
    } catch (err: any) {
      showToast({
        title: "Lỗi chạy kiểm thử",
        description: err.message,
        type: "error",
      });
      setIsRunningSuite(false);
    }
  };

  const handleSaveTestCase = async (tcData: Partial<TestCase>) => {
    if (editingTestCase) {
      await api.updateTestCase(editingTestCase.id, tcData);
      showToast({ title: "Cập nhật Test Case thành công", type: "success" });
    } else if (activeUseCaseIdForAdd) {
      await api.createTestCase(activeUseCaseIdForAdd, tcData as any);
      showToast({ title: "Tạo mới Test Case thành công", type: "success" });
    }
    loadProject();
  };

  const handleDeleteTestCase = async (tcId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa kịch bản kiểm thử này?")) {
      try {
        await api.deleteTestCase(tcId);
        showToast({ title: "Đã xóa Test Case", type: "info" });
        loadProject();
      } catch (err: any) {
        showToast({ title: "Lỗi khi xóa", description: err.message, type: "error" });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Đang tải thông tin dự án...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-6 dark:border-rose-900/60 dark:bg-rose-950/20">
          <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">
            Không tìm thấy dự án hoặc đã có lỗi xảy ra
          </p>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{error}</p>
          <Link href="/" className="inline-block mt-4">
            <Button variant="outline" size="sm">Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalTestCases =
    project.useCases?.reduce((acc, uc) => acc + (uc.testCases?.length || 0), 0) || 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title={project.name}
        subtitle={`Quản lý toàn bộ Test Suite, nguồn ngữ cảnh và lịch sử chạy E2E (${totalTestCases} Test Cases)`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                <span>Danh sách</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsIngestModalOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Nạp Nguồn</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsGenerateModalOpen(true)}
              className="gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-950/40"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI Generate</span>
            </Button>
            <Button
              size="sm"
              onClick={handleTriggerRun}
              isLoading={isRunningSuite}
              className="gap-1.5 bg-indigo-600 shadow-sm"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Chạy Test Suite</span>
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Project Metadata Banner */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {project.name}
              </h2>
              <Badge variant="default">{project.inputMode}</Badge>
            </div>
            {project.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                {project.description}
              </p>
            )}
            {project.targetDomainUrl && (
              <a
                href={project.targetDomainUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
              >
                <Globe className="h-3.5 w-3.5 shrink-0" />
                <span>{project.targetDomainUrl}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-3 md:pt-0 md:pl-6">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {project.useCases?.length || 0}
              </p>
              <p>Use Cases</p>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {totalTestCases}
              </p>
              <p>Test Cases</p>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {project.testRuns?.length || 0}
              </p>
              <p>Lượt Test</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="test-suite">
              <span className="flex items-center gap-1.5">
                <Code className="h-4 w-4" />
                <span>Bộ Test Suite ({totalTestCases})</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="sources">
              <span className="flex items-center gap-1.5">
                <Layers className="h-4 w-4" />
                <span>Nguồn Dữ Liệu ({project.inputSources?.length || 0})</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="runs">
              <span className="flex items-center gap-1.5">
                <History className="h-4 w-4" />
                <span>Lịch Sử Chạy ({project.testRuns?.length || 0})</span>
              </span>
            </TabsTrigger>
          </TabsList>

          {/* ======================================================= */}
          {/* TAB 1: TEST SUITE & PLAYWRIGHT STEPS                    */}
          {/* ======================================================= */}
          <TabsContent value="test-suite" className="space-y-4">
            {/* Filters bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm kịch bản, mã TC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="ALL">Tất cả phân loại</option>
                  <option value="POSITIVE">POSITIVE</option>
                  <option value="NEGATIVE">NEGATIVE</option>
                  <option value="BOUNDARY">BOUNDARY</option>
                  <option value="UI">UI</option>
                  <option value="FUNCTIONAL">FUNCTIONAL</option>
                  <option value="SECURITY_VALIDATION">SECURITY</option>
                  <option value="PERFORMANCE">PERFORMANCE</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="ALL">Mọi độ ưu tiên</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>

            {/* List of Use Cases & Test Cases */}
            {(!project.useCases || project.useCases.length === 0) ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
                <Sparkles className="mx-auto h-8 w-8 text-indigo-500" />
                <h4 className="mt-3 text-sm font-semibold">Chưa có Kịch bản nào trong dự án</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Hãy bấm "AI Generate" để Gemini phân tích Figma/PRD hoặc thêm kịch bản thủ công.
                </p>
                <Button
                  onClick={() => setIsGenerateModalOpen(true)}
                  className="mt-4 gap-1.5 bg-indigo-600"
                  size="sm"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Kích hoạt Gemini Sinh Ngay</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {project.useCases.map((uc) => {
                  const filteredCases = uc.testCases?.filter((tc) => {
                    const matchText =
                      tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      tc.code.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchCategory =
                      categoryFilter === "ALL" || tc.category === categoryFilter;
                    const matchPriority =
                      priorityFilter === "ALL" || tc.priority === priorityFilter;
                    return matchText && matchCategory && matchPriority;
                  });

                  if (searchQuery && filteredCases?.length === 0) return null;

                  return (
                    <Card key={uc.id} className="border-slate-200 dark:border-slate-800">
                      <CardHeader className="py-3 px-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Badge variant="default" size="sm">{uc.code}</Badge>
                            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                              {uc.name}
                            </h3>
                            <span className="text-xs text-slate-400">
                              (Actor: {uc.actor})
                            </span>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActiveUseCaseIdForAdd(uc.id);
                              setEditingTestCase(null);
                              setIsTestCaseModalOpen(true);
                            }}
                            className="gap-1 text-xs h-7"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Thêm Kịch bản</span>
                          </Button>
                        </div>
                        {uc.description && (
                          <p className="text-xs text-slate-500 mt-1">{uc.description}</p>
                        )}
                      </CardHeader>

                      <CardContent className="p-3 divide-y divide-slate-100 dark:divide-slate-800/60">
                        {filteredCases && filteredCases.length > 0 ? (
                          filteredCases.map((tc) => (
                            <div
                              key={tc.id}
                              className="py-3 first:pt-1 last:pb-1 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="secondary" size="sm">{tc.code}</Badge>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {tc.title}
                                  </span>
                                  <Badge
                                    variant={
                                      tc.category === "POSITIVE"
                                        ? "success"
                                        : tc.category === "NEGATIVE"
                                        ? "danger"
                                        : "warning"
                                    }
                                    size="sm"
                                  >
                                    {tc.category}
                                  </Badge>
                                  <Badge variant="outline" size="sm">
                                    {tc.priority}
                                  </Badge>
                                </div>

                                <p className="text-slate-600 dark:text-slate-300">
                                  <strong>Kết quả mong đợi:</strong> {tc.expectedResult}
                                </p>

                                {tc.steps && Array.isArray(tc.steps) && tc.steps.length > 0 && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
                                    <span className="font-medium text-slate-500">
                                      Playwright Steps:
                                    </span>
                                    {tc.steps.map((st, i) => (
                                      <span
                                        key={i}
                                        className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                      >
                                        {st.stepNo}. {st.action} {st.selector ? `(${st.selector})` : ""}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingTestCase(tc);
                                    setIsTestCaseModalOpen(true);
                                  }}
                                  className="h-7 text-xs"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  <span>Sửa</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteTestCase(tc.id)}
                                  className="h-7 w-7 text-rose-500 hover:text-rose-700"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 py-2 italic text-center">
                            Không có kịch bản nào khớp bộ lọc trong Use Case này.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ======================================================= */}
          {/* TAB 2: INPUT SOURCES                                    */}
          {/* ======================================================= */}
          <TabsContent value="sources" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Các nguồn dữ liệu đã nạp vào dự án ({project.inputSources?.length || 0})
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsIngestModalOpen(true)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Nạp Thêm Nguồn</span>
              </Button>
            </div>

            {(!project.inputSources || project.inputSources.length === 0) ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                <Layers className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm font-semibold">Chưa có nguồn dữ liệu nào được nạp</p>
                <Button
                  onClick={() => setIsIngestModalOpen(true)}
                  className="mt-3 gap-1.5 bg-indigo-600"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nạp Nguồn Ngay</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.inputSources.map((source) => (
                  <Card key={source.id} className="border-slate-200 dark:border-slate-800">
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {source.sourceType === "FIGMA" && <Figma className="h-4 w-4 text-indigo-600" />}
                          {source.sourceType === "SRS_DOC" && <FileText className="h-4 w-4 text-emerald-600" />}
                          {source.sourceType === "DOM_CRAWL" && <Globe className="h-4 w-4 text-sky-600" />}
                          <CardTitle className="text-sm font-semibold">
                            {source.sourceType}
                          </CardTitle>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {formatDate(source.createdAt)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-2 text-xs">
                      {source.figmaUrl && (
                        <p className="truncate text-slate-600 dark:text-slate-300">
                          <strong>URL:</strong> {source.figmaUrl}
                        </p>
                      )}
                      {source.designImageUrl && (
                        <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 max-h-48">
                          <img
                            src={source.designImageUrl}
                            alt="Design Frame"
                            className="w-full object-cover"
                          />
                        </div>
                      )}
                      {source.srsRawText && (
                        <div className="rounded-lg bg-slate-50 p-2.5 font-mono text-[11px] text-slate-600 max-h-36 overflow-y-auto dark:bg-slate-800/60 dark:text-slate-300">
                          {source.srsRawText.substring(0, 300)}...
                        </div>
                      )}
                      {source.domSnapshotJson && (
                        <p className="text-slate-500">
                          Đã quét snapshot DOM ({Object.keys(source.domSnapshotJson).length} phần tử tương tác)
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ======================================================= */}
          {/* TAB 3: TEST RUN HISTORY & EXPORT                        */}
          {/* ======================================================= */}
          <TabsContent value="runs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Lịch sử các phiên kiểm thử E2E ({project.testRuns?.length || 0})
              </h3>
              <Button
                size="sm"
                onClick={handleTriggerRun}
                isLoading={isRunningSuite}
                className="gap-1.5 bg-indigo-600"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Khởi chạy Phiên Mới</span>
              </Button>
            </div>

            {(!project.testRuns || project.testRuns.length === 0) ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                <History className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm font-semibold">Chưa có phiên chạy kiểm thử nào</p>
                <p className="text-xs text-slate-500 mt-1">
                  Bấm nút "Khởi chạy Phiên Mới" để Playwright tự động chạy toàn bộ các kịch bản.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {project.testRuns.map((run) => (
                  <div
                    key={run.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                        #{run.runNumber}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              run.status === "COMPLETED" || run.status === "PASS"
                                ? "success"
                                : run.status === "FAILED" || run.status === "FAIL"
                                ? "danger"
                                : "warning"
                            }
                          >
                            {run.status}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            Khởi chạy: {formatDate(run.startedAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                          <span>Tổng: <strong>{run.totalCases}</strong></span>
                          <span className="text-emerald-600">Pass: <strong>{run.passedCases}</strong></span>
                          <span className="text-rose-600">Fail: <strong>{run.failedCases}</strong></span>
                          <span className="text-amber-600">Pending: <strong>{run.pendingCases}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={api.getExcelExportUrl(run.id)}
                        download
                        className="inline-flex"
                        title="Tải báo cáo Excel 3 sheets"
                      >
                        <Button variant="outline" size="sm" className="gap-1 text-xs">
                          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Excel</span>
                        </Button>
                      </a>

                      <a
                        href={api.getPdfExportUrl(run.id)}
                        download
                        className="inline-flex"
                        title="Tải báo cáo PDF"
                      >
                        <Button variant="outline" size="sm" className="gap-1 text-xs">
                          <FileText className="h-3.5 w-3.5 text-rose-600" />
                          <span>PDF</span>
                        </Button>
                      </a>

                      <Link href={`/projects/${project.id}/runs/${run.id}`}>
                        <Button size="sm" className="text-xs bg-indigo-600">
                          Xem chi tiết & ảnh
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Modal: Edit / Create Test Case */}
        <TestCaseModal
          isOpen={isTestCaseModalOpen}
          onClose={() => setIsTestCaseModalOpen(false)}
          onSave={handleSaveTestCase}
          initialData={editingTestCase}
        />

        {/* Modal: Ingest More Sources */}
        <IngestSourceModal
          isOpen={isIngestModalOpen}
          onClose={() => setIsIngestModalOpen(false)}
          projectId={projectId}
          onSuccess={loadProject}
        />

        {/* Modal: AI Generate Scenarios */}
        <GenerateModal
          isOpen={isGenerateModalOpen}
          onClose={() => setIsGenerateModalOpen(false)}
          projectId={projectId}
          onSuccess={loadProject}
        />
      </div>
    </div>
  );
}
