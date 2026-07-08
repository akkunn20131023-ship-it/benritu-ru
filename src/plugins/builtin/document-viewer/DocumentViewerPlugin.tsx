import { useState } from "react";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import DOMPurify from "dompurify";
import { FileSpreadsheet, Upload } from "lucide-react";
import type { PluginModule } from "../../types";

type DocKind = "word" | "excel" | null;

function DocumentViewerPage() {
  const [kind, setKind] = useState<DocKind>(null);
  const [fileName, setFileName] = useState("");
  const [wordHtml, setWordHtml] = useState("");
  const [sheets, setSheets] = useState<{ name: string; html: string }[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    const buffer = await file.arrayBuffer();
    const ext = file.name.split(".").pop()?.toLowerCase();

    try {
      if (ext === "docx") {
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
        setWordHtml(DOMPurify.sanitize(result.value));
        setKind("word");
      } else if (ext === "xlsx" || ext === "xls") {
        const workbook = XLSX.read(buffer, { type: "array" });
        const parsed = workbook.SheetNames.map((name) => ({
          name,
          html: DOMPurify.sanitize(XLSX.utils.sheet_to_html(workbook.Sheets[name])),
        }));
        setSheets(parsed);
        setActiveSheet(0);
        setKind("excel");
      } else {
        setError("対応していないファイル形式です (.docx / .xlsx / .xls)");
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col gap-3">
      <label className="app-no-drag flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-hover">
        <Upload size={14} /> Word / Excel ファイルを開く
        <input
          type="file"
          accept=".docx,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {fileName && !error && <p className="text-xs text-neutral-500">{fileName}</p>}

      {kind === "word" && (
        <div className="markdown-body glass-panel flex-1 overflow-y-auto rounded-xl2 p-6 text-sm" dangerouslySetInnerHTML={{ __html: wordHtml }} />
      )}

      {kind === "excel" && (
        <div className="flex flex-1 flex-col gap-2 overflow-hidden">
          <div className="flex gap-1.5 overflow-x-auto">
            {sheets.map((s, i) => (
              <button
                key={s.name}
                onClick={() => setActiveSheet(i)}
                className={`app-no-drag shrink-0 rounded-lg px-3 py-1.5 text-xs ${
                  i === activeSheet ? "bg-accent text-white" : "bg-black/5 hover:bg-black/10 dark:bg-white/10"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
          <div
            className="glass-panel flex-1 overflow-auto rounded-xl2 p-4 text-xs [&_table]:border-collapse [&_td]:border [&_td]:border-black/10 [&_td]:px-2 [&_td]:py-1 dark:[&_td]:border-white/10"
            dangerouslySetInnerHTML={{ __html: sheets[activeSheet]?.html ?? "" }}
          />
        </div>
      )}

      {!kind && !error && (
        <div className="glass-panel flex flex-1 items-center justify-center rounded-xl2 p-8 text-sm text-neutral-500">
          <FileSpreadsheet size={20} className="mr-2" /> Wordまたは Excel ファイルを開いてください
        </div>
      )}
    </div>
  );
}

export const DocumentViewerPlugin: PluginModule = {
  manifest: {
    id: "document-viewer",
    name: "Word/Excel閲覧",
    version: "0.1.0",
    description: "Word文書とExcelファイルをその場で閲覧",
    category: "document",
    entry: "document-viewer",
  },
  icon: FileSpreadsheet,
  Component: DocumentViewerPage,
};
