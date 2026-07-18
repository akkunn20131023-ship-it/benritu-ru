import { useEffect, useState } from "react";
import { Minus, Square, Copy, X, Search, Moon, Sun, Menu } from "lucide-react";
import { useLayoutStore } from "@/stores/useLayoutStore";
import { useThemeStore } from "@/stores/useThemeStore";

/** Windows 11 風のフレームレスタイトルバー。ドラッグ領域とウィンドウ操作ボタンを持つ */
export function TitleBar() {
  const [maximized, setMaximized] = useState(false);
  const setCommandPaletteOpen = useLayoutStore((s) => s.setCommandPaletteOpen);
  const toggleMobileNav = useLayoutStore((s) => s.toggleMobileNav);
  const { resolved, setMode } = useThemeStore();
  const isDesktop = window.api.platform === "electron";

  useEffect(() => {
    if (!isDesktop) return;
    void window.api.window.isMaximized().then(setMaximized);
    return window.api.window.onMaximizedChange(setMaximized);
  }, [isDesktop]);

  return (
    <div className="app-drag flex h-10 shrink-0 items-center justify-between border-b border-black/5 bg-white/60 pl-3 dark:border-white/5 dark:bg-neutral-900/60">
      <div className="flex items-center gap-1 text-sm font-medium">
        <button
          onClick={toggleMobileNav}
          className="app-no-drag -ml-1 flex h-8 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-black/5 md:hidden dark:hover:bg-white/10"
          title="メニュー"
          aria-label="メニューを開く"
        >
          <Menu size={18} />
        </button>
        <span className="h-2 w-2 rounded-full bg-accent" />
        Mytnela Flow
      </div>

      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="app-no-drag flex w-72 items-center gap-2 rounded-md border border-black/5 bg-black/5 px-2.5 py-1 text-xs text-neutral-500 hover:bg-black/10 max-md:w-9 max-md:justify-center max-md:px-0 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
        title="検索・コマンド"
        aria-label="検索・コマンド"
      >
        <Search size={13} />
        <span className="max-md:hidden">検索・コマンド...</span>
        <kbd className="ml-auto rounded border border-black/10 px-1 text-[10px] max-md:hidden dark:border-white/10">Ctrl K</kbd>
      </button>

      <div className="flex h-full items-center">
        <button
          onClick={() => setMode(resolved === "dark" ? "light" : "dark")}
          className="app-no-drag flex h-10 w-11 items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"
          title="テーマ切り替え"
        >
          {resolved === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        {isDesktop && (
          <>
            <button
              onClick={() => window.api.window.minimize()}
              className="app-no-drag flex h-10 w-11 items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Minus size={15} />
            </button>
            <button
              onClick={() => window.api.window.maximize()}
              className="app-no-drag flex h-10 w-11 items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"
            >
              {maximized ? <Copy size={13} /> : <Square size={13} />}
            </button>
            <button
              onClick={() => window.api.window.close()}
              className="app-no-drag flex h-10 w-11 items-center justify-center hover:bg-red-500 hover:text-white"
            >
              <X size={15} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
