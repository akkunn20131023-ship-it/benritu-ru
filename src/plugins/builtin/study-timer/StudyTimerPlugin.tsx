import { useEffect, useRef, useState } from "react";
import { Hourglass, Play, Pause, Square, Trash2 } from "lucide-react";
import { randomId } from "@/lib/randomId";
import { usePluginStore } from "../../usePluginStore";
import type { PluginModule } from "../../types";

export interface StudySession {
  id: string;
  subject: string;
  minutes: number;
  date: number;
}

export const STUDY_TIMER_PLUGIN_ID = "study-timer";

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function StudyTimerPage() {
  const [sessions, setSessions, loaded] = usePluginStore<StudySession[]>(STUDY_TIMER_PLUGIN_ID, "sessions", []);
  const [subject, setSubject] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAtRef = useRef(0);
  const baseRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setElapsed(baseRef.current + (performance.now() - startedAtRef.current)), 500);
    return () => clearInterval(timer);
  }, [running]);

  function toggle() {
    if (running) {
      baseRef.current = elapsed;
      setRunning(false);
    } else {
      startedAtRef.current = performance.now();
      setRunning(true);
    }
  }

  function finish() {
    const minutes = Math.round(elapsed / 60000);
    if (minutes > 0) {
      setSessions([{ id: randomId(), subject: subject.trim() || "その他", minutes, date: Date.now() }, ...sessions]);
    }
    setRunning(false);
    setElapsed(0);
    baseRef.current = 0;
  }

  function deleteSession(id: string) {
    setSessions(sessions.filter((s) => s.id !== id));
  }

  if (!loaded) return null;

  const todaysSessions = sessions.filter((s) => new Date(s.date).toDateString() === new Date().toDateString());
  const todayMinutes = todaysSessions.reduce((sum, s) => sum + s.minutes, 0);
  const bySubject = new Map<string, number>();
  for (const s of sessions) bySubject.set(s.subject, (bySubject.get(s.subject) ?? 0) + s.minutes);

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-4">
      <div className="glass-panel flex flex-col items-center gap-4 rounded-xl2 p-8">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="科目名 (例: 数学)"
          className="app-no-drag w-56 rounded-lg bg-black/5 px-3 py-2 text-center text-sm outline-none dark:bg-white/10"
        />
        <p className="text-5xl font-bold tabular-nums">{formatElapsed(elapsed)}</p>
        <div className="flex gap-3">
          <button
            onClick={toggle}
            className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            {running ? <Pause size={16} /> : <Play size={16} />}
            {running ? "一時停止" : "開始"}
          </button>
          <button
            onClick={finish}
            disabled={elapsed === 0}
            className="app-no-drag flex items-center gap-1.5 rounded-lg bg-black/5 px-5 py-2.5 text-sm font-medium hover:bg-black/10 disabled:opacity-40 dark:bg-white/10 dark:hover:bg-white/15"
          >
            <Square size={16} /> 記録して終了
          </button>
        </div>
        <p className="text-xs text-neutral-500">
          今日の学習時間: {Math.floor(todayMinutes / 60)}時間{todayMinutes % 60}分
        </p>
      </div>

      {bySubject.size > 0 && (
        <div className="glass-panel rounded-xl2 p-4">
          <h3 className="mb-2 text-xs font-medium text-neutral-500">科目別合計</h3>
          <div className="flex flex-wrap gap-2">
            {[...bySubject.entries()].map(([subj, min]) => (
              <span key={subj} className="rounded-full bg-black/5 px-3 py-1 text-xs dark:bg-white/10">
                {subj}: {Math.floor(min / 60)}時間{min % 60}分
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 space-y-1 overflow-y-auto">
        {sessions.length === 0 && <p className="p-4 text-center text-sm text-neutral-500">記録はまだありません</p>}
        {sessions.slice(0, 30).map((s) => (
          <div key={s.id} className="group flex items-center justify-between rounded-lg px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10">
            <span className="text-sm">
              {s.subject} — {s.minutes}分
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400">{new Date(s.date).toLocaleDateString("ja-JP")}</span>
              <Trash2
                size={14}
                className="app-no-drag opacity-0 group-hover:opacity-60 hover:opacity-100 cursor-pointer"
                onClick={() => deleteSession(s.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const StudyTimerPlugin: PluginModule = {
  manifest: {
    id: "study-timer",
    name: "学習時間記録",
    version: "0.1.0",
    description: "科目別に学習時間を計測・記録",
    category: "study",
    entry: "study-timer",
  },
  icon: Hourglass,
  Component: StudyTimerPage,
};
