import { useEffect, useState } from "react";
import { History } from "lucide-react";
import type { RecentItem } from "@shared/types";

/** 最近開いたファイル・最近使った機能をまとめて表示 */
export function RecentWidget() {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    void window.api.recent.list(6).then(setItems);
  }, []);

  return (
    <div className="glass-panel flex flex-col rounded-xl2 p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <History size={16} className="text-accent" /> 最近使った項目
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">まだ利用履歴がありません</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between text-sm">
              <span className="truncate">{item.label}</span>
              <span className="shrink-0 text-xs text-neutral-400">{new Date(item.openedAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
