import { useRef, useState } from "react";
import { Check, Download, Upload, ShieldCheck } from "lucide-react";
import { useThemeStore } from "@/stores/useThemeStore";
import { ACCENT_PRESETS } from "@/lib/color";
import { exportBackup, importBackup } from "@/lib/backup";
import type { ThemeMode } from "@shared/types";

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "ライト" },
  { value: "dark", label: "ダーク" },
  { value: "system", label: "システムに合わせる" },
];

/** 基本設定画面: テーマ・アクセントカラー切り替えなど(AI連携・言語設定などは今後のフェーズで追加) */
export default function SettingsPage() {
  const { mode, setMode, accentColor, setAccentColor } = useThemeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function handleImportFile(file: File) {
    try {
      const count = importBackup(await file.text());
      setImportMessage({ tone: "ok", text: `${count}件のデータを読み込みました。反映のため画面を更新します。` });
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      setImportMessage({ tone: "error", text: (err as Error).message });
    }
  }

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

      <section className="glass-panel rounded-xl2 p-5">
        <h2 className="mb-3 text-sm font-semibold">アクセントカラー</h2>
        <div className="flex gap-3">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setAccentColor(preset.color)}
              title={preset.label}
              aria-label={preset.label}
              style={{ backgroundColor: preset.color }}
              className="app-no-drag flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110"
            >
              {accentColor === preset.color && <Check size={16} className="text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-xl2 p-5">
        <h2 className="mb-1 text-sm font-semibold">データのバックアップ</h2>
        <p className="mb-3 flex items-center gap-1.5 text-xs text-neutral-500">
          <ShieldCheck size={14} className="text-accent" />
          データはこの端末のブラウザ内にのみ保存されます。機種変更や別ブラウザへの引き継ぎに、ファイルとして書き出し・読み込みできます。
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportBackup}
            className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            <Download size={15} /> エクスポート
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="app-no-drag flex items-center gap-1.5 rounded-lg bg-black/5 px-4 py-2 text-sm font-medium hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
          >
            <Upload size={15} /> インポート
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = "";
            }}
          />
        </div>
        {importMessage && (
          <p className={`mt-2 text-xs ${importMessage.tone === "ok" ? "text-emerald-500" : "text-red-500"}`}>{importMessage.text}</p>
        )}
      </section>
    </div>
  );
}
