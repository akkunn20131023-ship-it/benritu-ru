import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { randomId } from "@/lib/randomId";
import { usePluginStore } from "../../usePluginStore";
import type { PluginModule } from "../../types";

interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
}

const PLUGIN_ID = "calendar";
const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function CalendarPage() {
  const [events, setEvents, loaded] = usePluginStore<CalendarEvent[]>(PLUGIN_ID, "events", []);
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [newTitle, setNewTitle] = useState("");

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [cursor]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.date) ?? [];
      list.push(ev);
      map.set(ev.date, list);
    }
    return map;
  }, [events]);

  const todayKey = toDateKey(new Date());
  const selectedEvents = eventsByDate.get(selectedDate) ?? [];

  function addEvent() {
    if (!newTitle.trim()) return;
    setEvents([...events, { id: randomId(), date: selectedDate, title: newTitle.trim() }]);
    setNewTitle("");
  }

  function deleteEvent(id: string) {
    setEvents(events.filter((e) => e.id !== id));
  }

  if (!loaded) return null;

  return (
    <div className="flex h-full gap-4">
      <div className="flex-1 rounded-lg glass-panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="app-no-drag rounded p-1 hover:bg-black/5 dark:hover:bg-white/10">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-sm font-semibold">
            {cursor.getFullYear()}年{cursor.getMonth() + 1}月
          </h2>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="app-no-drag rounded p-1 hover:bg-black/5 dark:hover:bg-white/10">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-500 mb-1">
          {WEEKDAYS_JA.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            if (!day) return <div key={i} />;
            const key = toDateKey(day);
            const dayEvents = eventsByDate.get(key) ?? [];
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(key)}
                className={`app-no-drag flex h-16 flex-col items-start gap-0.5 rounded-md border p-1.5 text-xs transition-colors ${
                  key === selectedDate ? "border-accent bg-accent/10" : "border-transparent hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                <span className={key === todayKey ? "flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white" : ""}>
                  {day.getDate()}
                </span>
                {dayEvents.length > 0 && <span className="truncate w-full text-left text-[10px] text-accent">{dayEvents.length}件</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-72 shrink-0 rounded-lg glass-panel p-4 flex flex-col gap-3">
        <h3 className="text-sm font-semibold">{selectedDate} の予定</h3>
        <div className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEvent()}
            placeholder="予定を追加..."
            className="app-no-drag flex-1 rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10"
          />
          <button onClick={addEvent} className="app-no-drag rounded-lg bg-accent px-3 py-2 text-white hover:bg-accent-hover">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {selectedEvents.length === 0 && <p className="text-sm text-neutral-500">予定はありません</p>}
          {selectedEvents.map((ev) => (
            <div key={ev.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/10">
              <span className="flex-1 text-sm">{ev.title}</span>
              <Trash2
                size={14}
                className="app-no-drag shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100 cursor-pointer"
                onClick={() => deleteEvent(ev.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const CalendarPlugin: PluginModule = {
  manifest: {
    id: "calendar",
    name: "カレンダー",
    version: "0.1.0",
    description: "月表示カレンダーと予定管理",
    category: "life",
    entry: "calendar",
  },
  icon: CalendarDays,
  Component: CalendarPage,
};
