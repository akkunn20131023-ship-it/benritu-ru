import { useEffect, useState } from "react";

const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];

/** 現在時刻と今日の日付を表示するウィジェット */
export function ClockWidget() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const time = now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 (${WEEKDAYS_JA[now.getDay()]})`;

  return (
    <div className="glass-panel flex flex-col justify-center rounded-xl2 p-6">
      <p className="text-4xl font-semibold tabular-nums">{time}</p>
      <p className="mt-1 text-sm text-neutral-500">{date}</p>
    </div>
  );
}
