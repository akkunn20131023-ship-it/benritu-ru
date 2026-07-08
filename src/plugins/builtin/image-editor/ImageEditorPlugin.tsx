import { useRef, useState } from "react";
import { ImageIcon, Upload, RotateCw, RotateCcw, Crop, Download, Eraser, Check, X } from "lucide-react";
import { buildIco } from "@/lib/icoEncoder";
import type { PluginModule } from "../../types";

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("画像の書き出しに失敗しました"))), type, quality);
  });
}

function ImageEditorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [keepRatio, setKeepRatio] = useState(true);
  const [aspect, setAspect] = useState(1);
  const [cropping, setCropping] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  function getCanvas(): HTMLCanvasElement {
    if (!canvasRef.current) throw new Error("canvas not ready");
    return canvasRef.current;
  }

  function syncSizeState() {
    const canvas = getCanvas();
    setWidth(canvas.width);
    setHeight(canvas.height);
    setAspect(canvas.width / canvas.height);
  }

  async function handleFile(file: File) {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = getCanvas();
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      setLoaded(true);
      syncSizeState();
    };
    img.src = url;
  }

  function rotate(clockwise: boolean) {
    const canvas = getCanvas();
    const temp = document.createElement("canvas");
    temp.width = canvas.height;
    temp.height = canvas.width;
    const ctx = temp.getContext("2d")!;
    ctx.translate(temp.width / 2, temp.height / 2);
    ctx.rotate((clockwise ? 90 : -90) * (Math.PI / 180));
    ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    canvas.width = temp.width;
    canvas.height = temp.height;
    canvas.getContext("2d")!.drawImage(temp, 0, 0);
    syncSizeState();
  }

  function applyResize() {
    const canvas = getCanvas();
    const temp = document.createElement("canvas");
    temp.width = canvas.width;
    temp.height = canvas.height;
    temp.getContext("2d")!.drawImage(canvas, 0, 0);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(temp, 0, 0, width, height);
  }

  function onCropMouseDown(e: React.MouseEvent) {
    if (!cropping) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    dragStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setCropRect({ x: dragStart.current.x, y: dragStart.current.y, w: 0, h: 0 });
  }

  function onCropMouseMove(e: React.MouseEvent) {
    if (!cropping || !dragStart.current) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCropRect({
      x: Math.min(dragStart.current.x, x),
      y: Math.min(dragStart.current.y, y),
      w: Math.abs(x - dragStart.current.x),
      h: Math.abs(y - dragStart.current.y),
    });
  }

  function onCropMouseUp() {
    dragStart.current = null;
  }

  function applyCrop() {
    if (!cropRect || cropRect.w < 2 || cropRect.h < 2) {
      setCropping(false);
      setCropRect(null);
      return;
    }
    const canvas = getCanvas();
    const displayEl = canvas as HTMLCanvasElement;
    const scaleX = canvas.width / displayEl.clientWidth;
    const scaleY = canvas.height / displayEl.clientHeight;
    const sx = cropRect.x * scaleX;
    const sy = cropRect.y * scaleY;
    const sw = cropRect.w * scaleX;
    const sh = cropRect.h * scaleY;

    const temp = document.createElement("canvas");
    temp.width = sw;
    temp.height = sh;
    temp.getContext("2d")!.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    canvas.width = sw;
    canvas.height = sh;
    canvas.getContext("2d")!.drawImage(temp, 0, 0);
    setCropping(false);
    setCropRect(null);
    syncSizeState();
  }

  function removeBackground() {
    const canvas = getCanvas();
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width: w, height: h } = imageData;

    const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + w - 1) * 4];
    const avg = [0, 0, 0];
    for (const c of corners) {
      avg[0] += data[c];
      avg[1] += data[c + 1];
      avg[2] += data[c + 2];
    }
    avg[0] /= corners.length;
    avg[1] /= corners.length;
    avg[2] /= corners.length;

    const threshold = 40;
    for (let i = 0; i < data.length; i += 4) {
      const dist = Math.sqrt((data[i] - avg[0]) ** 2 + (data[i + 1] - avg[1]) ** 2 + (data[i + 2] - avg[2]) ** 2);
      if (dist < threshold) data[i + 3] = 0;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  async function exportAs(format: "png" | "jpeg" | "webp") {
    const canvas = getCanvas();
    const mime = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
    const blob = await canvasToBlob(canvas, mime, format === "jpeg" ? 0.92 : undefined);
    downloadBlob(blob, `image.${format === "jpeg" ? "jpg" : format}`);
  }

  async function exportIco() {
    const canvas = getCanvas();
    const sizes = [16, 32, 48, 256];
    const blobs = await Promise.all(
      sizes.map(async (size) => {
        const temp = document.createElement("canvas");
        temp.width = size;
        temp.height = size;
        temp.getContext("2d")!.drawImage(canvas, 0, 0, size, size);
        return { size, blob: await canvasToBlob(temp, "image/png") };
      })
    );
    const ico = await buildIco(blobs);
    downloadBlob(ico, "icon.ico");
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="app-no-drag flex cursor-pointer items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-hover">
          <Upload size={14} /> 画像を開く
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </label>
        {loaded && (
          <>
            <button onClick={() => rotate(false)} className="app-no-drag rounded-lg bg-black/5 p-2 hover:bg-black/10 dark:bg-white/10" title="反時計回りに回転">
              <RotateCcw size={16} />
            </button>
            <button onClick={() => rotate(true)} className="app-no-drag rounded-lg bg-black/5 p-2 hover:bg-black/10 dark:bg-white/10" title="時計回りに回転">
              <RotateCw size={16} />
            </button>
            <button
              onClick={() => {
                setCropping((c) => !c);
                setCropRect(null);
              }}
              className={`app-no-drag flex items-center gap-1 rounded-lg p-2 text-xs ${cropping ? "bg-accent text-white" : "bg-black/5 hover:bg-black/10 dark:bg-white/10"}`}
              title="クロップ"
            >
              <Crop size={16} />
            </button>
            {cropping && cropRect && (
              <>
                <button onClick={applyCrop} className="app-no-drag rounded-lg bg-green-500/15 p-2 text-green-600 hover:bg-green-500/25" title="適用">
                  <Check size={16} />
                </button>
                <button
                  onClick={() => {
                    setCropping(false);
                    setCropRect(null);
                  }}
                  className="app-no-drag rounded-lg bg-red-500/15 p-2 text-red-500 hover:bg-red-500/25"
                  title="キャンセル"
                >
                  <X size={16} />
                </button>
              </>
            )}
            <button onClick={removeBackground} className="app-no-drag flex items-center gap-1.5 rounded-lg bg-black/5 px-3 py-2 text-xs hover:bg-black/10 dark:bg-white/10" title="単色背景を透過(簡易)">
              <Eraser size={14} /> 背景除去(簡易)
            </button>
          </>
        )}
      </div>

      {loaded && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span>サイズ:</span>
          <input
            type="number"
            value={width}
            onChange={(e) => {
              const w = Number(e.target.value);
              setWidth(w);
              if (keepRatio) setHeight(Math.round(w / aspect));
            }}
            className="app-no-drag w-20 rounded-lg bg-black/5 px-2 py-1.5 text-center outline-none dark:bg-white/10"
          />
          <span>×</span>
          <input
            type="number"
            value={height}
            onChange={(e) => {
              const h = Number(e.target.value);
              setHeight(h);
              if (keepRatio) setWidth(Math.round(h * aspect));
            }}
            className="app-no-drag w-20 rounded-lg bg-black/5 px-2 py-1.5 text-center outline-none dark:bg-white/10"
          />
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={keepRatio} onChange={(e) => setKeepRatio(e.target.checked)} className="app-no-drag accent-accent" />
            比率維持
          </label>
          <button onClick={applyResize} className="app-no-drag rounded-lg bg-black/5 px-3 py-1.5 hover:bg-black/10 dark:bg-white/10">
            適用
          </button>
        </div>
      )}

      <div ref={containerRef} className="glass-panel relative flex flex-1 items-center justify-center overflow-auto rounded-xl2 p-4">
        {!loaded && <p className="text-sm text-neutral-500">画像を開いてください</p>}
        <div className="relative inline-block" onMouseDown={onCropMouseDown} onMouseMove={onCropMouseMove} onMouseUp={onCropMouseUp}>
          <canvas ref={canvasRef} className="max-w-full rounded-lg" style={{ display: loaded ? "block" : "none", cursor: cropping ? "crosshair" : "default" }} />
          {cropping && cropRect && (
            <div
              className="pointer-events-none absolute border-2 border-accent bg-accent/10"
              style={{ left: cropRect.x, top: cropRect.y, width: cropRect.w, height: cropRect.h }}
            />
          )}
        </div>
      </div>

      {loaded && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportAs("png")} className="app-no-drag flex items-center gap-1.5 rounded-lg bg-black/5 px-3 py-2 text-xs hover:bg-black/10 dark:bg-white/10">
            <Download size={12} /> PNG
          </button>
          <button onClick={() => exportAs("jpeg")} className="app-no-drag flex items-center gap-1.5 rounded-lg bg-black/5 px-3 py-2 text-xs hover:bg-black/10 dark:bg-white/10">
            <Download size={12} /> JPG
          </button>
          <button onClick={() => exportAs("webp")} className="app-no-drag flex items-center gap-1.5 rounded-lg bg-black/5 px-3 py-2 text-xs hover:bg-black/10 dark:bg-white/10">
            <Download size={12} /> WebP
          </button>
          <button onClick={exportIco} className="app-no-drag flex items-center gap-1.5 rounded-lg bg-black/5 px-3 py-2 text-xs hover:bg-black/10 dark:bg-white/10">
            <Download size={12} /> ICO
          </button>
        </div>
      )}
    </div>
  );
}

export const ImageEditorPlugin: PluginModule = {
  manifest: {
    id: "image-editor",
    name: "画像編集",
    version: "0.1.0",
    description: "リサイズ・クロップ・回転・形式変換・ICO生成",
    category: "image",
    entry: "image-editor",
  },
  icon: ImageIcon,
  Component: ImageEditorPage,
};
