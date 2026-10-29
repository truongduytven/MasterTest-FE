"use client";

import * as React from "react";
import Link from "next/link";
import {
  ExternalLink,
  Layers,
  Play,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { Project } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, getStatusColor } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
  onTriggerRun: (id: string) => void;
}

export function ProjectCard({ project, onDelete, onTriggerRun }: ProjectCardProps) {
  const [isRunning, setIsRunning] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleRun = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsRunning(true);
      await onTriggerRun(project.id);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Bạn có chắc chắn muốn xóa dự án "${project.name}" không?`)) {
      setIsDeleting(true);
      onDelete(project.id);
    }
  };

  const inputModeBadge = {
    DOMAIN_ONLY: { label: "Live Domain", variant: "info" as const },
    FIGMA_AND_DOCS: { label: "Figma + PRD", variant: "default" as const },
    HYBRID: { label: "Hybrid (Figma + Web)", variant: "success" as const },
  }[project.inputMode] || { label: project.inputMode, variant: "secondary" as const };

  const latestRun = project.latestRun || (project.testRuns && project.testRuns[0]);
  const totalTestCases =
    project.useCases?.reduce((acc, uc) => acc + (uc.testCases?.length || 0), 0) || 0;

  return (
    <Card className="group relative flex flex-col justify-between transition-all duration-200 hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-800">
      <div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <Badge variant={inputModeBadge.variant}>{inputModeBadge.label}</Badge>
            {latestRun && (
              <Badge
                variant={
                  latestRun.status === "COMPLETED" || latestRun.status === "PASS"
                    ? "success"
                    : latestRun.status === "FAILED" || latestRun.status === "FAIL"
                    ? "danger"
                    : "warning"
                }
                size="sm"
              >
                Run #{latestRun.runNumber}: {latestRun.status}
              </Badge>
            )}
          </div>
          <CardTitle className="mt-2 line-clamp-1 text-base font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
            <Link href={`/projects/${project.id}`}>{project.name}</Link>
          </CardTitle>
          {project.description && (
            <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
              {project.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-3 pb-3">
          {project.targetDomainUrl && (
            <a
              href={project.targetDomainUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{project.targetDomainUrl}</span>
            </a>
          )}

          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs dark:bg-slate-800/60">
            <div>
              <p className="text-slate-500 dark:text-slate-400">Use Cases</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {project.useCases?.length || project._count?.useCases || 0} luồng
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Test Cases</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {totalTestCases} kịch bản
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Calendar className="h-3 w-3" />
            <span>Tạo ngày: {formatDate(project.createdAt)}</span>
          </div>
        </CardContent>
      </div>

      <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80">
        <Link href={`/projects/${project.id}`}>
          <Button variant="outline" size="sm">
            Xem chi tiết
          </Button>
        </Link>

        <div className="flex items-center gap-1.5">
          <Button
            variant="default"
            size="sm"
            onClick={handleRun}
            isLoading={isRunning}
            className="gap-1 bg-indigo-600 text-xs"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Chạy Test</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            isLoading={isDeleting}
            className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
            title="Xóa dự án"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
