import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { FileText, Eye, Combine, Scissors } from "lucide-react";
import type { PluginModule } from "../../types";

type Tab = "view" | "merge" | "split";

const TABS: { id: Tab; label: string; icon: typeof Eye }[] = [
  { id: "view", label: "閲覧", icon: Eye },
  { id: "merge", label: "結合", icon: Combine },
  { id: "split", label: "分割", icon: Scissors },
];

function PdfToolsPage() {
  const [tab, setTab] = useState<Tab>("view");

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4">
      <div className="flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`app-no-drag flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm transition-colors ${
              tab === t.id ? "bg-accent text-white" : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "view" && <ViewTab />}
      {tab === "merge" && <MergeTab />}
      {tab === "split" && <SplitTab />}
    </div>
  );
}

function ViewTab() {
  const [filePath, setFilePath] = useState<string | null>(null);

  async function pick() {
    const files = await window.api.files.pickFiles([{ name: "PDF", extensions: ["pdf"] }]);
    if (files.length > 0) setFilePath(files[0]);
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      <button onClick={pick} className="app-no-drag self-start flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-hover">
        <FileText size={14} /> PDFファイルを選択
      </button>
      {filePath ? (
        <embed src={`file://${filePath}`} type="application/pdf" className="min-h-[500px] flex-1 rounded-lg border border-black/10 dark:border-white/10" />
      ) : (
        <div className="glass-panel flex flex-1 items-center justify-center rounded-xl2 p-8 text-sm text-neutral-500">PDFファイルを選択すると表示されます</div>
      )}
    </div>
  );
}

function MergeTab() {
  const [files, setFiles] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  async function pick() {
    const picked = await window.api.files.pickFiles([{ name: "PDF", extensions: ["pdf"] }]);
    if (picked.length > 0) setFiles(picked);
  }

  async function merge() {
    if (files.length < 2) return;
    setStatus("結合中...");
    const merged = await PDFDocument.create();
    for (const f of files) {
      const bytes = await window.api.files.readBuffer(f);
      const doc = await PDFDocument.load(bytes);
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    }
    const output = await merged.save();
    const savePath = await window.api.files.pickSavePath("merged.pdf", [{ name: "PDF", extensions: ["pdf"] }]);
    if (!savePath) {
      setStatus(null);
      return;
    }
    await window.api.files.writeBuffer(savePath, output);
    setStatus(`結合しました: ${savePath}`);
  }

  return (
    <div className="glass-panel space-y-3 rounded-xl2 p-6">
      <button onClick={pick} className="app-no-drag flex items-center gap-1.5 rounded-lg bg-black/5 px-3.5 py-2 text-sm hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15">
        結合するPDFを複数選択 (順番通り)
      </button>
      {files.length > 0 && (
        <ul className="space-y-1 text-sm">
          {files.map((f, i) => (
            <li key={f} className="truncate text-neutral-500">
              {i + 1}. {f}
            </li>
          ))}
        </ul>
      )}
      <button
        onClick={merge}
        disabled={files.length < 2}
        className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40"
      >
        <Combine size={14} /> 結合してPDFを保存
      </button>
      {status && <p className="text-xs text-neutral-500">{status}</p>}
    </div>
  );
}

function SplitTab() {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(1);
  const [status, setStatus] = useState<string | null>(null);

  async function pick() {
    const files = await window.api.files.pickFiles([{ name: "PDF", extensions: ["pdf"] }]);
    if (files.length === 0) return;
    setFilePath(files[0]);
    const bytes = await window.api.files.readBuffer(files[0]);
    const doc = await PDFDocument.load(bytes);
    setPageCount(doc.getPageCount());
    setFrom(1);
    setTo(doc.getPageCount());
  }

  async function split() {
    if (!filePath) return;
    setStatus("分割中...");
    const bytes = await window.api.files.readBuffer(filePath);
    const doc = await PDFDocument.load(bytes);
    const result = await PDFDocument.create();
    const indices = Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i).filter((i) => i >= 0 && i < doc.getPageCount());
    const pages = await result.copyPages(doc, indices);
    pages.forEach((p) => result.addPage(p));
    const output = await result.save();
    const savePath = await window.api.files.pickSavePath(`split_${from}-${to}.pdf`, [{ name: "PDF", extensions: ["pdf"] }]);
    if (!savePath) {
      setStatus(null);
      return;
    }
    await window.api.files.writeBuffer(savePath, output);
    setStatus(`保存しました: ${savePath}`);
  }

  return (
    <div className="glass-panel space-y-3 rounded-xl2 p-6">
      <button onClick={pick} className="app-no-drag flex items-center gap-1.5 rounded-lg bg-black/5 px-3.5 py-2 text-sm hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15">
        分割するPDFを選択
      </button>
      {filePath && (
        <>
          <p className="text-xs text-neutral-500">
            {filePath} (全{pageCount}ページ)
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span>ページ</span>
            <input
              type="number"
              min={1}
              max={pageCount}
              value={from}
              onChange={(e) => setFrom(Number(e.target.value))}
              className="app-no-drag w-16 rounded-lg bg-black/5 px-2 py-1.5 text-center outline-none dark:bg-white/10"
            />
            <span>〜</span>
            <input
              type="number"
              min={1}
              max={pageCount}
              value={to}
              onChange={(e) => setTo(Number(e.target.value))}
              className="app-no-drag w-16 rounded-lg bg-black/5 px-2 py-1.5 text-center outline-none dark:bg-white/10"
            />
          </div>
          <button onClick={split} className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover">
            <Scissors size={14} /> 指定範囲を抽出して保存
          </button>
        </>
      )}
      {status && <p className="text-xs text-neutral-500">{status}</p>}
    </div>
  );
}

export const PdfToolsPlugin: PluginModule = {
  manifest: {
    id: "pdf-tools",
    name: "PDFツール",
    version: "0.1.0",
    description: "PDFの閲覧・結合・分割",
    category: "document",
    entry: "pdf-tools",
  },
  icon: FileText,
  Component: PdfToolsPage,
};
