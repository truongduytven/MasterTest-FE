"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Terminal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  Edit,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RunMetrics } from "@/components/runs/run-metrics";
import { ScreenshotModal } from "@/components/runs/screenshot-modal";
import { ManualOverrideModal } from "@/components/runs/manual-override-modal";
import { api } from "@/lib/api";
import { TestExecutionItem, TestRun, TestStatus } from "@/types";
import { formatDate, formatDuration, getStatusColor } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export default function TestRunDetailPage() {
  const params = useParams();
  const { showToast } = useToast();
  const projectId = params.id as string;
  const runId = params.runId as string;

  const [run, setRun] = React.useState<TestRun | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Live SSE stream states
  const [streamLogs, setStreamLogs] = React.useState<string[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const logTerminalRef = React.useRef<HTMLDivElement>(null);

  // Modals
  const [selectedScreenshot, setSelectedScreenshot] = React.useState<{
    url: string;
    code: string;
    title: string;
  } | null>(null);
  const [overrideItem, setOverrideItem] = React.useState<TestExecutionItem | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [expandedErrors, setExpandedErrors] = React.useState<Record<string, boolean>>({});

  const loadRun = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getTestRun(runId);
      setRun(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [runId]);

  React.useEffect(() => {
    loadRun();
  }, [loadRun]);

  // Connect to SSE Stream when run is PENDING or RUNNING
  React.useEffect(() => {
    if (!run) return;
    const isOngoing = run.status === "PENDING" || run.status === "RUNNING";

    if (!isOngoing) {
      setIsStreaming(false);
      return;
    }

    let eventSource: EventSource | null = null;
    try {
      const streamUrl = api.getRunStreamUrl(runId);
      eventSource = new EventSource(streamUrl);
      setIsStreaming(true);

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const time = new Date().toLocaleTimeString();

          if (parsed.message) {
            setStreamLogs((prev) => [...prev, `[${time}] ${parsed.message}`]);
          }

          if (parsed.type === "ITEM_UPDATE" && parsed.item) {
            setRun((prevRun) => {
              if (!prevRun) return prevRun;
              const items = prevRun.executionItems || [];
              const updatedItems = items.map((it) =>
                it.id === parsed.item.id ? { ...it, ...parsed.item } : it
              );
              return { ...prevRun, executionItems: updatedItems };
            });
          }

          if (parsed.type === "RUN_COMPLETE" || parsed.type === "RUN_ERROR") {
            loadRun();
            if (eventSource) eventSource.close();
            setIsStreaming(false);
          }
        } catch {
          // Plain text fallback
          setStreamLogs((prev) => [...prev, event.data]);
        }
      };

      eventSource.onerror = () => {
        setIsStreaming(false);
        if (eventSource) eventSource.close();
      };
    } catch (err) {
      setIsStreaming(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [run?.status, runId, loadRun]);

  // Auto-scroll log terminal
  React.useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [streamLogs]);

  const toggleErrorExpand = (id: string) => {
    setExpandedErrors((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Đang tải kết quả kiểm thử...</p>
        </div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-6 dark:border-rose-900/60 dark:bg-rose-950/20">
          <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">
            Không thể tải thông tin Test Run
          </p>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{error}</p>
          <Link href={`/projects/${projectId}`} className="inline-block mt-4">
            <Button variant="outline" size="sm">Quay lại Dự án</Button>
          </Link>
        </div>
      </div>
    );
  }

  const executionItems = run.executionItems || [];
  const filteredItems = executionItems.filter((item) => {
    if (statusFilter === "ALL") return true;
    return item.status === statusFilter;
  });

  const durationMs =
    run.completedAt && run.startedAt
      ? new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()
      : null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title={`Kết Quả Kiểm Thử: Run #${run.runNumber}`}
        subtitle={`Báo cáo thực thi E2E tự động, log Playwright và bằng chứng Cloudinary`}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/projects/${projectId}`}>
              <Button variant="outline" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                <span>Về Dự án</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={loadRun}
              className="gap-1.5"
              title="Làm mới"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>

            <a href={api.getExcelExportUrl(runId)} download className="inline-flex">
              <Button variant="outline" size="sm" className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Xuất Excel</span>
              </Button>
            </a>

            <a href={api.getPdfExportUrl(runId)} download className="inline-flex">
              <Button variant="outline" size="sm" className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-800">
                <FileText className="h-4 w-4" />
                <span>Xuất PDF</span>
              </Button>
            </a>
          </div>
        }
      />

      <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Status Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 text-lg">
              #{run.runNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Phiên kiểm thử #{run.runNumber}
                </h2>
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
                {isStreaming && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-medium animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    SSE Streaming...
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Bắt đầu: {formatDate(run.startedAt)}{" "}
                {run.completedAt && `• Hoàn tất: ${formatDate(run.completedAt)}`}
              </p>
            </div>
          </div>
        </div>

        {/* Top Metrics Cards */}
        <RunMetrics
          total={run.totalCases}
          passed={run.passedCases}
          failed={run.failedCases}
          pending={run.pendingCases}
          status={run.status}
          durationMs={durationMs}
        />

        {/* Live SSE Streaming Terminal (if ongoing or logs present) */}
        {(isStreaming || streamLogs.length > 0) && (
          <Card className="border-slate-800 bg-slate-950 text-slate-200 shadow-md">
            <CardHeader className="py-2.5 px-4 border-b border-slate-800 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <Terminal className="h-4 w-4" />
                <span>Tiến trình chạy Playwright theo thời gian thực (SSE Stream)</span>
              </div>
              <span className="text-[11px] text-slate-500">
                {streamLogs.length} sự kiện ghi nhận
              </span>
            </CardHeader>
            <CardContent className="p-3">
              <div
                ref={logTerminalRef}
                className="h-44 overflow-y-auto font-mono text-xs space-y-1 text-slate-300 select-text"
              >
                {streamLogs.length === 0 ? (
                  <p className="text-slate-500 italic">Đang chờ sự kiện đầu tiên từ runner...</p>
                ) : (
                  streamLogs.map((log, i) => (
                    <div key={i} className="leading-relaxed">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter and Execution Table */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Chi tiết Thực thi từng Kịch bản ({filteredItems.length} / {executionItems.length})
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Lọc trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="ALL">Tất cả ({executionItems.length})</option>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="SKIPPED">SKIPPED</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
              <Clock className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm font-semibold">Không có kịch bản nào khớp bộ lọc</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const statusColor = getStatusColor(item.status);
                const isErrorExpanded = expandedErrors[item.id] || false;

                return (
                  <Card
                    key={item.id}
                    className={`border transition-all ${
                      item.status === "FAIL"
                        ? "border-rose-200 dark:border-rose-900/60"
                        : item.status === "PASS"
                        ? "border-slate-200 dark:border-slate-800"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="p-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                      {/* Left: Metadata & Result */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <Badge
                            variant={
                              item.status === "PASS"
                                ? "success"
                                : item.status === "FAIL"
                                ? "danger"
                                : "warning"
                            }
                          >
                            {item.status}
                          </Badge>

                          <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
                            {item.testCase?.code || "TC"}
                          </span>

                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                            {item.testCase?.title || "Không có tiêu đề kịch bản"}
                          </span>

                          {item.durationMs !== null && item.durationMs !== undefined && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({formatDuration(item.durationMs)})
                            </span>
                          )}
                        </div>

                        {item.testCase?.expectedResult && (
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            <strong>Mong đợi:</strong> {item.testCase.expectedResult}
                          </p>
                        )}

                        {item.actualResult && (
                          <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                            <strong>Thực tế:</strong> {item.actualResult}
                          </p>
                        )}

                        {/* Error log with collapsible view */}
                        {item.errorLog && (
                          <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                            <button
                              type="button"
                              onClick={() => toggleErrorExpand(item.id)}
                              className="flex items-center justify-between w-full font-semibold text-rose-700 dark:text-rose-300"
                            >
                              <span>Chi tiết lỗi / Exception Log</span>
                              {isErrorExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                            {isErrorExpanded ? (
                              <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] text-rose-800 dark:text-rose-200">
                                {item.errorLog}
                              </pre>
                            ) : (
                              <p className="mt-1 line-clamp-1 font-mono text-[11px] text-rose-800 dark:text-rose-300">
                                {item.errorLog}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Cloudinary Evidence & Actions */}
                      <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
                        {item.screenshotUrl ? (
                          <div
                            onClick={() =>
                              setSelectedScreenshot({
                                url: item.screenshotUrl!,
                                code: item.testCase?.code || "TC",
                                title: item.testCase?.title || "Evidence",
                              })
                            }
                            className="group relative cursor-pointer overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-transform hover:scale-105"
                          >
                            <img
                              src={item.screenshotUrl}
                              alt="Screenshot evidence"
                              className="h-16 w-28 object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 text-white text-[11px] font-medium gap-1">
                              <Eye className="h-3.5 w-3.5" />
                              <span>Xem ảnh</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Chưa có ảnh bằng chứng
                          </span>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOverrideItem(item)}
                          className="h-7 text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          <span>Cập nhật thủ công</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Screenshot full inspection modal */}
        {selectedScreenshot && (
          <ScreenshotModal
            isOpen={!!selectedScreenshot}
            onClose={() => setSelectedScreenshot(null)}
            screenshotUrl={selectedScreenshot.url}
            testCaseCode={selectedScreenshot.code}
            title={`Bằng chứng kiểm thử: ${selectedScreenshot.code} - ${selectedScreenshot.title}`}
          />
        )}

        {/* Manual QA override modal */}
        {overrideItem && (
          <ManualOverrideModal
            isOpen={!!overrideItem}
            onClose={() => setOverrideItem(null)}
            item={overrideItem}
            onSuccess={loadRun}
          />
        )}
      </div>
    </div>
  );
}
