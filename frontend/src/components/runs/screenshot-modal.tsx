"use client";

import * as React from "react";
import Image from "next/image";
import { ExternalLink, Download, Image as ImageIcon } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface ScreenshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenshotUrl: string | null;
  title?: string;
  testCaseCode?: string;
}

export function ScreenshotModal({
  isOpen,
  onClose,
  screenshotUrl,
  title,
  testCaseCode,
}: ScreenshotModalProps) {
  if (!screenshotUrl) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || `Bằng chứng kiểm thử - [${testCaseCode || "Screenshot"}]`}
      description="Ảnh chụp màn hình trình duyệt Headless Playwright (lưu trữ trên Cloudinary WebP)"
      size="xl"
    >
      <div className="space-y-4">
        <div className="relative flex min-h-[300px] max-h-[65vh] w-full items-center justify-center overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-2 dark:border-slate-800">
          <img
            src={screenshotUrl}
            alt={title || "Screenshot bằng chứng"}
            className="max-h-[60vh] max-w-full rounded object-contain"
          />
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ImageIcon className="h-4 w-4" />
            <span className="truncate max-w-md">{screenshotUrl}</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={screenshotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Mở ảnh gốc</span>
              </Button>
            </a>
            <Button variant="default" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
