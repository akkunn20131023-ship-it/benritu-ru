import { useRef, useState } from "react";
import { fetchFile } from "@ffmpeg/util";
import { Video, Upload, Download, Loader2 } from "lucide-react";
import { getFFmpeg, fileDataToBlob } from "@/lib/ffmpeg";
import type { PluginModule } from "../../types";

type Tab = "convert" | "trim" | "gif" | "thumbnail";

const TABS: { id: Tab; label: string }[] = [
  { id: "convert", label: "動画変換" },
  { id: "trim", label: "トリミング" },
  { id: "gif", label: "GIF作成" },
  { id: "thumbnail", label: "サムネイル生成" },
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function inputExt(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() || "mp4";
}

function FilePicker({ file, onPick }: { file: File | null; onPick: (f: File) => void }) {
  return (
    <label className="app-no-drag flex w-fit cursor-pointer items-center gap-1.5 rounded-lg bg-black/5 px-3.5 py-2 text-sm hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15">
      <Upload size={14} /> {file ? file.name : "動画ファイルを選択"}
      <input
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />
    </label>
  );
}

function ProgressBar({ progress }: { progress: number | null }) {
  if (progress === null) return null;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
      <div className="h-full bg-accent transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
    </div>
  );
}

function VideoToolsPage() {
  const [tab, setTab] = useState<Tab>("convert");

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`app-no-drag rounded-lg px-3.5 py-1.5 text-sm transition-colors ${
              tab === t.id ? "bg-accent text-white" : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-neutral-400">
        処理はブラウザ内蔵の ffmpeg (WASM) で行われます。初回はエンジンの読み込みに数秒かかります。大きなファイルは時間がかかる場合があります。
      </p>

      {tab === "convert" && <ConvertTab />}
      {tab === "trim" && <TrimTab />}
      {tab === "gif" && <GifTab />}
      {tab === "thumbnail" && <ThumbnailTab />}
    </div>
  );
}

function ConvertTab() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"mp4" | "webm">("mp4");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      const ffmpeg = await getFFmpeg();
      const onProgress = ({ progress: p }: { progress: number }) => setProgress(p);
      ffmpeg.on("progress", onProgress);
      const ext = inputExt(file);
      await ffmpeg.writeFile(`input.${ext}`, await fetchFile(file));
      const outName = `output.${format}`;
      const codecArgs = format === "mp4" ? ["-c:v", "libx264", "-c:a", "aac"] : ["-c:v", "libvpx-vp9", "-c:a", "libopus"];
      await ffmpeg.exec(["-i", `input.${ext}`, ...codecArgs, outName]);
      const data = await ffmpeg.readFile(outName);
      downloadBlob(fileDataToBlob(data, `video/${format}`), outName);
      ffmpeg.off("progress", onProgress);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="glass-panel space-y-3 rounded-xl2 p-6">
      <FilePicker file={file} onPick={setFile} />
      <div className="flex items-center gap-2 text-sm">
        <span>出力形式:</span>
        {(["mp4", "webm"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`app-no-drag rounded-full px-3 py-1 text-xs ${format === f ? "bg-accent text-white" : "bg-black/5 hover:bg-black/10 dark:bg-white/10"}`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>
      <button
        onClick={run}
        disabled={!file || progress !== null}
        className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40"
      >
        {progress !== null ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 変換して保存
      </button>
      <ProgressBar progress={progress} />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function TrimTab() {
  const [file, setFile] = useState<File | null>(null);
  const [start, setStart] = useState("00:00:00");
  const [end, setEnd] = useState("00:00:05");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      const ffmpeg = await getFFmpeg();
      const onProgress = ({ progress: p }: { progress: number }) => setProgress(p);
      ffmpeg.on("progress", onProgress);
      const ext = inputExt(file);
      await ffmpeg.writeFile(`input.${ext}`, await fetchFile(file));
      await ffmpeg.exec(["-i", `input.${ext}`, "-ss", start, "-to", end, "-c:v", "libx264", "-c:a", "aac", "output.mp4"]);
      const data = await ffmpeg.readFile("output.mp4");
      downloadBlob(fileDataToBlob(data, "video/mp4"), "trimmed.mp4");
      ffmpeg.off("progress", onProgress);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="glass-panel space-y-3 rounded-xl2 p-6">
      <FilePicker file={file} onPick={setFile} />
      <div className="flex items-center gap-2 text-sm">
        <span>開始</span>
        <input value={start} onChange={(e) => setStart(e.target.value)} placeholder="00:00:00" className="app-no-drag w-28 rounded-lg bg-black/5 px-2 py-1.5 text-center outline-none dark:bg-white/10" />
        <span>終了</span>
        <input value={end} onChange={(e) => setEnd(e.target.value)} placeholder="00:00:05" className="app-no-drag w-28 rounded-lg bg-black/5 px-2 py-1.5 text-center outline-none dark:bg-white/10" />
      </div>
      <button
        onClick={run}
        disabled={!file || progress !== null}
        className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40"
      >
        {progress !== null ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} トリミングして保存
      </button>
      <ProgressBar progress={progress} />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function GifTab() {
  const [file, setFile] = useState<File | null>(null);
  const [start, setStart] = useState("00:00:00");
  const [duration, setDuration] = useState("3");
  const [fps, setFps] = useState(10);
  const [width, setWidth] = useState(320);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      const ffmpeg = await getFFmpeg();
      const onProgress = ({ progress: p }: { progress: number }) => setProgress(p);
      ffmpeg.on("progress", onProgress);
      const ext = inputExt(file);
      await ffmpeg.writeFile(`input.${ext}`, await fetchFile(file));
      await ffmpeg.exec([
        "-i",
        `input.${ext}`,
        "-ss",
        start,
        "-t",
        duration,
        "-vf",
        `fps=${fps},scale=${width}:-1:flags=lanczos`,
        "output.gif",
      ]);
      const data = await ffmpeg.readFile("output.gif");
      downloadBlob(fileDataToBlob(data, "image/gif"), "output.gif");
      ffmpeg.off("progress", onProgress);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="glass-panel space-y-3 rounded-xl2 p-6">
      <FilePicker file={file} onPick={setFile} />
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>開始</span>
        <input value={start} onChange={(e) => setStart(e.target.value)} className="app-no-drag w-24 rounded-lg bg-black/5 px-2 py-1.5 text-center outline-none dark:bg-white/10" />
        <span>長さ(秒)</span>
        <input value={duration} onChange={(e) => setDuration(e.target.value)} className="app-no-drag w-16 rounded-lg bg-black/5 px-2 py-1.5 text-center outline-none dark:bg-white/10" />
        <span>FPS</span>
        <input type="number" value={fps} onChange={(e) => setFps(Number(e.target.value))} className="app-no-drag w-16 rounded-lg bg-black/5 px-2 py-1.5 text-center outline-none dark:bg-white/10" />
        <span>幅(px)</span>
        <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} className="app-no-drag w-20 rounded-lg bg-black/5 px-2 py-1.5 text-center outline-none dark:bg-white/10" />
      </div>
      <button
        onClick={run}
        disabled={!file || progress !== null}
        className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40"
      >
        {progress !== null ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} GIFを作成
      </button>
      <ProgressBar progress={progress} />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function ThumbnailTab() {
  const [file, setFile] = useState<File | null>(null);
  const [timestamp, setTimestamp] = useState("00:00:01");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLImageElement>(null);

  async function run() {
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      const ffmpeg = await getFFmpeg();
      const onProgress = ({ progress: p }: { progress: number }) => setProgress(p);
      ffmpeg.on("progress", onProgress);
      const ext = inputExt(file);
      await ffmpeg.writeFile(`input.${ext}`, await fetchFile(file));
      await ffmpeg.exec(["-i", `input.${ext}`, "-ss", timestamp, "-frames:v", "1", "thumb.png"]);
      const data = await ffmpeg.readFile("thumb.png");
      const blob = fileDataToBlob(data, "image/png");
      if (previewRef.current) previewRef.current.src = URL.createObjectURL(blob);
      downloadBlob(blob, "thumbnail.png");
      ffmpeg.off("progress", onProgress);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="glass-panel space-y-3 rounded-xl2 p-6">
      <FilePicker file={file} onPick={setFile} />
      <div className="flex items-center gap-2 text-sm">
        <span>時刻</span>
        <input value={timestamp} onChange={(e) => setTimestamp(e.target.value)} className="app-no-drag w-28 rounded-lg bg-black/5 px-2 py-1.5 text-center outline-none dark:bg-white/10" />
      </div>
      <button
        onClick={run}
        disabled={!file || progress !== null}
        className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40"
      >
        {progress !== null ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} サムネイルを生成
      </button>
      <ProgressBar progress={progress} />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <img ref={previewRef} alt="" className="max-h-48 rounded-lg" />
    </div>
  );
}

export const VideoToolsPlugin: PluginModule = {
  manifest: {
    id: "video-tools",
    name: "動画ツール",
    version: "0.1.0",
    description: "動画変換・トリミング・GIF作成・サムネイル生成",
    category: "video",
    entry: "video-tools",
  },
  icon: Video,
  Component: VideoToolsPage,
};
