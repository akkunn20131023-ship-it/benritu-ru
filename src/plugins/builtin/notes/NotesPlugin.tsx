import { useEffect, useState } from "react";
import { NotebookPen, Plus, Trash2 } from "lucide-react";
import type { NoteItem } from "@shared/types";
import type { PluginModule } from "../../types";

function NotesPage() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", content: "" });

  const active = notes.find((n) => n.id === activeId) ?? null;

  useEffect(() => {
    void window.api.note.list().then((list) => {
      setNotes(list);
      if (list.length > 0) setActiveId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (active) setDraft({ title: active.title, content: active.content });
  }, [active?.id]);

  async function createNote() {
    const created = await window.api.note.upsert({ title: "新しいメモ", content: "" });
    setNotes((prev) => [created, ...prev]);
    setActiveId(created.id);
  }

  async function saveDraft() {
    if (!active) return;
    const updated = await window.api.note.upsert({ id: active.id, title: draft.title || "無題", content: draft.content, tags: active.tags });
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  }

  async function deleteNote(id: string) {
    await window.api.note.delete(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeId === id) setActiveId(null);
  }

  return (
    <div className="flex h-full gap-4">
      <div className="w-64 shrink-0 flex flex-col gap-2">
        <button
          onClick={createNote}
          className="app-no-drag flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          <Plus size={16} /> 新規メモ
        </button>
        <div className="flex-1 overflow-y-auto rounded-lg glass-panel p-1.5 flex flex-col gap-1">
          {notes.length === 0 && <p className="p-3 text-sm text-neutral-500">メモはまだありません</p>}
          {notes.map((n) => (
            <button
              key={n.id}
              onClick={() => setActiveId(n.id)}
              className={`group flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                n.id === activeId ? "bg-accent/15 text-accent" : "hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              <span className="truncate">{n.title || "無題"}</span>
              <Trash2
                size={14}
                className="shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  void deleteNote(n.id);
                }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2 rounded-lg glass-panel p-4">
        {active ? (
          <>
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              onBlur={saveDraft}
              placeholder="タイトル"
              className="app-no-drag bg-transparent text-lg font-semibold outline-none"
            />
            <textarea
              value={draft.content}
              onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
              onBlur={saveDraft}
              placeholder="Markdown で書けます..."
              className="app-no-drag flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed"
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">左のリストからメモを選択、または新規作成してください</div>
        )}
      </div>
    </div>
  );
}

export const NotesPlugin: PluginModule = {
  manifest: {
    id: "notes",
    name: "メモ",
    version: "0.1.0",
    description: "シンプルな Markdown 対応メモ",
    category: "life",
    entry: "notes",
  },
  icon: NotebookPen,
  Component: NotesPage,
};
