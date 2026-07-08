import { useMemo, useState } from "react";
import { Flame, Plus, Trash2 } from "lucide-react";
import { randomId } from "@/lib/randomId";
import { usePluginStore } from "../../usePluginStore";
import type { PluginModule } from "../../types";

interface Habit {
  id: string;
  name: string;
  completedDates: string[]; // YYYY-MM-DD
}

const PLUGIN_ID = "habits";

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function last7Days(): Date[] {
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function computeStreak(dates: string[]): number {
  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date();
  while (set.has(toDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function HabitsPage() {
  const [habits, setHabits, loaded] = usePluginStore<Habit[]>(PLUGIN_ID, "habits", []);
  const [newName, setNewName] = useState("");
  const days = useMemo(() => last7Days(), []);

  function addHabit() {
    if (!newName.trim()) return;
    setHabits([...habits, { id: randomId(), name: newName.trim(), completedDates: [] }]);
    setNewName("");
  }

  function toggleDate(habitId: string, dateKey: string) {
    setHabits(
      habits.map((h) => {
        if (h.id !== habitId) return h;
        const has = h.completedDates.includes(dateKey);
        return { ...h, completedDates: has ? h.completedDates.filter((d) => d !== dateKey) : [...h.completedDates, dateKey] };
      })
    );
  }

  function deleteHabit(id: string) {
    setHabits(habits.filter((h) => h.id !== id));
  }

  if (!loaded) return null;

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-4">
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addHabit()}
          placeholder="新しい習慣を追加 (例: 読書, 運動)..."
          className="app-no-drag flex-1 rounded-lg glass-panel px-4 py-2.5 text-sm outline-none"
        />
        <button
          onClick={addHabit}
          className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <Plus size={16} /> 追加
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {habits.length === 0 && <p className="p-4 text-center text-sm text-neutral-500">習慣がまだ登録されていません</p>}
        {habits.map((habit) => (
          <div key={habit.id} className="glass-panel group flex items-center gap-3 rounded-lg p-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">{habit.name}</span>
                {computeStreak(habit.completedDates) > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-orange-500">
                    <Flame size={12} /> {computeStreak(habit.completedDates)}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex gap-1.5">
                {days.map((d) => {
                  const key = toDateKey(d);
                  const done = habit.completedDates.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleDate(habit.id, key)}
                      title={key}
                      className={`app-no-drag flex h-6 w-6 items-center justify-center rounded-full text-[10px] transition-colors ${
                        done ? "bg-accent text-white" : "bg-black/5 text-neutral-400 hover:bg-black/10 dark:bg-white/10"
                      }`}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
            <Trash2
              size={14}
              className="app-no-drag shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100 cursor-pointer"
              onClick={() => deleteHabit(habit.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export const HabitsPlugin: PluginModule = {
  manifest: {
    id: "habits",
    name: "習慣管理",
    version: "0.1.0",
    description: "毎日の習慣を記録・連続記録を可視化",
    category: "life",
    entry: "habits",
  },
  icon: Flame,
  Component: HabitsPage,
};
