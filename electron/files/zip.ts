import JSZip from "jszip";
import fs from "node:fs/promises";
import path from "node:path";

async function addPathToZip(zip: JSZip, sourcePath: string, baseDir: string): Promise<void> {
  const stat = await fs.stat(sourcePath);
  const relPath = path.relative(baseDir, sourcePath).split(path.sep).join("/");
  if (stat.isDirectory()) {
    const entries = await fs.readdir(sourcePath);
    for (const entry of entries) {
      await addPathToZip(zip, path.join(sourcePath, entry), baseDir);
    }
  } else {
    const data = await fs.readFile(sourcePath);
    zip.file(relPath, data);
  }
}

/** 指定したファイル/フォルダ群を1つのZIPにまとめる */
export async function createZip(sourcePaths: string[], outputZipPath: string): Promise<void> {
  const zip = new JSZip();
  for (const sourcePath of sourcePaths) {
    const baseDir = path.dirname(sourcePath);
    await addPathToZip(zip, sourcePath, baseDir);
  }
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  await fs.writeFile(outputZipPath, buffer);
}

/** ZIPファイルを指定フォルダに解凍する */
export async function extractZip(zipPath: string, destDir: string): Promise<void> {
  const data = await fs.readFile(zipPath);
  const zip = await JSZip.loadAsync(data);
  await fs.mkdir(destDir, { recursive: true });

  for (const [relPath, entry] of Object.entries(zip.files)) {
    const targetPath = path.join(destDir, relPath);
    if (!targetPath.startsWith(destDir)) continue; // zip slip 対策
    if (entry.dir) {
      await fs.mkdir(targetPath, { recursive: true });
    } else {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      const content = await entry.async("nodebuffer");
      await fs.writeFile(targetPath, content);
    }
  }
}
