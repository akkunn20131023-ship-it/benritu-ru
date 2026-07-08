import { dialog, shell, type BrowserWindow } from "electron";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type { DuplicateGroup, FileEntry } from "../../shared/types";

export async function pickFolder(win: BrowserWindow): Promise<string | null> {
  const result = await dialog.showOpenDialog(win, { properties: ["openDirectory"] });
  return result.canceled ? null : result.filePaths[0];
}

export async function pickFiles(win: BrowserWindow, filters?: Electron.FileFilter[]): Promise<string[]> {
  const result = await dialog.showOpenDialog(win, { properties: ["openFile", "multiSelections"], filters });
  return result.canceled ? [] : result.filePaths;
}

export async function pickSavePath(win: BrowserWindow, defaultName: string, filters?: Electron.FileFilter[]): Promise<string | null> {
  const result = await dialog.showSaveDialog(win, { defaultPath: defaultName, filters });
  return result.canceled || !result.filePath ? null : result.filePath;
}

export async function listDirectory(dirPath: string): Promise<FileEntry[]> {
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });
  const results: FileEntry[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    try {
      const stat = await fsp.stat(fullPath);
      results.push({
        name: entry.name,
        path: fullPath,
        isDirectory: entry.isDirectory(),
        size: stat.size,
        modifiedAt: stat.mtimeMs,
      });
    } catch {
      // アクセス不可のエントリ (権限等) はスキップ
    }
  }
  return results.sort((a, b) => (a.isDirectory === b.isDirectory ? a.name.localeCompare(b.name) : a.isDirectory ? -1 : 1));
}

export async function statFile(filePath: string): Promise<FileEntry> {
  const stat = await fsp.stat(filePath);
  return {
    name: path.basename(filePath),
    path: filePath,
    isDirectory: stat.isDirectory(),
    size: stat.size,
    modifiedAt: stat.mtimeMs,
  };
}

export async function readTextFile(filePath: string): Promise<string> {
  return fsp.readFile(filePath, "utf-8");
}

export async function writeTextFile(filePath: string, content: string): Promise<void> {
  await fsp.writeFile(filePath, content, "utf-8");
}

export async function readFileBuffer(filePath: string): Promise<Buffer> {
  return fsp.readFile(filePath);
}

export async function writeFileBuffer(filePath: string, data: ArrayBuffer): Promise<void> {
  await fsp.writeFile(filePath, Buffer.from(data));
}

export async function hashFile(filePath: string, algo: "md5" | "sha1" | "sha256" = "sha256"): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algo);
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

/** OS のごみ箱に移動する (完全削除ではなく復元可能な削除) */
export async function trashFile(filePath: string): Promise<void> {
  await shell.trashItem(filePath);
}

/** OS 標準の関連付けアプリでファイルを開く */
export async function openPath(filePath: string): Promise<void> {
  await shell.openPath(filePath);
}

/** エクスプローラー等でファイルの場所を表示する */
export function showInFolder(filePath: string): void {
  shell.showItemInFolder(filePath);
}

async function walkFiles(dirPath: string): Promise<string[]> {
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

/** 指定フォルダ配下を再帰的にスキャンし、同一ハッシュのファイルをグループ化する */
export async function findDuplicates(dirPath: string): Promise<DuplicateGroup[]> {
  const files = await walkFiles(dirPath);
  const bySize = new Map<number, string[]>();
  for (const f of files) {
    const stat = await fsp.stat(f);
    const list = bySize.get(stat.size) ?? [];
    list.push(f);
    bySize.set(stat.size, list);
  }

  const groups: DuplicateGroup[] = [];
  for (const [size, candidates] of bySize) {
    if (candidates.length < 2) continue;
    const byHash = new Map<string, string[]>();
    for (const f of candidates) {
      const hash = await hashFile(f, "sha256");
      const list = byHash.get(hash) ?? [];
      list.push(f);
      byHash.set(hash, list);
    }
    for (const [hash, paths] of byHash) {
      if (paths.length >= 2) groups.push({ hash, size, paths });
    }
  }
  return groups;
}

export async function compareFiles(pathA: string, pathB: string): Promise<{ identical: boolean; hashA: string; hashB: string }> {
  const [hashA, hashB] = await Promise.all([hashFile(pathA, "sha256"), hashFile(pathB, "sha256")]);
  return { identical: hashA === hashB, hashA, hashB };
}
