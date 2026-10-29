"use client";

import * as React from "react";
import { Upload, Globe, Figma, FileText, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

interface IngestSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

export function IngestSourceModal({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: IngestSourceModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = React.useState<"FIGMA" | "DOCUMENT" | "DOMAIN">("FIGMA");
  const [isLoading, setIsLoading] = React.useState(false);

  // Figma state
  const [figmaUrl, setFigmaUrl] = React.useState("");
  const [figmaToken, setFigmaToken] = React.useState("");

  // Document state
  const [docMode, setDocMode] = React.useState<"file" | "text">("file");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [rawText, setRawText] = React.useState("");

  // Domain state
  const [domainUrl, setDomainUrl] = React.useState("");

  const handleIngestFigma = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await api.ingestFigma(projectId, {
        figmaUrl,
        figmaToken: figmaToken.trim() || undefined,
      });
      showToast({
        title: "Nạp Figma thành công",
        description: "Đã trích xuất cấu trúc Frame và đẩy ảnh thiết kế lên Cloudinary.",
        type: "success",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast({
        title: "Lỗi nạp Figma",
        description: err.message,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleIngestDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      if (docMode === "file") {
        if (!selectedFile) {
          throw new Error("Vui lòng chọn file .pdf, .docx hoặc .md");
        }
        await api.ingestDocumentFile(projectId, selectedFile);
      } else {
        if (!rawText.trim()) {
          throw new Error("Vui lòng nhập nội dung tài liệu SRS/PRD");
        }
        await api.ingestDocumentText(projectId, rawText, "srs-manual.md");
      }
      showToast({
        title: "Nạp tài liệu thành công",
        description: "Đã trích xuất nội dung yêu cầu nghiệp vụ vào hệ thống.",
        type: "success",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast({
        title: "Lỗi nạp tài liệu",
        description: err.message,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleIngestDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await api.ingestDomain(projectId, { url: domainUrl });
      showToast({
        title: "Cào Domain thành công",
        description: "Playwright đã quét cây DOM tương tác và lưu snapshot.",
        type: "success",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast({
        title: "Lỗi cào Domain",
        description: err.message,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nạp thêm Nguồn Dữ liệu (Ingest Source)"
      description="Cung cấp thiết kế Figma, tài liệu PRD/SRS hoặc Domain URL để làm giàu ngữ cảnh cho AI"
      size="lg"
    >
      <div className="space-y-4">
        {/* Source Selector Tabs */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("FIGMA")}
            className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs font-medium transition-colors ${
              activeTab === "FIGMA"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            <Figma className="h-4 w-4" />
            <span>Figma Design</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("DOCUMENT")}
            className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs font-medium transition-colors ${
              activeTab === "DOCUMENT"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>SRS / PRD Doc</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("DOMAIN")}
            className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs font-medium transition-colors ${
              activeTab === "DOMAIN"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>Live Domain URL</span>
          </button>
        </div>

        {/* Tab 1: FIGMA */}
        {activeTab === "FIGMA" && (
          <form onSubmit={handleIngestFigma} className="space-y-3">
            <Input
              label="Figma File / Node URL"
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              required
              placeholder="https://www.figma.com/design/ABCxyz/AppName?node-id=1-2"
              helperText="Hệ thống sẽ tự động tách File Key & Node ID để tải JSON cây Frame"
            />
            <Input
              label="Figma Personal Access Token (tùy chọn nếu file private)"
              type="password"
              value={figmaToken}
              onChange={(e) => setFigmaToken(e.target.value)}
              placeholder="figd_..."
              helperText="Tạo tại Figma > Settings > Personal access tokens"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" isLoading={isLoading} className="bg-indigo-600">
                Nạp & Trích xuất Figma
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: DOCUMENT */}
        {activeTab === "DOCUMENT" && (
          <form onSubmit={handleIngestDoc} className="space-y-3">
            <div className="flex gap-4 border-b border-slate-200 pb-2 text-xs">
              <button
                type="button"
                onClick={() => setDocMode("file")}
                className={`font-semibold ${
                  docMode === "file" ? "text-indigo-600 border-b-2 border-indigo-600 pb-1" : "text-slate-500"
                }`}
              >
                Tải lên File (.docx, .pdf, .md)
              </button>
              <button
                type="button"
                onClick={() => setDocMode("text")}
                className={`font-semibold ${
                  docMode === "text" ? "text-indigo-600 border-b-2 border-indigo-600 pb-1" : "text-slate-500"
                }`}
              >
                Nhập nội dung văn bản trực tiếp
              </button>
            </div>

            {docMode === "file" ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Chọn tập tin tài liệu
                </label>
                <input
                  type="file"
                  accept=".docx,.pdf,.md,.txt"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950/50 dark:file:text-indigo-300"
                />
                <p className="text-xs text-slate-400">
                  Hỗ trợ định dạng Word (.docx), PDF (.pdf) hoặc Markdown (.md)
                </p>
              </div>
            ) : (
              <Textarea
                label="Nội dung tài liệu SRS/PRD"
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Dán nội dung mô tả chức năng, quy tắc kiểm tra (validation), thông báo lỗi..."
              />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" isLoading={isLoading} className="bg-indigo-600">
                Nạp & Phân tích Tài liệu
              </Button>
            </div>
          </form>
        )}

        {/* Tab 3: DOMAIN */}
        {activeTab === "DOMAIN" && (
          <form onSubmit={handleIngestDomain} className="space-y-3">
            <Input
              label="Target Domain URL"
              type="url"
              value={domainUrl}
              onChange={(e) => setDomainUrl(e.target.value)}
              required
              placeholder="https://staging.myapp.com"
              helperText="Playwright sẽ mở trình duyệt cào cấu trúc DOM tương tác (button, input, form) và chụp ảnh"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" isLoading={isLoading} className="bg-indigo-600">
                Cào DOM & Chụp Snapshot
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
