import { useEffect, useRef, useState } from "react";
import { AlarmClock, Play, Pause, RotateCcw } from "lucide-react";
import { usePluginStore } from "../../usePluginStore";
import type { PluginModule } from "../../types";

const PLUGIN_ID = "timer";

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function TimerPage() {
  const [lastMinutes, setLastMinutes] = usePluginStore<number>(PLUGIN_ID, "lastMinutes", 5);
  const [inputMinutes, setInputMinutes] = useState(lastMinutes);
  const [secondsLeft, setSecondsLeft] = useState(lastMinutes * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (!initRef.current) {
      setInputMinutes(lastMinutes);
      setSecondsLeft(lastMinutes * 60);
      initRef.current = true;
    }
  }, [lastMinutes]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  function start() {
    if (secondsLeft <= 0) return;
    setFinished(false);
    setRunning(true);
  }

  function reset() {
    setRunning(false);
    setFinished(false);
    setSecondsLeft(inputMinutes * 60);
  }

  function applyMinutes(v: number) {
    const minutes = Math.max(0, v);
    setInputMinutes(minutes);
    setSecondsLeft(minutes * 60);
    void setLastMinutes(minutes);
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-6">
      <div className={`glass-panel flex w-full flex-col items-center gap-4 rounded-xl2 p-10 transition-colors ${finished ? "ring-2 ring-accent" : ""}`}>
        {finished && <p className="text-sm font-medium text-accent">時間になりました!</p>}
        <p className="text-6xl font-bold tabular-nums">{formatTime(secondsLeft)}</p>
        <div className="flex gap-3">
          <button
            onClick={running ? () => setRunning(false) : start}
            className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            {running ? <Pause size={16} /> : <Play size={16} />}
            {running ? "一時停止" : "開始"}
          </button>
          <button
            onClick={reset}
            className="app-no-drag flex items-center gap-1.5 rounded-lg bg-black/5 px-5 py-2.5 text-sm font-medium hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
          >
            <RotateCcw size={16} /> リセット
          </button>
        </div>
      </div>

      <div className="glass-panel w-full rounded-xl2 p-5">
        <label className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">時間 (分)</span>
          <input
            type="number"
            min={0}
            value={inputMinutes}
            onChange={(e) => applyMinutes(Number(e.target.value))}
            className="app-no-drag w-24 rounded-lg bg-black/5 px-3 py-1.5 text-center outline-none dark:bg-white/10"
          />
        </label>
      </div>
    </div>
  );
}

export const TimerPlugin: PluginModule = {
  manifest: {
    id: "timer",
    name: "タイマー",
    version: "0.1.0",
    description: "シンプルなカウントダウンタイマー",
    category: "life",
    entry: "timer",
  },
  icon: AlarmClock,
  Component: TimerPage,
};
