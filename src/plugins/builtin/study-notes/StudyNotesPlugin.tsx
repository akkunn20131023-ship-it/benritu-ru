import { useMemo, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { NotebookText, Plus, Trash2, Eye, Pencil } from "lucide-react";
import { randomId } from "@/lib/randomId";
import { usePluginStore } from "../../usePluginStore";
import type { PluginModule } from "../../types";

interface StudyNote {
  id: string;
  title: string;
  subject: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

const PLUGIN_ID = "study-notes";
const DEFAULT_SUBJECT = "未分類";

function StudyNotesPage() {
  const [notes, setNotes, loaded] = usePluginStore<StudyNote[]>(PLUGIN_ID, "notes", []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const active = notes.find((n) => n.id === activeId) ?? null;

  const bySubject = useMemo(() => {
    const map = new Map<string, StudyNote[]>();
    for (const n of notes) {
      const key = n.subject || DEFAULT_SUBJECT;
      const list = map.get(key) ?? [];
      list.push(n);
      map.set(key, list);
    }
    return map;
  }, [notes]);

  function createNote() {
    const note: StudyNote = {
      id: randomId(),
      title: "新しいノート",
      subject: DEFAULT_SUBJECT,
      content: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes([note, ...notes]);
    setActiveId(note.id);
    setPreview(false);
  }

  function updateNote(id: string, patch: Partial<StudyNote>) {
    setNotes(notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)));
  }

  function deleteNote(id: string) {
    setNotes(notes.filter((n) => n.id !== id));
    if (activeId === id) setActiveId(null);
  }

  if (!loaded) return null;

  const renderedHtml = active ? DOMPurify.sanitize(marked.parse(active.content, { async: false }) as string) : "";

  return (
    <div className="flex h-full gap-4">
      <div className="w-64 shrink-0 flex flex-col gap-2">
        <button
          onClick={createNote}
          className="app-no-drag flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <Plus size={16} /> 新規ノート
        </button>
        <div className="flex-1 overflow-y-auto rounded-lg glass-panel p-1.5">
          {notes.length === 0 && <p className="p-3 text-sm text-neutral-500">ノートはまだありません</p>}
          {[...bySubject.entries()].map(([subject, list]) => (
            <div key={subject} className="mb-2">
              <p className="px-2.5 pb-1 pt-1 text-xs font-medium uppercase tracking-wide text-neutral-400">{subject}</p>
              {list.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setActiveId(n.id);
                    setPreview(false);
                  }}
                  className={`group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    n.id === activeId ? "bg-accent/15 text-accent" : "hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                >
                  <span className="truncate">{n.title || "無題"}</span>
                  <Trash2
                    size={14}
                    className="shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(n.id);
                    }}
                  />
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2 rounded-lg glass-panel p-4">
        {active ? (
          <>
            <div className="flex items-center gap-2">
              <input
                value={active.title}
                onChange={(e) => updateNote(active.id, { title: e.target.value })}
                placeholder="タイトル"
                className="app-no-drag flex-1 bg-transparent text-lg font-semibold outline-none"
              />
              <input
                value={active.subject}
                onChange={(e) => updateNote(active.id, { subject: e.target.value })}
                placeholder="科目"
                className="app-no-drag w-32 rounded-lg bg-black/5 px-2.5 py-1.5 text-xs outline-none dark:bg-white/10"
              />
              <button
                onClick={() => setPreview((p) => !p)}
                className="app-no-drag flex items-center gap-1 rounded-lg bg-black/5 px-2.5 py-1.5 text-xs hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
              >
                {preview ? <Pencil size={12} /> : <Eye size={12} />}
                {preview ? "編集" : "プレビュー"}
              </button>
            </div>

            {preview ? (
              <div className="markdown-body flex-1 overflow-y-auto text-sm" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
            ) : (
              <textarea
                value={active.content}
                onChange={(e) => updateNote(active.id, { content: e.target.value })}
                placeholder="Markdown で書けます..."
                className="app-no-drag flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed font-mono"
              />
            )}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">左のリストからノートを選択、または新規作成してください</div>
        )}
      </div>
    </div>
  );
}

export const StudyNotesPlugin: PluginModule = {
  manifest: {
    id: "study-notes",
    name: "Markdownノート",
    version: "0.1.0",
    description: "科目別に整理できるMarkdown対応ノート",
    category: "study",
    entry: "study-notes",
  },
  icon: NotebookText,
  Component: StudyNotesPage,
};
