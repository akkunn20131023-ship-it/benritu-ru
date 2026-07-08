import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode, Download } from "lucide-react";
import type { PluginModule } from "../../types";

function QrGeneratorPage() {
  const [text, setText] = useState("https://example.com");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!text.trim()) {
      setDataUrl(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(text, { width: 320, margin: 1 })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [text]);

  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center gap-5 pt-6">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="QRコードにするテキストやURLを入力..."
        rows={3}
        className="app-no-drag w-full resize-none rounded-lg glass-panel px-4 py-3 text-sm outline-none"
      />

      <div className="glass-panel flex flex-col items-center gap-3 rounded-xl2 p-6">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {dataUrl ? (
          <img src={dataUrl} alt="QR code" className="h-64 w-64 rounded-lg bg-white p-2" />
        ) : (
          <div className="flex h-64 w-64 items-center justify-center text-sm text-neutral-400">テキストを入力してください</div>
        )}
        {dataUrl && (
          <a
            href={dataUrl}
            download="qrcode.png"
            className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            <Download size={14} /> PNGを保存
          </a>
        )}
      </div>
    </div>
  );
}

export const QrGeneratorPlugin: PluginModule = {
  manifest: {
    id: "qr-generator",
    name: "QRコード生成",
    version: "0.1.0",
    description: "テキストやURLからQRコードを生成",
    category: "life",
    entry: "qr-generator",
  },
  icon: QrCode,
  Component: QrGeneratorPage,
};
