"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Figma,
  FileText,
  Globe,
  Sparkles,
  Play,
  Layers,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { InputMode, Project, TestCase, UseCase } from "@/types";
import { useToast } from "@/components/ui/toast";
import { TestCaseModal } from "@/components/projects/test-case-modal";

export default function NewProjectWizardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [createdProject, setCreatedProject] = React.useState<Project | null>(null);

  // Step 1: Project Metadata & Mode
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [inputMode, setInputMode] = React.useState<InputMode>("FIGMA_AND_DOCS");
  const [targetDomainUrl, setTargetDomainUrl] = React.useState("");
  const [authConfigJson, setAuthConfigJson] = React.useState("");
  const [isCreatingProject, setIsCreatingProject] = React.useState(false);

  // Step 2: Ingestion Data Sources
  const [figmaUrl, setFigmaUrl] = React.useState("");
  const [figmaToken, setFigmaToken] = React.useState("");
  const [docFile, setDocFile] = React.useState<File | null>(null);
  const [docRawText, setDocRawText] = React.useState("");
  const [docInputType, setDocInputType] = React.useState<"file" | "text">("text");

  const [isIngesting, setIsIngesting] = React.useState(false);
  const [ingestStatus, setIngestStatus] = React.useState<{
    figma?: "idle" | "loading" | "done" | "error";
    doc?: "idle" | "loading" | "done" | "error";
    domain?: "idle" | "loading" | "done" | "error";
  }>({});

  // Step 3: AI Generation & Review
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [customPrompt, setCustomPrompt] = React.useState("");
  const [generatedUseCases, setGeneratedUseCases] = React.useState<UseCase[]>([]);
  const [editingTestCase, setEditingTestCase] = React.useState<TestCase | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [activeUseCaseIdForAdd, setActiveUseCaseIdForAdd] = React.useState<string | null>(null);

  // Step 4: Run Trigger
  const [isStartingRun, setIsStartingRun] = React.useState(false);

  // -------------------------------------------------------------
  // STEP 1 HANDLER: Create Project Record
  // -------------------------------------------------------------
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast({ title: "Vui lòng nhập tên dự án", type: "error" });
      return;
    }

    try {
      setIsCreatingProject(true);
      let parsedAuth = null;
      if (authConfigJson.trim()) {
        try {
          parsedAuth = JSON.parse(authConfigJson);
        } catch {
          parsedAuth = { raw: authConfigJson };
        }
      }

      const project = await api.createProject({
        name,
        description: description.trim() || undefined,
        inputMode,
        targetDomainUrl: targetDomainUrl.trim() || undefined,
        authConfig: parsedAuth,
      });

      setCreatedProject(project);
      showToast({
        title: "Tạo dự án thành công!",
        description: `Dự án "${project.name}" đã được khởi tạo. Tiếp tục nạp nguồn dữ liệu.`,
        type: "success",
      });
      setCurrentStep(2);
    } catch (err: any) {
      showToast({
        title: "Lỗi khởi tạo dự án",
        description: err.message,
        type: "error",
      });
    } finally {
      setIsCreatingProject(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 2 HANDLER: Ingestion
  // -------------------------------------------------------------
  const handleRunIngestion = async () => {
    if (!createdProject) return;
    setIsIngesting(true);
    setIngestStatus({});

    try {
      // 1. Ingest Figma if provided
      if (figmaUrl.trim()) {
        setIngestStatus((prev) => ({ ...prev, figma: "loading" }));
        try {
          await api.ingestFigma(createdProject.id, {
            figmaUrl: figmaUrl.trim(),
            figmaToken: figmaToken.trim() || undefined,
          });
          setIngestStatus((prev) => ({ ...prev, figma: "done" }));
        } catch (err) {
          setIngestStatus((prev) => ({ ...prev, figma: "error" }));
        }
      }

      // 2. Ingest Document if provided
      if (docInputType === "file" && docFile) {
        setIngestStatus((prev) => ({ ...prev, doc: "loading" }));
        try {
          await api.ingestDocumentFile(createdProject.id, docFile);
          setIngestStatus((prev) => ({ ...prev, doc: "done" }));
        } catch (err) {
          setIngestStatus((prev) => ({ ...prev, doc: "error" }));
        }
      } else if (docInputType === "text" && docRawText.trim()) {
        setIngestStatus((prev) => ({ ...prev, doc: "loading" }));
        try {
          await api.ingestDocumentText(createdProject.id, docRawText.trim(), "prd-spec.md");
          setIngestStatus((prev) => ({ ...prev, doc: "done" }));
        } catch (err) {
          setIngestStatus((prev) => ({ ...prev, doc: "error" }));
        }
      }

      // 3. Ingest Domain if provided or mode requires domain
      const domainToCrawl = targetDomainUrl.trim() || createdProject.targetDomainUrl;
      if (domainToCrawl) {
        setIngestStatus((prev) => ({ ...prev, domain: "loading" }));
        try {
          await api.ingestDomain(createdProject.id, { url: domainToCrawl });
          setIngestStatus((prev) => ({ ...prev, domain: "done" }));
        } catch (err) {
          setIngestStatus((prev) => ({ ...prev, domain: "error" }));
        }
      }

      showToast({
        title: "Hoàn tất thu thập ngữ cảnh",
        description: "Các nguồn dữ liệu đã được xử lý và lưu vào cơ sở dữ liệu.",
        type: "success",
      });

      // Move to Step 3
      setCurrentStep(3);
      // Auto-trigger scenario generation
      triggerAIGeneration();
    } catch (err: any) {
      showToast({
        title: "Có lỗi khi nạp nguồn dữ liệu",
        description: err.message,
        type: "error",
      });
    } finally {
      setIsIngesting(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 3 HANDLER: AI Generation
  // -------------------------------------------------------------
  const triggerAIGeneration = async () => {
    if (!createdProject) return;
    try {
      setIsGenerating(true);
      await api.generateScenarios(createdProject.id, {
        customPrompt: customPrompt.trim() || undefined,
      });

      // Refetch project to get generated use cases
      const updated = await api.getProject(createdProject.id);
      setCreatedProject(updated);
      setGeneratedUseCases(updated.useCases || []);

      showToast({
        title: "Gemini 2.5 đã tạo xong kịch bản kiểm thử!",
        description: `Tổng cộng ${updated.useCases?.length || 0} Use Cases. Bạn có thể kiểm tra và chỉnh sửa.`,
        type: "success",
      });
    } catch (err: any) {
      showToast({
        title: "Lỗi sinh kịch bản AI",
        description: err.message,
        type: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTestCaseModal = async (tcData: Partial<TestCase>) => {
    if (!createdProject) return;
    if (editingTestCase) {
      // Update existing
      await api.updateTestCase(editingTestCase.id, tcData);
    } else if (activeUseCaseIdForAdd) {
      // Create new
      await api.createTestCase(activeUseCaseIdForAdd, tcData as any);
    }
    // Refresh
    const updated = await api.getProject(createdProject.id);
    setCreatedProject(updated);
    setGeneratedUseCases(updated.useCases || []);
  };

  const handleDeleteTestCase = async (tcId: string) => {
    if (!createdProject) return;
    if (confirm("Bạn có chắc chắn muốn xóa kịch bản này?")) {
      await api.deleteTestCase(tcId);
      const updated = await api.getProject(createdProject.id);
      setCreatedProject(updated);
      setGeneratedUseCases(updated.useCases || []);
      showToast({ title: "Đã xóa Test Case", type: "info" });
    }
  };

  // -------------------------------------------------------------
  // STEP 4 HANDLER: Start Test Run
  // -------------------------------------------------------------
  const handleStartSuiteRun = async () => {
    if (!createdProject) return;
    try {
      setIsStartingRun(true);
      const run = await api.triggerTestRun(createdProject.id);
      showToast({
        title: "Bắt đầu chạy Test Suite!",
        description: `Khởi tạo Run #${run.runNumber}. Chuyển hướng tới bảng theo dõi trực tiếp.`,
        type: "success",
      });
      router.push(`/projects/${createdProject.id}/runs/${run.id}`);
    } catch (err: any) {
      showToast({
        title: "Lỗi khởi chạy kiểm thử",
        description: err.message,
        type: "error",
      });
      setIsStartingRun(false);
    }
  };

  // Step indicator items
  const steps = [
    { num: 1, label: "Tạo Dự án" },
    { num: 2, label: "Nạp Ngữ cảnh" },
    { num: 3, label: "AI Sinh Kịch bản" },
    { num: 4, label: "Thực thi E2E" },
    { num: 5, label: "Báo cáo" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Wizard 5 Bước Khởi Tạo Dự Án & Kịch Bản Kiểm Thử"
        subtitle="Chuẩn hóa đầu vào Figma, PRD, Crawl DOM và tạo kịch bản tự động bằng Gemini 2.5"
        actions={
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại Dashboard</span>
            </Button>
          </Link>
        }
      />

      <div className="flex-1 p-6 max-w-5xl w-full mx-auto space-y-6">
        {/* Step Stepper Header */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      currentStep > s.num
                        ? "bg-emerald-600 text-white"
                        : currentStep === s.num
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                    }`}
                  >
                    {currentStep > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                  </div>
                  <span
                    className={`hidden sm:inline text-xs font-semibold ${
                      currentStep === s.num
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-colors ${
                      currentStep > idx + 1
                        ? "bg-emerald-500"
                        : "bg-slate-200 dark:bg-slate-800"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* STEP 1: CREATE PROJECT & INPUT MODE                       */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Bước 1: Khởi tạo Dự án & Chọn Nguồn Nạp Dữ Liệu</CardTitle>
              <CardDescription>
                Hệ thống hỗ trợ 3 chế độ nạp đầu vào: Live Domain thực tế, Thiết kế Figma kèm tài liệu PRD, hoặc kết hợp cả hai (Hybrid).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <Input
                  label="Tên Dự án (Project Name)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="VD: Cổng Thanh Toán Web & Mobile, Ứng dụng E-Commerce v2"
                />

                <Textarea
                  label="Mô tả dự án (Tùy chọn)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả ngắn gọn phạm vi và mục tiêu kiểm thử của dự án..."
                  rows={2}
                />

                {/* Input Mode Selector */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Chế độ nạp dữ liệu (Input Mode)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div
                      onClick={() => setInputMode("FIGMA_AND_DOCS")}
                      className={`cursor-pointer rounded-xl border p-4 transition-all ${
                        inputMode === "FIGMA_AND_DOCS"
                          ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/30 dark:border-indigo-500 dark:bg-indigo-950/30"
                          : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Figma className="h-5 w-5 text-indigo-600" />
                        <span className="font-semibold text-sm">Figma & PRD Docs</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Phù hợp giai đoạn phát triển khi chưa có web chạy thực tế (Static Design QA).
                      </p>
                    </div>

                    <div
                      onClick={() => setInputMode("DOMAIN_ONLY")}
                      className={`cursor-pointer rounded-xl border p-4 transition-all ${
                        inputMode === "DOMAIN_ONLY"
                          ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/30 dark:border-indigo-500 dark:bg-indigo-950/30"
                          : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-sky-600" />
                        <span className="font-semibold text-sm">Live Domain URL</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Cào trực tiếp cấu trúc DOM thực tế và thực thi Playwright E2E tự động.
                      </p>
                    </div>

                    <div
                      onClick={() => setInputMode("HYBRID")}
                      className={`cursor-pointer rounded-xl border p-4 transition-all ${
                        inputMode === "HYBRID"
                          ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/30 dark:border-indigo-500 dark:bg-indigo-950/30"
                          : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-emerald-600" />
                        <span className="font-semibold text-sm">Chế độ kết hợp (Hybrid)</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Đối chiếu Figma + PRD với Domain thực tế, kiểm tra Visual Regression bằng AI.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Target Domain URL if applicable */}
                {(inputMode === "DOMAIN_ONLY" || inputMode === "HYBRID") && (
                  <Input
                    label="Địa chỉ Domain Kiểm thử (Target Domain URL)"
                    type="url"
                    value={targetDomainUrl}
                    onChange={(e) => setTargetDomainUrl(e.target.value)}
                    required={inputMode === "DOMAIN_ONLY"}
                    placeholder="https://staging.myapp.com"
                    helperText="URL môi trường test/staging nơi Playwright sẽ tương tác"
                  />
                )}

                {/* Auth config JSON */}
                <Textarea
                  label="Cấu hình Xác thực / Bypass Token / Session Cookie (Tùy chọn)"
                  rows={2}
                  value={authConfigJson}
                  onChange={(e) => setAuthConfigJson(e.target.value)}
                  placeholder={`{\n  "cookies": [{ "name": "token", "value": "xyz" }],\n  "headers": { "Authorization": "Bearer ..." }\n}`}
                  helperText="Dùng để Playwright nạp vào BrowserContext khi web yêu cầu đăng nhập trước khi test"
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="submit"
                    isLoading={isCreatingProject}
                    className="gap-2 bg-indigo-600 shadow-sm"
                  >
                    <span>Lưu & Tiếp tục Bước 2</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ========================================================= */}
        {/* STEP 2: CONTEXT INGESTION & PARSING                       */}
        {/* ========================================================= */}
        {currentStep === 2 && createdProject && (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Bước 2: Thu Thập & Chuẩn Hóa Ngữ Cảnh</CardTitle>
              <CardDescription>
                Cung cấp đường link Figma, tải lên tài liệu PRD hoặc xác nhận cào dữ liệu từ Domain.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Figma Section */}
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Figma className="h-5 w-5 text-indigo-600" />
                    <h4 className="font-semibold text-sm">Nguồn Thiết kế Figma</h4>
                  </div>
                  {ingestStatus.figma === "done" && (
                    <Badge variant="success">Đã trích xuất</Badge>
                  )}
                  {ingestStatus.figma === "loading" && (
                    <Badge variant="info">Đang trích xuất...</Badge>
                  )}
                </div>

                <Input
                  label="Figma File/Node URL"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  placeholder="https://www.figma.com/design/KEY/Title?node-id=1-2"
                />

                <Input
                  label="Figma Access Token (nếu private)"
                  type="password"
                  value={figmaToken}
                  onChange={(e) => setFigmaToken(e.target.value)}
                  placeholder="figd_..."
                />
              </div>

              {/* Document Section */}
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    <h4 className="font-semibold text-sm">Tài liệu Đặc tả Nghiệp vụ (PRD / SRS)</h4>
                  </div>
                  {ingestStatus.doc === "done" && (
                    <Badge variant="success">Đã nạp văn bản</Badge>
                  )}
                  {ingestStatus.doc === "loading" && (
                    <Badge variant="info">Đang xử lý...</Badge>
                  )}
                </div>

                <div className="flex gap-4 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setDocInputType("text")}
                    className={docInputType === "text" ? "text-indigo-600 border-b-2 border-indigo-600 pb-1" : "text-slate-500"}
                  >
                    Dán văn bản trực tiếp
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocInputType("file")}
                    className={docInputType === "file" ? "text-indigo-600 border-b-2 border-indigo-600 pb-1" : "text-slate-500"}
                  >
                    Tải lên file (.docx, .pdf, .md)
                  </button>
                </div>

                {docInputType === "text" ? (
                  <Textarea
                    rows={4}
                    value={docRawText}
                    onChange={(e) => setDocRawText(e.target.value)}
                    placeholder="Mô tả chức năng, quy tắc kiểm tra (validation), điều kiện thành công..."
                  />
                ) : (
                  <input
                    type="file"
                    accept=".pdf,.docx,.md,.txt"
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                )}
              </div>

              {/* Domain crawl summary */}
              {targetDomainUrl && (
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-sky-600" />
                      <h4 className="font-semibold text-sm">Quét DOM từ Domain Thực tế</h4>
                    </div>
                    {ingestStatus.domain === "done" && (
                      <Badge variant="success">Đã cào DOM</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Playwright Headless sẽ tự động quét form, input, button tại:{" "}
                    <code className="text-indigo-600 dark:text-indigo-400">{targetDomainUrl}</code>
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Quay lại Bước 1</span>
                </Button>

                <Button
                  onClick={handleRunIngestion}
                  isLoading={isIngesting}
                  className="gap-2 bg-indigo-600 shadow-sm"
                >
                  <span>Bắt đầu Nạp & Chuẩn hóa Ngữ cảnh</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ========================================================= */}
        {/* STEP 3: AI SCENARIO GENERATION & REVIEW                   */}
        {/* ========================================================= */}
        {currentStep === 3 && createdProject && (
          <div className="space-y-4">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle>Bước 3: AI Tổng Hợp Use Case & Test Case</CardTitle>
                    <CardDescription>
                      Gemini 2.5 phân tích toàn bộ dữ liệu ngữ cảnh để sinh 3 nhóm kịch bản: Positive, Negative và Boundary.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={triggerAIGeneration}
                    isLoading={isGenerating}
                    variant="outline"
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <span>Tạo lại bằng AI</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center p-12 space-y-3">
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Gemini 2.5 Flash đang phân tích ngữ cảnh và sinh JSON Test Cases...
                    </p>
                    <p className="text-xs text-slate-400">
                      Đang xử lý cấu trúc cây Frame Figma, DOM snapshot và quy tắc nghiệp vụ PRD.
                    </p>
                  </div>
                ) : generatedUseCases.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 text-center dark:border-amber-900/60 dark:bg-amber-950/20">
                    <AlertCircle className="mx-auto h-8 w-8 text-amber-500" />
                    <p className="mt-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                      Chưa có kịch bản nào được sinh
                    </p>
                    <Button
                      onClick={triggerAIGeneration}
                      className="mt-3 gap-2 bg-indigo-600"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Kích hoạt Gemini Sinh Ngay</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {generatedUseCases.map((uc) => (
                      <div
                        key={uc.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="default">{uc.code}</Badge>
                            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                              {uc.name}
                            </h4>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActiveUseCaseIdForAdd(uc.id);
                              setEditingTestCase(null);
                              setIsEditModalOpen(true);
                            }}
                            className="gap-1 text-xs"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Thêm Test Case</span>
                          </Button>
                        </div>

                        {uc.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {uc.description}
                          </p>
                        )}

                        <div className="space-y-2">
                          {uc.testCases?.map((tc) => (
                            <div
                              key={tc.id}
                              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900"
                            >
                              <div className="flex items-center gap-2.5">
                                <Badge variant="secondary" size="sm">
                                  {tc.code}
                                </Badge>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
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
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingTestCase(tc);
                                    setIsEditModalOpen(true);
                                  }}
                                  className="text-xs"
                                >
                                  Chỉnh sửa
                                </Button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTestCase(tc.id)}
                                  className="text-rose-500 hover:text-rose-700 p-1"
                                  title="Xóa kịch bản"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Quay lại Bước 2</span>
                  </Button>

                  <Button
                    onClick={() => setCurrentStep(4)}
                    className="gap-2 bg-indigo-600 shadow-sm"
                  >
                    <span>Chốt Kịch bản & Tiếp tục Bước 4</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4 & 5: RUN EXECUTION & COMPLETION                    */}
        {/* ========================================================= */}
        {currentStep >= 4 && createdProject && (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Bước 4 & 5: Thực Thi Kiểm Thử Tự Động & Xuất Báo Cáo</CardTitle>
              <CardDescription>
                Bộ Test Suite đã sẵn sàng. Bạn có thể kích hoạt Playwright chạy E2E ngay bây giờ hoặc xem lại chi tiết trong trang Dự án.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 text-center">
                  <p className="text-xs text-slate-500">Dự án</p>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {createdProject.name}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 text-center">
                  <p className="text-xs text-slate-500">Use Cases</p>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {generatedUseCases.length} luồng nghiệp vụ
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60 text-center">
                  <p className="text-xs text-slate-500">Tổng Test Cases</p>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {generatedUseCases.reduce(
                      (acc, uc) => acc + (uc.testCases?.length || 0),
                      0
                    )}{" "}
                    kịch bản
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-indigo-950 dark:text-indigo-200">
                    Khởi chạy phiên kiểm thử tự động ngay
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Playwright sẽ chạy các kịch bản test, chụp ảnh màn hình đẩy lên Cloudinary và stream tiến trình trực tiếp theo thời gian thực (SSE).
                  </p>
                </div>
                <Button
                  onClick={handleStartSuiteRun}
                  isLoading={isStartingRun}
                  className="gap-2 bg-indigo-600 shadow-md shrink-0"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Chạy Test Suite Ngay</span>
                </Button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(3)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Quay lại Chỉnh sửa</span>
                </Button>

                <Link href={`/projects/${createdProject.id}`}>
                  <Button variant="secondary" className="gap-2">
                    <span>Xem Trang Tổng Quan Dự Án</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal for editing / adding test case */}
        <TestCaseModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveTestCaseModal}
          initialData={editingTestCase}
        />
      </div>
    </div>
  );
}
