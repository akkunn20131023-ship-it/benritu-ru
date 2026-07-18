import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import clsx from "clsx";
import { TitleBar } from "./TitleBar";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";
import { useLayoutStore } from "@/stores/useLayoutStore";

/** アプリ全体の骨格: タイトルバー + サイドバー + メインコンテンツ(ルーティング先) */
export function AppLayout() {
  const { mobileNavOpen, setMobileNavOpen } = useLayoutStore();
  const location = useLocation();

  // 画面遷移したらスマホのドロワーは自動で閉じる
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, setMobileNavOpen]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <TitleBar />
      <div className="relative flex min-h-0 flex-1">
        {/* スマホ幅: 背景オーバーレイ (タップで閉じる)。md以上では非表示 */}
        {mobileNavOpen && (
          <div className="absolute inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileNavOpen(false)} aria-hidden />
        )}

        {/* サイドバー: md以上は通常配置、md未満はドロワー (スライドイン) */}
        <div
          className={clsx(
            "z-40 max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:bg-neutral-100 max-md:shadow-2xl max-md:transition-transform max-md:duration-200 dark:max-md:bg-neutral-950",
            mobileNavOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
          )}
        >
          <Sidebar />
        </div>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
