import { useRef, useState } from "react";
import jsQR from "jsqr";
import { ScanLine, Upload, Copy, Check } from "lucide-react";
import type { PluginModule } from "../../types";

function QrReaderPage() {
  const [result, setResult] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    setCopied(false);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        setResult(code.data);
      } else {
        setError("QRコードを検出できませんでした");
      }
    };
    img.src = url;
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center gap-5 pt-6">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="app-no-drag flex h-64 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl2 glass-panel border-2 border-dashed border-black/10 text-sm text-neutral-500 hover:border-accent dark:border-white/15"
      >
        {previewUrl ? (
          <img src={previewUrl} alt="preview" className="max-h-full max-w-full rounded-lg object-contain" />
        ) : (
          <>
            <Upload size={28} />
            画像をドラッグ&ドロップ、またはクリックして選択
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

      {error && <p className="text-sm text-red-500">{error}</p>}

      {result && (
        <div className="glass-panel flex w-full items-center gap-2 rounded-lg p-4">
          <p className="flex-1 truncate text-sm">{result}</p>
          <button onClick={copy} className="app-no-drag rounded-md p-2 hover:bg-black/5 dark:hover:bg-white/10">
            {copied ? <Check size={16} className="text-accent" /> : <Copy size={16} />}
          </button>
        </div>
      )}
    </div>
  );
}

export const QrReaderPlugin: PluginModule = {
  manifest: {
    id: "qr-reader",
    name: "QRコード読み取り",
    version: "0.1.0",
    description: "画像からQRコードを読み取り",
    category: "life",
    entry: "qr-reader",
  },
  icon: ScanLine,
  Component: QrReaderPage,
};
