import { useEffect, useRef, useState } from "react";
import { Timer as TimerIcon, Play, Pause, RotateCcw } from "lucide-react";
import { usePluginStore } from "../../usePluginStore";
import type { PluginModule } from "../../types";

const PLUGIN_ID = "pomodoro";

interface PomodoroSettings {
  workMin: number;
  breakMin: number;
  longBreakMin: number;
  cyclesUntilLongBreak: number;
}

const DEFAULT_SETTINGS: PomodoroSettings = { workMin: 25, breakMin: 5, longBreakMin: 15, cyclesUntilLongBreak: 4 };

type Phase = "work" | "break" | "longBreak";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function PomodoroPage() {
  const [settings, setSettings, loaded] = usePluginStore<PomodoroSettings>(PLUGIN_ID, "settings", DEFAULT_SETTINGS);
  const [phase, setPhase] = useState<Phase>("work");
  const [cycle, setCycle] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SETTINGS.workMin * 60);
  const [running, setRunning] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (loaded && !initializedRef.current) {
      setSecondsLeft(settings.workMin * 60);
      initializedRef.current = true;
    }
  }, [loaded, settings.workMin]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          advancePhase();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, cycle, settings]);

  function durationFor(p: Phase): number {
    if (p === "work") return settings.workMin * 60;
    if (p === "break") return settings.breakMin * 60;
    return settings.longBreakMin * 60;
  }

  function advancePhase() {
    if (phase === "work") {
      const isLongBreak = cycle % settings.cyclesUntilLongBreak === 0;
      const next: Phase = isLongBreak ? "longBreak" : "break";
      setPhase(next);
      setSecondsLeft(durationFor(next));
    } else {
      setPhase("work");
      setCycle((c) => c + 1);
      setSecondsLeft(durationFor("work"));
    }
  }

  function reset() {
    setRunning(false);
    setPhase("work");
    setCycle(1);
    setSecondsLeft(settings.workMin * 60);
  }

  function updateSetting(key: keyof PomodoroSettings, value: number) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    if (!running && phase === "work" && key === "workMin") setSecondsLeft(value * 60);
  }

  if (!loaded) return null;

  const phaseLabel = phase === "work" ? "集中タイム" : phase === "break" ? "小休憩" : "長い休憩";

  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-6">
      <div className="glass-panel flex w-full flex-col items-center gap-4 rounded-xl2 p-10">
        <p className="text-sm font-medium text-neutral-500">
          {phaseLabel} ・ サイクル {cycle}
        </p>
        <p className="text-6xl font-bold tabular-nums">{formatTime(secondsLeft)}</p>
        <div className="flex gap-3">
          <button
            onClick={() => setRunning((r) => !r)}
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
        <h3 className="mb-3 text-sm font-semibold">設定 (分)</h3>
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <SettingField label="集中" value={settings.workMin} onChange={(v) => updateSetting("workMin", v)} />
          <SettingField label="小休憩" value={settings.breakMin} onChange={(v) => updateSetting("breakMin", v)} />
          <SettingField label="長い休憩" value={settings.longBreakMin} onChange={(v) => updateSetting("longBreakMin", v)} />
        </div>
      </div>
    </div>
  );
}

function SettingField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col items-center gap-1">
      <span className="text-neutral-500">{label}</span>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value)))}
        className="app-no-drag w-full rounded-lg bg-black/5 px-2 py-1.5 text-center text-sm outline-none dark:bg-white/10"
      />
    </label>
  );
}

export const PomodoroPlugin: PluginModule = {
  manifest: {
    id: "pomodoro",
    name: "ポモドーロタイマー",
    version: "0.1.0",
    description: "集中時間と休憩を管理するタイマー",
    category: "life",
    entry: "pomodoro",
  },
  icon: TimerIcon,
  Component: PomodoroPage,
};
