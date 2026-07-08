import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import { usePluginStore } from "@/plugins/usePluginStore";

interface Habit {
  id: string;
  name: string;
  completedDates: string[];
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** ホーム画面向けの習慣管理サマリー (今日の達成状況) */
export function HabitsWidget() {
  const [habits] = usePluginStore<Habit[]>("habits", "habits", []);
  const today = todayKey();

  return (
    <div className="glass-panel flex flex-col rounded-xl2 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Flame size={16} className="text-accent" /> 今日の習慣
        </h3>
        <Link to="/plugin/habits" className="text-xs text-accent hover:underline">
          すべて見る
        </Link>
      </div>
      {habits.length === 0 ? (
        <p className="text-sm text-neutral-500">まだ習慣が登録されていません</p>
      ) : (
        <ul className="space-y-1.5">
          {habits.slice(0, 5).map((h) => {
            const doneToday = h.completedDates.includes(today);
            return (
              <li key={h.id} className="flex items-center gap-2 text-sm">
                <span className={`h-1.5 w-1.5 rounded-full ${doneToday ? "bg-accent" : "bg-black/20 dark:bg-white/20"}`} />
                <span className={doneToday ? "text-neutral-500 line-through" : ""}>{h.name}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
