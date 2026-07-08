import { useMemo, useState } from "react";
import { Award as GradesIcon, Plus, Trash2 } from "lucide-react";
import { randomId } from "@/lib/randomId";
import { usePluginStore } from "../../usePluginStore";
import type { PluginModule } from "../../types";

export interface GradeEntry {
  id: string;
  subject: string;
  testName: string;
  score: number;
  maxScore: number;
  date: number;
}

export const GRADES_PLUGIN_ID = "grades";

function GradesPage() {
  const [grades, setGrades, loaded] = usePluginStore<GradeEntry[]>(GRADES_PLUGIN_ID, "grades", []);
  const [subject, setSubject] = useState("");
  const [testName, setTestName] = useState("");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("100");

  function addGrade() {
    if (!subject.trim() || !testName.trim() || !score) return;
    setGrades([
      { id: randomId(), subject: subject.trim(), testName: testName.trim(), score: Number(score), maxScore: Number(maxScore) || 100, date: Date.now() },
      ...grades,
    ]);
    setTestName("");
    setScore("");
  }

  function deleteGrade(id: string) {
    setGrades(grades.filter((g) => g.id !== id));
  }

  const bySubject = useMemo(() => {
    const map = new Map<string, { total: number; max: number; count: number }>();
    for (const g of grades) {
      const cur = map.get(g.subject) ?? { total: 0, max: 0, count: 0 };
      cur.total += g.score;
      cur.max += g.maxScore;
      cur.count += 1;
      map.set(g.subject, cur);
    }
    return map;
  }, [grades]);

  if (!loaded) return null;

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-4">
      <div className="glass-panel grid grid-cols-2 gap-2 rounded-lg p-3 sm:grid-cols-4">
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="科目" className="app-no-drag rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10" />
        <input value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="テスト名" className="app-no-drag rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10" />
        <input value={score} onChange={(e) => setScore(e.target.value)} type="number" placeholder="点数" className="app-no-drag rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10" />
        <div className="flex gap-2">
          <input value={maxScore} onChange={(e) => setMaxScore(e.target.value)} type="number" placeholder="満点" className="app-no-drag w-full rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10" />
          <button onClick={addGrade} className="app-no-drag rounded-lg bg-accent px-3 py-2 text-white hover:bg-accent-hover">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {bySubject.size > 0 && (
        <div className="glass-panel rounded-xl2 p-4">
          <h3 className="mb-2 text-xs font-medium text-neutral-500">科目別平均</h3>
          <div className="flex flex-wrap gap-2">
            {[...bySubject.entries()].map(([subj, agg]) => (
              <span key={subj} className="rounded-full bg-black/5 px-3 py-1 text-xs dark:bg-white/10">
                {subj}: {((agg.total / agg.max) * 100).toFixed(1)}% ({agg.count}件)
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 space-y-1.5 overflow-y-auto">
        {grades.length === 0 && <p className="p-4 text-center text-sm text-neutral-500">成績記録はまだありません</p>}
        {grades.map((g) => (
          <div key={g.id} className="glass-panel group flex items-center justify-between rounded-lg p-3">
            <div>
              <p className="text-sm font-medium">
                {g.subject} — {g.testName}
              </p>
              <p className="text-xs text-neutral-500">
                {g.score} / {g.maxScore} ({((g.score / g.maxScore) * 100).toFixed(1)}%) ・ {new Date(g.date).toLocaleDateString("ja-JP")}
              </p>
            </div>
            <Trash2
              size={14}
              className="app-no-drag shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100 cursor-pointer"
              onClick={() => deleteGrade(g.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export const GradesPlugin: PluginModule = {
  manifest: {
    id: "grades",
    name: "成績管理",
    version: "0.1.0",
    description: "テストの点数を記録し科目別平均を可視化",
    category: "study",
    entry: "grades",
  },
  icon: GradesIcon,
  Component: GradesPage,
};
