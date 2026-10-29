import * as React from "react";
import { CheckCircle2, XCircle, Clock, AlertTriangle, Percent, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDuration } from "@/lib/utils";

interface RunMetricsProps {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  status: string;
  durationMs?: number | null;
}

export function RunMetrics({
  total,
  passed,
  failed,
  pending,
  status,
  durationMs,
}: RunMetricsProps) {
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Tổng Test Cases
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {total}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Passed */}
        <Card className="border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Passed (Thành công)
              </p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {passed}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Failed */}
        <Card className="border-rose-200 dark:border-rose-900/60 bg-rose-50/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 shrink-0">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                Failed (Thất bại)
              </p>
              <p className="text-xl font-bold text-rose-700 dark:text-rose-300">
                {failed}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pending / Skipped */}
        <Card className="border-amber-200 dark:border-amber-900/60 bg-amber-50/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Pending / Skipped
              </p>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
                {pending}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pass Rate */}
        <Card className="border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 shrink-0">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                Tỷ lệ Pass (%)
              </p>
              <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                {passRate}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Execution Duration */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Thời gian thực thi
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {formatDuration(durationMs)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
          <span>Tiến độ hoàn thành: {total > 0 ? total - pending : 0} / {total} tests</span>
          <span>Tỷ lệ thành công: {passRate}%</span>
        </div>
        <Progress
          value={passRate}
          color={passRate >= 80 ? "success" : passRate >= 50 ? "warning" : "danger"}
          className="h-3"
        />
      </div>
    </div>
  );
}
