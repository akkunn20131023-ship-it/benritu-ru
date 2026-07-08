import { useEffect, useState } from "react";
import { BarChart3, Hourglass, FileQuestion, Award } from "lucide-react";
import { STUDY_TIMER_PLUGIN_ID, type StudySession } from "../study-timer/StudyTimerPlugin";
import { QUIZ_GENERATOR_PLUGIN_ID, type QuizHistoryEntry } from "../quiz-generator/QuizGeneratorPlugin";
import { GRADES_PLUGIN_ID, type GradeEntry } from "../grades/GradesPlugin";
import type { PluginModule } from "../../types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function StudyStatsPage() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryEntry[]>([]);
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void Promise.all([
      window.api.plugins.storeGet(STUDY_TIMER_PLUGIN_ID, "sessions"),
      window.api.plugins.storeGet(QUIZ_GENERATOR_PLUGIN_ID, "history"),
      window.api.plugins.storeGet(GRADES_PLUGIN_ID, "grades"),
    ]).then(([s, q, g]) => {
      setSessions((s as StudySession[] | undefined) ?? []);
      setQuizHistory((q as QuizHistoryEntry[] | undefined) ?? []);
      setGrades((g as GradeEntry[] | undefined) ?? []);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return null;

  const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);
  const weekMinutes = sessions.filter((s) => Date.now() - s.date < WEEK_MS).reduce((sum, s) => sum + s.minutes, 0);

  const bySubject = new Map<string, number>();
  for (const s of sessions) bySubject.set(s.subject, (bySubject.get(s.subject) ?? 0) + s.minutes);
  const maxSubjectMinutes = Math.max(1, ...bySubject.values());

  const quizAccuracy = quizHistory.length
    ? (quizHistory.reduce((sum, q) => sum + q.score / q.total, 0) / quizHistory.length) * 100
    : null;

  const gradeAverage = grades.length ? (grades.reduce((sum, g) => sum + g.score / g.maxScore, 0) / grades.length) * 100 : null;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Hourglass} label="累計学習時間" value={`${Math.floor(totalMinutes / 60)}時間${totalMinutes % 60}分`} sub={`直近7日間: ${Math.floor(weekMinutes / 60)}時間${weekMinutes % 60}分`} />
        <StatCard
          icon={FileQuestion}
          label="クイズ平均正答率"
          value={quizAccuracy !== null ? `${quizAccuracy.toFixed(1)}%` : "-"}
          sub={`${quizHistory.length}件のクイズ`}
        />
        <StatCard icon={Award} label="テスト平均点" value={gradeAverage !== null ? `${gradeAverage.toFixed(1)}%` : "-"} sub={`${grades.length}件の記録`} />
      </div>

      {bySubject.size > 0 && (
        <div className="glass-panel rounded-xl2 p-5">
          <h3 className="mb-3 text-sm font-semibold">科目別学習時間</h3>
          <div className="space-y-2">
            {[...bySubject.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([subject, minutes]) => (
                <div key={subject} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 truncate text-xs text-neutral-500">{subject}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(minutes / maxSubjectMinutes) * 100}%` }} />
                  </div>
                  <span className="w-14 shrink-0 text-right text-xs text-neutral-500">{minutes}分</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && quizHistory.length === 0 && grades.length === 0 && (
        <p className="p-8 text-center text-sm text-neutral-500">
          まだデータがありません。学習時間記録・クイズ生成・成績管理を使うとここに統計が表示されます。
        </p>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: typeof BarChart3; label: string; value: string; sub: string }) {
  return (
    <div className="glass-panel rounded-xl2 p-5">
      <h3 className="mb-1 flex items-center gap-2 text-xs font-medium text-neutral-500">
        <Icon size={14} /> {label}
      </h3>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-0.5 text-xs text-neutral-400">{sub}</p>
    </div>
  );
}

export const StudyStatsPlugin: PluginModule = {
  manifest: {
    id: "study-stats",
    name: "勉強統計",
    version: "0.1.0",
    description: "学習時間・クイズ正答率・成績をまとめて確認",
    category: "study",
    entry: "study-stats",
  },
  icon: BarChart3,
  Component: StudyStatsPage,
};
