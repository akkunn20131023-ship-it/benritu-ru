import { useEffect, useRef, useState } from "react";
import { Watch, Play, Pause, RotateCcw, Flag } from "lucide-react";
import type { PluginModule } from "../../types";

function formatElapsed(ms: number): string {
  const centiseconds = Math.floor((ms % 1000) / 10);
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const parts = hours > 0 ? [hours, minutes, seconds] : [minutes, seconds];
  return `${parts.map((p) => String(p).padStart(2, "0")).join(":")}.${String(centiseconds).padStart(2, "0")}`;
}

function StopwatchPage() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const startedAtRef = useRef(0);
  const baseElapsedRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setElapsed(baseElapsedRef.current + (performance.now() - startedAtRef.current));
    }, 30);
    return () => clearInterval(timer);
  }, [running]);

  function toggle() {
    if (running) {
      baseElapsedRef.current = elapsed;
      setRunning(false);
    } else {
      startedAtRef.current = performance.now();
      setRunning(true);
    }
  }

  function reset() {
    setRunning(false);
    setElapsed(0);
    baseElapsedRef.current = 0;
    setLaps([]);
  }

  function lap() {
    setLaps((prev) => [elapsed, ...prev]);
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center gap-6 pt-8">
      <div className="glass-panel flex w-full flex-col items-center gap-4 rounded-xl2 p-10">
        <p className="text-6xl font-bold tabular-nums">{formatElapsed(elapsed)}</p>
        <div className="flex gap-3">
          <button
            onClick={toggle}
            className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            {running ? <Pause size={16} /> : <Play size={16} />}
            {running ? "停止" : "開始"}
          </button>
          <button
            onClick={lap}
            disabled={!running}
            className="app-no-drag flex items-center gap-1.5 rounded-lg bg-black/5 px-5 py-2.5 text-sm font-medium hover:bg-black/10 disabled:opacity-40 dark:bg-white/10 dark:hover:bg-white/15"
          >
            <Flag size={16} /> ラップ
          </button>
          <button
            onClick={reset}
            className="app-no-drag flex items-center gap-1.5 rounded-lg bg-black/5 px-5 py-2.5 text-sm font-medium hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
          >
            <RotateCcw size={16} /> リセット
          </button>
        </div>
      </div>

      {laps.length > 0 && (
        <div className="glass-panel w-full flex-1 overflow-y-auto rounded-xl2 p-4">
          <ul className="space-y-1 text-sm">
            {laps.map((l, i) => (
              <li key={i} className="flex justify-between border-b border-black/5 py-1 last:border-0 dark:border-white/10">
                <span className="text-neutral-500">ラップ {laps.length - i}</span>
                <span className="tabular-nums">{formatElapsed(l)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export const StopwatchPlugin: PluginModule = {
  manifest: {
    id: "stopwatch",
    name: "ストップウォッチ",
    version: "0.1.0",
    description: "経過時間の計測とラップ記録",
    category: "life",
    entry: "stopwatch",
  },
  icon: Watch,
  Component: StopwatchPage,
};
