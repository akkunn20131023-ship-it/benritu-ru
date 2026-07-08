import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import type { UsageStat } from "@shared/types";

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes}分`;
  return `${Math.floor(minutes / 60)}時間${minutes % 60}分`;
}

/** 機能ごとの利用時間・使用統計。学習時間もここに含まれる featureId (例: study:*) を集計対象にできる */
export function UsageStatsWidget() {
  const [stats, setStats] = useState<UsageStat[]>([]);

  useEffect(() => {
    void window.api.usage.list().then(setStats);
  }, []);

  const total = stats.reduce((sum, s) => sum + s.totalMs, 0);
  const top = stats.slice(0, 4);

  return (
    <div className="glass-panel flex flex-col rounded-xl2 p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <BarChart3 size={16} className="text-accent" /> 使用統計
      </h3>
      <p className="mb-2 text-2xl font-semibold">{formatDuration(total)}</p>
      <p className="mb-3 text-xs text-neutral-500">累計利用時間</p>
      {top.length === 0 ? (
        <p className="text-sm text-neutral-500">まだデータがありません</p>
      ) : (
        <ul className="space-y-1.5">
          {top.map((s) => (
            <li key={s.featureId} className="flex items-center justify-between text-sm">
              <span className="truncate">{s.featureId}</span>
              <span className="text-xs text-neutral-400">{formatDuration(s.totalMs)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
