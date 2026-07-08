import { useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import { ScanText, Upload, Copy, Check } from "lucide-react";
import type { PluginModule } from "../../types";

const LANGUAGES = [
  { code: "jpn+eng", label: "日本語 + English" },
  { code: "eng", label: "English" },
  { code: "jpn", label: "日本語" },
];

function ImageOcrPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lang, setLang] = useState(LANGUAGES[0].code);
  const [progress, setProgress] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setText("");
    setPreviewUrl(URL.createObjectURL(file));
    setProgress(0);
    try {
      const worker = await createWorker(lang, undefined, {
        logger: (m) => {
          if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100));
        },
      });
      const { data } = await worker.recognize(file);
      setText(data.text.trim());
      await worker.terminate();
    } catch (err) {
      setError((err as Error).message + " (初回はモデルのダウンロードにインターネット接続が必要です)");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-4 pt-4">
      <div className="flex items-center gap-2">
        <select value={lang} onChange={(e) => setLang(e.target.value)} className="app-no-drag rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10">
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-neutral-400">言語モデルの初回利用時のみインターネット接続が必要です</p>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        className="app-no-drag flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl2 glass-panel border-2 border-dashed border-black/10 text-sm text-neutral-500 hover:border-accent dark:border-white/15"
      >
        {previewUrl ? (
          <img src={previewUrl} alt="preview" className="max-h-full max-w-full rounded-lg object-contain" />
        ) : (
          <>
            <Upload size={24} /> クリックして画像を選択
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>

      {progress !== null && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {text && (
        <div className="glass-panel flex-1 space-y-2 overflow-y-auto rounded-xl2 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-neutral-500">認識結果</h3>
            <button
              onClick={() => {
                void navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="app-no-drag flex items-center gap-1 rounded-md bg-black/5 px-2 py-1 text-xs hover:bg-black/10 dark:bg-white/10"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />} コピー
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm">{text}</p>
        </div>
      )}
    </div>
  );
}

export const ImageOcrPlugin: PluginModule = {
  manifest: {
    id: "image-ocr",
    name: "画像OCR",
    version: "0.1.0",
    description: "画像内の文字をテキストとして抽出",
    category: "image",
    entry: "image-ocr",
  },
  icon: ScanText,
  Component: ImageOcrPage,
};
