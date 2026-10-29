"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TestCase, TestStep } from "@/types";

interface TestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (testCaseData: Partial<TestCase>) => Promise<void>;
  initialData?: TestCase | null;
  useCaseCode?: string;
}

export function TestCaseModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  useCaseCode,
}: TestCaseModalProps) {
  const [code, setCode] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("POSITIVE");
  const [priority, setPriority] = React.useState("HIGH");
  const [preconditions, setPreconditions] = React.useState("");
  const [expectedResult, setExpectedResult] = React.useState("");
  const [steps, setSteps] = React.useState<TestStep[]>([]);
  const [testDataString, setTestDataString] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (initialData) {
      setCode(initialData.code || "");
      setTitle(initialData.title || "");
      setCategory(initialData.category || "POSITIVE");
      setPriority(initialData.priority || "HIGH");
      setPreconditions(initialData.preconditions || "");
      setExpectedResult(initialData.expectedResult || "");
      setSteps(
        Array.isArray(initialData.steps)
          ? initialData.steps
          : typeof initialData.steps === "string"
          ? JSON.parse(initialData.steps)
          : []
      );
      setTestDataString(
        initialData.testData ? JSON.stringify(initialData.testData, null, 2) : ""
      );
    } else {
      setCode(useCaseCode ? `${useCaseCode}.01` : "TC-01.01");
      setTitle("");
      setCategory("POSITIVE");
      setPriority("HIGH");
      setPreconditions("");
      setExpectedResult("");
      setSteps([
        { stepNo: 1, action: "GOTO", value: "/", description: "Truy cập trang đích" },
      ]);
      setTestDataString("");
    }
  }, [initialData, useCaseCode, isOpen]);

  const handleAddStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        stepNo: prev.length + 1,
        action: "CLICK",
        selector: "",
        value: "",
        description: "",
      },
    ]);
  };

  const handleUpdateStep = (index: number, field: keyof TestStep, value: any) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveStep = (index: number) => {
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((step, idx) => ({ ...step, stepNo: idx + 1 }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      let parsedTestData = null;
      if (testDataString.trim()) {
        try {
          parsedTestData = JSON.parse(testDataString);
        } catch {
          parsedTestData = { raw: testDataString };
        }
      }

      await onSave({
        code,
        title,
        category,
        priority,
        preconditions,
        expectedResult,
        steps,
        testData: parsedTestData,
      });
      onClose();
    } catch (err: any) {
      alert(`Lỗi khi lưu Test Case: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Chỉnh sửa Test Case [${initialData.code}]` : "Thêm mới Test Case"}
      description="Cấu hình kịch bản kiểm thử tự động với Playwright Steps & Kết quả mong đợi"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Mã Kịch bản (Code)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            placeholder="TC-01.01"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Phân loại (Category)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="POSITIVE">POSITIVE (Happy Path)</option>
              <option value="NEGATIVE">NEGATIVE (Validation/Error)</option>
              <option value="BOUNDARY">BOUNDARY (Biên giá trị)</option>
              <option value="UI">UI (Giao diện & Bố cục)</option>
              <option value="FUNCTIONAL">FUNCTIONAL (Luồng chức năng)</option>
              <option value="SECURITY_VALIDATION">SECURITY (Bảo mật/XSS)</option>
              <option value="PERFORMANCE">PERFORMANCE (Hiệu năng)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Mức độ ưu tiên
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="HIGH">HIGH (Cao)</option>
              <option value="MEDIUM">MEDIUM (Trung bình)</option>
              <option value="LOW">LOW (Thấp)</option>
            </select>
          </div>
        </div>

        <Input
          label="Tiêu đề Kịch bản (Scenario Title)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Đăng nhập thành công với tài khoản hợp lệ"
        />

        <Input
          label="Điều kiện tiên quyết (Pre-conditions)"
          value={preconditions}
          onChange={(e) => setPreconditions(e.target.value)}
          placeholder="Người dùng đang ở trang /login, đã có tài khoản"
        />

        <Textarea
          label="Kết quả mong đợi (Expected Result)"
          value={expectedResult}
          onChange={(e) => setExpectedResult(e.target.value)}
          required
          placeholder="Chuyển hướng về trang Dashboard và hiển thị thông báo Chào mừng..."
        />

        {/* Steps Editor */}
        <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Các bước Playwright tự động ({steps.length} bước)
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddStep}
              className="gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm bước</span>
            </Button>
          </div>

          <div className="space-y-2">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/50"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-200 font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  {step.stepNo}
                </span>

                <select
                  value={step.action}
                  onChange={(e) => handleUpdateStep(idx, "action", e.target.value)}
                  className="h-8 rounded border border-slate-300 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="GOTO">GOTO</option>
                  <option value="FILL">FILL</option>
                  <option value="CLICK">CLICK</option>
                  <option value="HOVER">HOVER</option>
                  <option value="SELECT">SELECT</option>
                  <option value="WAIT">WAIT</option>
                  <option value="ASSERT_TEXT">ASSERT_TEXT</option>
                  <option value="ASSERT_VISIBLE">ASSERT_VISIBLE</option>
                  <option value="ASSERT_URL">ASSERT_URL</option>
                </select>

                <input
                  type="text"
                  placeholder="Selector (VD: #email, button[type=submit])"
                  value={step.selector || ""}
                  onChange={(e) => handleUpdateStep(idx, "selector", e.target.value)}
                  className="h-8 flex-1 rounded border border-slate-300 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />

                <input
                  type="text"
                  placeholder="Giá trị nhập / URL"
                  value={step.value || ""}
                  onChange={(e) => handleUpdateStep(idx, "value", e.target.value)}
                  className="h-8 flex-1 rounded border border-slate-300 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveStep(idx)}
                  className="p-1 text-rose-500 hover:text-rose-700"
                  title="Xóa bước này"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <Textarea
          label="Dữ liệu kiểm thử mẫu (Test Data JSON - tùy chọn)"
          value={testDataString}
          onChange={(e) => setTestDataString(e.target.value)}
          placeholder={`{\n  "email": "user@domain.com",\n  "password": "Password123!"\n}`}
          rows={3}
        />

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button type="submit" isLoading={isSaving} className="bg-indigo-600">
            {initialData ? "Cập nhật Kịch bản" : "Tạo Kịch bản"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
