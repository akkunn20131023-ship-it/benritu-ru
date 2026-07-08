import { useThemeStore } from "@/stores/useThemeStore";
import type { ThemeMode } from "@shared/types";

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "ライト" },
  { value: "dark", label: "ダーク" },
  { value: "system", label: "システムに合わせる" },
];

/** 基本設定画面: テーマ切り替えなど(AI連携・言語設定などは今後のフェーズで追加) */
export default function SettingsPage() {
  const { mode, setMode } = useThemeStore();

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-6">
      <div>
        <h1 className="text-xl font-semibold">設定</h1>
        <p className="text-sm text-neutral-500">アプリの見た目や動作をカスタマイズします。</p>
      </div>

      <section className="glass-panel rounded-xl2 p-5">
        <h2 className="mb-3 text-sm font-semibold">テーマ</h2>
        <div className="flex gap-2">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMode(opt.value)}
              className={`app-no-drag rounded-lg px-4 py-2 text-sm transition-colors ${
                mode === opt.value ? "bg-accent text-white" : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
