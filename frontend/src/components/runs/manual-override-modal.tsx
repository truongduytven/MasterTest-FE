"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TestExecutionItem, TestStatus } from "@/types";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

interface ManualOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: TestExecutionItem | null;
  onSuccess: () => void;
}

export function ManualOverrideModal({
  isOpen,
  onClose,
  item,
  onSuccess,
}: ManualOverrideModalProps) {
  const { showToast } = useToast();
  const [status, setStatus] = React.useState<TestStatus>("PASS");
  const [actualResult, setActualResult] = React.useState("");
  const [errorLog, setErrorLog] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (item) {
      setStatus(item.status);
      setActualResult(item.actualResult || "");
      setErrorLog(item.errorLog || "");
    }
  }, [item, isOpen]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await api.updateExecutionItem(item.id, {
        status,
        actualResult: actualResult.trim() || undefined,
        errorLog: errorLog.trim() || undefined,
      });
      showToast({
        title: "Cập nhật kết quả thành công",
        description: `Đã ghi nhận trạng thái ${status} cho kịch bản ${item.testCase?.code || ""}`,
        type: "success",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast({
        title: "Lỗi cập nhật kết quả",
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
      title={`Cập nhật Thủ công Kết quả [${item.testCase?.code || "Test Case"}]`}
      description="Cho phép kiểm thử viên QA ghi đè trạng thái thực tế và ghi chú thêm bằng chứng"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Trạng thái kết quả (Status)
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TestStatus)}
            className="flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="PASS">PASS (Thành công)</option>
            <option value="FAIL">FAIL (Thất bại)</option>
            <option value="BLOCKED">BLOCKED (Bị chặn/Lỗi môi trường)</option>
            <option value="SKIPPED">SKIPPED (Bỏ qua)</option>
            <option value="PENDING">PENDING (Chờ kiểm thử)</option>
          </select>
        </div>

        <Textarea
          label="Kết quả thực tế ghi nhận (Actual Result)"
          rows={3}
          value={actualResult}
          onChange={(e) => setActualResult(e.target.value)}
          placeholder="VD: Nút bấm hiển thị đúng màu theo Figma, luồng API phản hồi 200 OK..."
        />

        <Textarea
          label="Ghi chú lỗi / Stack trace (Nếu có)"
          rows={3}
          value={errorLog}
          onChange={(e) => setErrorLog(e.target.value)}
          placeholder="Console error hoặc chi tiết sai lệch giao diện..."
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" isLoading={isLoading} className="bg-indigo-600">
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
}
