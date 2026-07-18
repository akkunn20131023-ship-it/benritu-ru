import { LOCAL_STORE_PREFIX } from "@/lib/localApi";

/**
 * ブラウザ内 (localStorage) に保存された全データのエクスポート/インポート。
 *
 * データはこの端末のブラウザにのみ保存されるため、機種変更やバックアップのために
 * JSON ファイルとして書き出し・読み込みできるようにする。アカウントもクラウドも不要。
 */

/** 現ブランド名。旧「OmniSuite」形式のバックアップも読み込めるよう両方を受理する */
const APP_NAME = "Mytnela Flow";
const LEGACY_APP_NAMES = ["OmniSuite"];

interface BackupFile {
  app: string;
  version: 1;
  exportedAt: string;
  data: Record<string, unknown>;
}

/** omni: 名前空間の全キーを集めてバックアップJSONを組み立てる */
export function collectBackup(): BackupFile {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(LOCAL_STORE_PREFIX)) continue;
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    try {
      data[key] = JSON.parse(raw);
    } catch {
      data[key] = raw;
    }
  }
  return { app: APP_NAME, version: 1, exportedAt: new Date().toISOString(), data };
}

/** バックアップをファイルとしてダウンロードさせる */
export function exportBackup(): void {
  const blob = new Blob([JSON.stringify(collectBackup(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mytnela-flow-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** バックアップJSONを検証して localStorage を復元する。成功時は復元件数を返す */
export function importBackup(json: string): number {
  const parsed = JSON.parse(json) as Partial<BackupFile>;
  const validApp = parsed?.app === APP_NAME || LEGACY_APP_NAMES.includes(parsed?.app ?? "");
  if (!validApp || typeof parsed.data !== "object" || parsed.data === null) {
    throw new Error("Mytnela Flow のバックアップファイルではないようです");
  }
  let count = 0;
  for (const [key, value] of Object.entries(parsed.data)) {
    if (!key.startsWith(LOCAL_STORE_PREFIX)) continue;
    localStorage.setItem(key, JSON.stringify(value));
    count++;
  }
  return count;
}
