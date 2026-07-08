import { useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { FileEdit, FolderOpen, Save, FilePlus, Eye, Pencil } from "lucide-react";
import type { PluginModule } from "../../types";

function TextEditorPage() {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const isMarkdown = filePath?.toLowerCase().endsWith(".md") ?? false;

  async function open() {
    const files = await window.api.files.pickFiles([
      { name: "テキスト", extensions: ["txt", "md", "json", "csv", "log", "yml", "yaml", "js", "ts", "css", "html"] },
      { name: "すべてのファイル", extensions: ["*"] },
    ]);
    if (files.length === 0) return;
    const text = await window.api.files.readText(files[0]);
    setFilePath(files[0]);
    setContent(text);
    setDirty(false);
    setPreview(false);
    setStatus(null);
  }

  function newFile() {
    setFilePath(null);
    setContent("");
    setDirty(false);
    setPreview(false);
    setStatus(null);
  }

  async function save() {
    let target = filePath;
    if (!target) {
      target = await window.api.files.pickSavePath("untitled.txt");
      if (!target) return;
    }
    await window.api.files.writeText(target, content);
    setFilePath(target);
    setDirty(false);
    setStatus("保存しました");
    setTimeout(() => setStatus(null), 1500);
  }

  const renderedHtml = isMarkdown ? DOMPurify.sanitize(marked.parse(content, { async: false }) as string) : "";

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-3">
      <div className="flex items-center gap-2">
        <button onClick={newFile} className="app-no-drag flex items-center gap-1.5 rounded-lg bg-black/5 px-3 py-2 text-sm hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15">
          <FilePlus size={14} /> 新規
        </button>
        <button onClick={open} className="app-no-drag flex items-center gap-1.5 rounded-lg bg-black/5 px-3 py-2 text-sm hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15">
          <FolderOpen size={14} /> 開く
        </button>
        <button onClick={save} className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover">
          <Save size={14} /> 保存
        </button>
        {isMarkdown && (
          <button
            onClick={() => setPreview((p) => !p)}
            className="app-no-drag ml-auto flex items-center gap-1.5 rounded-lg bg-black/5 px-3 py-2 text-xs hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
          >
            {preview ? <Pencil size={12} /> : <Eye size={12} />}
            {preview ? "編集" : "プレビュー"}
          </button>
        )}
        <span className="text-xs text-neutral-400">
          {filePath ?? "無題"}
          {dirty && " *"}
          {status && ` — ${status}`}
        </span>
      </div>

      {preview ? (
        <div className="markdown-body glass-panel flex-1 overflow-y-auto rounded-xl2 p-6 text-sm" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
      ) : (
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setDirty(true);
          }}
          placeholder="テキストを入力..."
          className="app-no-drag flex-1 resize-none rounded-xl2 glass-panel p-4 font-mono text-sm outline-none"
          spellCheck={false}
        />
      )}
    </div>
  );
}

export const TextEditorPlugin: PluginModule = {
  manifest: {
    id: "text-editor",
    name: "テキストエディター",
    version: "0.1.0",
    description: "プレーンテキスト/Markdownファイルの編集",
    category: "document",
    entry: "text-editor",
  },
  icon: FileEdit,
  Component: TextEditorPage,
};
