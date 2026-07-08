import type { NewsItem } from "./types";

const FEED_URL = "https://www3.nhk.or.jp/rss/news/cat0.xml";

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  if (!match) return "";
  return match[1]
    .replace("<![CDATA[", "")
    .replace("]]>", "")
    .trim();
}

/** NHKニュースのRSSフィードを取得し、簡易パースする(依存ライブラリ無しの最小限のXML抽出) */
export async function fetchNews(limit = 8): Promise<NewsItem[]> {
  const res = await fetch(FEED_URL);
  if (!res.ok) throw new Error("ニュースの取得に失敗しました");
  const xml = await res.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, limit);
  return items.map((m) => ({
    title: extractTag(m[1], "title"),
    link: extractTag(m[1], "link"),
    pubDate: extractTag(m[1], "pubDate"),
  }));
}
