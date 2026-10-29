"use client";

import * as React from "react";
import { Sparkles, BrainCircuit } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

export function GenerateModal({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: GenerateModalProps) {
  const { showToast } = useToast();
  const [customPrompt, setCustomPrompt] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsGenerating(true);
      const res = await api.generateScenarios(projectId, {
        customPrompt: customPrompt.trim() || undefined,
      });
      showToast({
        title: "AI sinh kịch bản thành công!",
        description: `Đã tạo ${res.useCasesCount || 0} Use Cases và ${res.testCasesCount || 0} Test Cases theo chuẩn JSON.`,
        type: "success",
      });
      onSuccess();
      onClose();
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Tổng hợp Use Case & Kịch bản Test"
      description="Kích hoạt Gemini 2.5 Flash phân tích toàn bộ ngữ cảnh Figma, SRS và DOM để sinh kịch bản kiểm thử có cấu trúc"
      size="md"
    >
      <form onSubmit={handleGenerate} className="space-y-4">
        <div className="rounded-lg bg-indigo-50/70 p-3.5 text-xs text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
          <div className="flex items-center gap-2 font-semibold">
            <BrainCircuit className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Quy tắc chuẩn hóa 3 nhóm kiểm thử</span>
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-600 dark:text-slate-300">
            <li><strong>Positive (Happy Path):</strong> Dữ liệu chuẩn, đi hết luồng thành công.</li>
            <li><strong>Negative (Validation):</strong> Bỏ trống trường, sai định dạng, sai dữ liệu.</li>
            <li><strong>Boundary (Biên):</strong> Ký tự min/max, ký tự đặc biệt, injection cơ bản.</li>
          </ul>
        </div>

        <Textarea
          label="Chỉ thị bổ sung cho AI (Tùy chọn)"
          rows={3}
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="VD: Tập trung kỹ vào kiểm tra các trường bắt buộc của Form Đăng ký, kiểm tra hiển thị tiếng Việt có dấu..."
          helperText="Bạn có thể ghi chú thêm các tiêu chí nghiệm thu đặc thù của dự án"
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            isLoading={isGenerating}
            className="gap-2 bg-indigo-600 shadow-md"
          >
            <Sparkles className="h-4 w-4" />
            <span>Kích hoạt Gemini Sinh Kịch bản</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
