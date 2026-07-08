import { useEffect, useState } from "react";
import { Globe2, Plus, Trash2 } from "lucide-react";
import { usePluginStore } from "../../usePluginStore";
import type { PluginModule } from "../../types";

const PLUGIN_ID = "world-clock";

const AVAILABLE_ZONES = [
  { tz: "Asia/Tokyo", label: "東京" },
  { tz: "America/Los_Angeles", label: "ロサンゼルス" },
  { tz: "America/New_York", label: "ニューヨーク" },
  { tz: "Europe/London", label: "ロンドン" },
  { tz: "Europe/Paris", label: "パリ" },
  { tz: "Asia/Shanghai", label: "上海" },
  { tz: "Asia/Seoul", label: "ソウル" },
  { tz: "Asia/Kolkata", label: "デリー" },
  { tz: "Australia/Sydney", label: "シドニー" },
  { tz: "Pacific/Auckland", label: "オークランド" },
  { tz: "UTC", label: "UTC" },
];

function WorldClockPage() {
  const [zones, setZones, loaded] = usePluginStore<string[]>(PLUGIN_ID, "zones", ["Asia/Tokyo", "America/New_York", "Europe/London"]);
  const [now, setNow] = useState(new Date());
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  function addZone(tz: string) {
    if (!zones.includes(tz)) setZones([...zones, tz]);
    setAdding(false);
  }

  function removeZone(tz: string) {
    setZones(zones.filter((z) => z !== tz));
  }

  if (!loaded) return null;

  const unusedZones = AVAILABLE_ZONES.filter((z) => !zones.includes(z.tz));

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-500">世界時計</h2>
        <div className="relative">
          <button
            onClick={() => setAdding((a) => !a)}
            className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            <Plus size={14} /> 都市を追加
          </button>
          {adding && (
            <div className="glass-panel absolute right-0 z-10 mt-1 max-h-64 w-48 overflow-y-auto rounded-lg p-1.5">
              {unusedZones.length === 0 && <p className="p-2 text-xs text-neutral-500">追加できる都市はありません</p>}
              {unusedZones.map((z) => (
                <button
                  key={z.tz}
                  onClick={() => addZone(z.tz)}
                  className="app-no-drag block w-full rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {z.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2">
        {zones.map((tz) => {
          const label = AVAILABLE_ZONES.find((z) => z.tz === tz)?.label ?? tz;
          const time = new Intl.DateTimeFormat("ja-JP", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now);
          const date = new Intl.DateTimeFormat("ja-JP", { timeZone: tz, month: "short", day: "numeric", weekday: "short" }).format(now);
          return (
            <div key={tz} className="glass-panel group flex items-center justify-between rounded-lg p-4">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-neutral-500">{date}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold tabular-nums">{time}</p>
                <Trash2
                  size={14}
                  className="app-no-drag shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100 cursor-pointer"
                  onClick={() => removeZone(tz)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const WorldClockPlugin: PluginModule = {
  manifest: {
    id: "world-clock",
    name: "世界時計",
    version: "0.1.0",
    description: "複数のタイムゾーンの現在時刻を表示",
    category: "life",
    entry: "world-clock",
  },
  icon: Globe2,
  Component: WorldClockPage,
};
