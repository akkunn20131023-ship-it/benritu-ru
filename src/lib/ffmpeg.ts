import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

let instance: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;

/**
 * ffmpeg.wasm を遅延ロードして共有インスタンスを返す。
 * コア(js/wasm)はネットワーク不要でオフライン動作するようアプリに同梱し `/ffmpeg-core/` から配信する。
 */
export async function getFFmpeg(): Promise<FFmpeg> {
  if (instance) return instance;
  if (loading) return loading;

  loading = (async () => {
    const ffmpeg = new FFmpeg();
    const baseURL = "/ffmpeg-core";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    instance = ffmpeg;
    return ffmpeg;
  })();

  return loading;
}

/** ffmpeg.readFile() の戻り値 (Uint8Array | string) を Blob に変換する */
export function fileDataToBlob(data: Uint8Array | string, type: string): Blob {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  return new Blob([bytes], { type });
}
