import { useState } from "react";
import { Archive, Fingerprint, Copy, GitCompare, Trash2, FolderSearch, PackagePlus, PackageOpen } from "lucide-react";
import type { DuplicateGroup } from "@shared/types";
import { formatBytes } from "@/lib/formatBytes";
import type { PluginModule } from "../../types";

type Tab = "zip" | "duplicates" | "hash" | "compare";

const TABS: { id: Tab; label: string }[] = [
  { id: "zip", label: "ZIP圧縮/解凍" },
  { id: "duplicates", label: "重複ファイル検索" },
  { id: "hash", label: "ハッシュ確認" },
  { id: "compare", label: "ファイル比較" },
];

function FileToolsPage() {
  const [tab, setTab] = useState<Tab>("zip");

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

      {tab === "zip" && <ZipTab />}
      {tab === "duplicates" && <DuplicatesTab />}
      {tab === "hash" && <HashTab />}
      {tab === "compare" && <CompareTab />}
    </div>
  );
}

function ZipTab() {
  const [status, setStatus] = useState<string | null>(null);

  async function createZip() {
    setStatus(null);
    const files = await window.api.files.pickFiles();
    if (files.length === 0) return;
    const savePath = await window.api.files.pickSavePath("archive.zip", [{ name: "ZIP", extensions: ["zip"] }]);
    if (!savePath) return;
    setStatus("圧縮中...");
    await window.api.files.zipCreate(files, savePath);
    setStatus(`作成しました: ${savePath}`);
  }

  async function extractZip() {
    setStatus(null);
    const files = await window.api.files.pickFiles([{ name: "ZIP", extensions: ["zip"] }]);
    if (files.length === 0) return;
    const destDir = await window.api.files.pickFolder();
    if (!destDir) return;
    setStatus("解凍中...");
    await window.api.files.zipExtract(files[0], destDir);
    setStatus(`解凍しました: ${destDir}`);
  }

  return (
    <div className="glass-panel flex flex-col gap-3 rounded-xl2 p-6">
      <button onClick={createZip} className="app-no-drag flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover">
        <PackagePlus size={16} /> ファイルを選択してZIP作成
      </button>
      <button
        onClick={extractZip}
        className="app-no-drag flex items-center gap-2 rounded-lg bg-black/5 px-4 py-2.5 text-sm font-medium hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
      >
        <PackageOpen size={16} /> ZIPファイルを解凍
      </button>
      {status && <p className="text-xs text-neutral-500">{status}</p>}
    </div>
  );
}

function DuplicatesTab() {
  const [groups, setGroups] = useState<DuplicateGroup[] | null>(null);
  const [scanning, setScanning] = useState(false);

  async function scan() {
    const folder = await window.api.files.pickFolder();
    if (!folder) return;
    setScanning(true);
    setGroups(null);
    try {
      const result = await window.api.files.findDuplicates(folder);
      setGroups(result);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="space-y-3">
      <button onClick={scan} disabled={scanning} className="app-no-drag flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50">
        <FolderSearch size={16} /> {scanning ? "スキャン中..." : "フォルダを選んで重複検索"}
      </button>

      {groups && groups.length === 0 && <p className="text-sm text-neutral-500">重複ファイルは見つかりませんでした</p>}

      {groups && groups.length > 0 && (
        <div className="space-y-2">
          {groups.map((g) => (
            <div key={g.hash} className="glass-panel rounded-lg p-3">
              <p className="mb-1.5 text-xs text-neutral-500">
                {formatBytes(g.size)} ・ {g.paths.length}件が重複
              </p>
              <div className="space-y-1">
                {g.paths.map((p) => (
                  <div key={p} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">{p}</span>
                    <Trash2
                      size={14}
                      className="app-no-drag shrink-0 cursor-pointer text-neutral-400 hover:text-red-500"
                      onClick={async () => {
                        await window.api.files.trash(p);
                        setGroups(groups.map((gr) => (gr.hash === g.hash ? { ...gr, paths: gr.paths.filter((x) => x !== p) } : gr)));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HashTab() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [algo, setAlgo] = useState<"md5" | "sha1" | "sha256">("sha256");
  const [hash, setHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function pickAndHash(nextAlgo = algo) {
    const files = await window.api.files.pickFiles();
    if (files.length === 0) return;
    setFileName(files[0]);
    const result = await window.api.files.hash(files[0], nextAlgo);
    setHash(result);
    setCopied(false);
  }

  async function changeAlgo(next: "md5" | "sha1" | "sha256") {
    setAlgo(next);
    if (fileName) {
      const result = await window.api.files.hash(fileName, next);
      setHash(result);
      setCopied(false);
    }
  }

  return (
    <div className="glass-panel space-y-3 rounded-xl2 p-6">
      <button onClick={() => pickAndHash()} className="app-no-drag flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover">
        <Fingerprint size={16} /> ファイルを選択
      </button>
      {fileName && (
        <>
          <p className="truncate text-xs text-neutral-500">{fileName}</p>
          <div className="flex gap-1.5">
            {(["md5", "sha1", "sha256"] as const).map((a) => (
              <button
                key={a}
                onClick={() => changeAlgo(a)}
                className={`app-no-drag rounded-full px-3 py-1 text-xs ${algo === a ? "bg-accent text-white" : "bg-black/5 hover:bg-black/10 dark:bg-white/10"}`}
              >
                {a.toUpperCase()}
              </button>
            ))}
          </div>
          {hash && (
            <div className="flex items-center gap-2 rounded-lg bg-black/5 px-3 py-2 dark:bg-white/10">
              <code className="flex-1 truncate text-xs">{hash}</code>
              <Copy
                size={14}
                className="app-no-drag shrink-0 cursor-pointer text-neutral-400 hover:text-accent"
                onClick={() => {
                  void navigator.clipboard.writeText(hash);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              />
              {copied && <span className="text-xs text-accent">コピー済み</span>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CompareTab() {
  const [fileA, setFileA] = useState<string | null>(null);
  const [fileB, setFileB] = useState<string | null>(null);
  const [result, setResult] = useState<{ identical: boolean; hashA: string; hashB: string } | null>(null);
  const [comparing, setComparing] = useState(false);

  async function pick(which: "a" | "b") {
    const files = await window.api.files.pickFiles();
    if (files.length === 0) return;
    if (which === "a") setFileA(files[0]);
    else setFileB(files[0]);
    setResult(null);
  }

  async function compare() {
    if (!fileA || !fileB) return;
    setComparing(true);
    try {
      setResult(await window.api.files.compare(fileA, fileB));
    } finally {
      setComparing(false);
    }
  }

  return (
    <div className="glass-panel space-y-3 rounded-xl2 p-6">
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => pick("a")} className="app-no-drag rounded-lg bg-black/5 px-3 py-2 text-xs hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15">
          {fileA ? fileA.split(/[\\/]/).pop() : "ファイルA を選択"}
        </button>
        <button onClick={() => pick("b")} className="app-no-drag rounded-lg bg-black/5 px-3 py-2 text-xs hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15">
          {fileB ? fileB.split(/[\\/]/).pop() : "ファイルB を選択"}
        </button>
      </div>
      <button
        onClick={compare}
        disabled={!fileA || !fileB || comparing}
        className="app-no-drag flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40"
      >
        <GitCompare size={16} /> {comparing ? "比較中..." : "比較する"}
      </button>
      {result && (
        <p className={`text-sm font-medium ${result.identical ? "text-green-600" : "text-red-500"}`}>
          {result.identical ? "同一のファイルです" : "異なるファイルです"}
        </p>
      )}
    </div>
  );
}

export const FileToolsPlugin: PluginModule = {
  manifest: {
    id: "file-tools",
    name: "ファイルツール",
    version: "0.1.0",
    description: "ZIP圧縮/解凍・重複検索・ハッシュ確認・ファイル比較",
    category: "files",
    entry: "file-tools",
  },
  icon: Archive,
  Component: FileToolsPage,
};
