import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/** 利用規約・プライバシーポリシー共通の読み物レイアウト (ログイン不要・単独で表示可能) */
export function LegalLayout({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} — Mytnela Flow`;
    return () => {
      document.title = prev;
    };
  }, [title]);

  return (
    <div className="h-screen overflow-y-auto bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/70">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-accent">
            <ArrowLeft size={16} /> トップへ戻る
          </Link>
          <span className="ml-auto font-semibold">Mytnela Flow</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-neutral-500">最終更新日: {updated}</p>
        <div className="legal-body mt-8">{children}</div>
        <div className="mt-12 border-t border-black/5 pt-6 dark:border-white/10">
          <Link to="/app" className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover">
            アプリを使ってみる
          </Link>
        </div>
      </main>
    </div>
  );
}

/** 見出し + 本文の節 */
export function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="mb-2 text-lg font-semibold">{heading}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{children}</div>
    </section>
  );
}
