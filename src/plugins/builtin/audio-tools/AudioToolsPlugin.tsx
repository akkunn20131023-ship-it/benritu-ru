import { useState } from "react";
import { fetchFile } from "@ffmpeg/util";
import { Music, Upload, Download, Loader2 } from "lucide-react";
import { getFFmpeg, fileDataToBlob } from "@/lib/ffmpeg";
import type { PluginModule } from "../../types";

type Tab = "convert" | "denoise" | "volume";

const TABS: { id: Tab; label: string }[] = [
  { id: "convert", label: "MP3/WAV変換" },
  { id: "denoise", label: "ノイズ除去" },
  { id: "volume", label: "音量調整" },
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
  return file.name.split(".").pop()?.toLowerCase() || "mp3";
}

function FilePicker({ file, onPick }: { file: File | null; onPick: (f: File) => void }) {
  return (
    <label className="app-no-drag flex w-fit cursor-pointer items-center gap-1.5 rounded-lg bg-black/5 px-3.5 py-2 text-sm hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15">
      <Upload size={14} /> {file ? file.name : "音声ファイルを選択"}
      <input
        type="file"
        accept="audio/*"
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

function AudioToolsPage() {
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
      <p className="text-xs text-neutral-400">処理はブラウザ内蔵の ffmpeg (WASM) で行われます。ノイズ除去は簡易フィルター(afftdn)による処理です。</p>

      {tab === "convert" && <ConvertTab />}
      {tab === "denoise" && <DenoiseTab />}
      {tab === "volume" && <VolumeTab />}
    </div>
  );
}

function ConvertTab() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"mp3" | "wav">("mp3");
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
      const codecArgs = format === "mp3" ? ["-c:a", "libmp3lame", "-q:a", "2"] : ["-c:a", "pcm_s16le"];
      await ffmpeg.exec(["-i", `input.${ext}`, ...codecArgs, outName]);
      const data = await ffmpeg.readFile(outName);
      downloadBlob(fileDataToBlob(data, format === "mp3" ? "audio/mpeg" : "audio/wav"), outName);
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
        {(["mp3", "wav"] as const).map((f) => (
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

function DenoiseTab() {
  const [file, setFile] = useState<File | null>(null);
  const [strength, setStrength] = useState(12);
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
      await ffmpeg.exec(["-i", `input.${ext}`, "-af", `afftdn=nf=-${strength}`, "output.wav"]);
      const data = await ffmpeg.readFile("output.wav");
      downloadBlob(fileDataToBlob(data, "audio/wav"), "denoised.wav");
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
      <label className="flex items-center gap-2 text-sm">
        除去強度
        <input type="range" min={0} max={40} value={strength} onChange={(e) => setStrength(Number(e.target.value))} className="app-no-drag w-40" />
        <span className="w-8 text-right text-xs">{strength}</span>
      </label>
      <button
        onClick={run}
        disabled={!file || progress !== null}
        className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40"
      >
        {progress !== null ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} ノイズ除去して保存 (WAV)
      </button>
      <ProgressBar progress={progress} />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function VolumeTab() {
  const [file, setFile] = useState<File | null>(null);
  const [gain, setGain] = useState(100);
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
      await ffmpeg.exec(["-i", `input.${ext}`, "-af", `volume=${gain / 100}`, "output.wav"]);
      const data = await ffmpeg.readFile("output.wav");
      downloadBlob(fileDataToBlob(data, "audio/wav"), "volume_adjusted.wav");
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
      <label className="flex items-center gap-2 text-sm">
        音量
        <input type="range" min={0} max={300} value={gain} onChange={(e) => setGain(Number(e.target.value))} className="app-no-drag w-40" />
        <span className="w-12 text-right text-xs">{gain}%</span>
      </label>
      <button
        onClick={run}
        disabled={!file || progress !== null}
        className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40"
      >
        {progress !== null ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 音量を調整して保存 (WAV)
      </button>
      <ProgressBar progress={progress} />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

export const AudioToolsPlugin: PluginModule = {
  manifest: {
    id: "audio-tools",
    name: "音声ツール",
    version: "0.1.0",
    description: "MP3/WAV変換・ノイズ除去・音量調整",
    category: "audio",
    entry: "audio-tools",
  },
  icon: Music,
  Component: AudioToolsPage,
};
