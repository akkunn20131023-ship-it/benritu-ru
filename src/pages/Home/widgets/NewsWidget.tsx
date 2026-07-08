import { useEffect, useState } from "react";
import { Newspaper } from "lucide-react";
import type { NewsItem } from "@shared/types";

/** ホーム画面向けのニュース見出し一覧 (NHKニュースRSS) */
export function NewsWidget() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    window.api.news
      .list()
      .then((list) => {
        setItems(list);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="glass-panel flex flex-col rounded-xl2 p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Newspaper size={16} className="text-accent" /> ニュース
      </h3>
      {status === "loading" && <p className="text-sm text-neutral-500">読み込み中...</p>}
      {status === "error" && <p className="text-sm text-neutral-500">ニュースを取得できませんでした</p>}
      {status === "ready" && (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i}>
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="text-sm hover:text-accent hover:underline"
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
