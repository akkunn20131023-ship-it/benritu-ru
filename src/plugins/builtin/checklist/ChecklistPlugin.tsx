import { useState } from "react";
import { randomId } from "@/lib/randomId";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { usePluginStore } from "../../usePluginStore";
import type { PluginModule } from "../../types";

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface ChecklistList {
  id: string;
  title: string;
  items: ChecklistItem[];
}

const PLUGIN_ID = "checklist";

function ChecklistPage() {
  const [lists, setLists, loaded] = usePluginStore<ChecklistList[]>(PLUGIN_ID, "lists", []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState("");

  const active = lists.find((l) => l.id === activeId) ?? lists[0] ?? null;

  function createList() {
    const list: ChecklistList = { id: randomId(), title: "新しいチェックリスト", items: [] };
    setLists([list, ...lists]);
    setActiveId(list.id);
  }

  function deleteList(id: string) {
    setLists(lists.filter((l) => l.id !== id));
    if (activeId === id) setActiveId(null);
  }

  function renameList(id: string, title: string) {
    setLists(lists.map((l) => (l.id === id ? { ...l, title } : l)));
  }

  function addItem() {
    if (!active || !newItemText.trim()) return;
    const item: ChecklistItem = { id: randomId(), text: newItemText.trim(), done: false };
    setLists(lists.map((l) => (l.id === active.id ? { ...l, items: [...l.items, item] } : l)));
    setNewItemText("");
  }

  function toggleItem(itemId: string) {
    if (!active) return;
    setLists(
      lists.map((l) =>
        l.id === active.id ? { ...l, items: l.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) } : l
      )
    );
  }

  function deleteItem(itemId: string) {
    if (!active) return;
    setLists(lists.map((l) => (l.id === active.id ? { ...l, items: l.items.filter((i) => i.id !== itemId) } : l)));
  }

  if (!loaded) return null;

  const doneCount = active?.items.filter((i) => i.done).length ?? 0;

  return (
    <div className="flex h-full gap-4">
      <div className="w-64 shrink-0 flex flex-col gap-2">
        <button
          onClick={createList}
          className="app-no-drag flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          <Plus size={16} /> 新規チェックリスト
        </button>
        <div className="flex-1 overflow-y-auto rounded-lg glass-panel p-1.5 flex flex-col gap-1">
          {lists.length === 0 && <p className="p-3 text-sm text-neutral-500">チェックリストはまだありません</p>}
          {lists.map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveId(l.id)}
              className={`group flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                l.id === active?.id ? "bg-accent/15 text-accent" : "hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              <span className="truncate">{l.title || "無題"}</span>
              <Trash2
                size={14}
                className="shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteList(l.id);
                }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3 rounded-lg glass-panel p-4">
        {active ? (
          <>
            <div className="flex items-center justify-between">
              <input
                value={active.title}
                onChange={(e) => renameList(active.id, e.target.value)}
                className="app-no-drag flex-1 bg-transparent text-lg font-semibold outline-none"
              />
              <span className="text-xs text-neutral-500">
                {doneCount}/{active.items.length} 完了
              </span>
            </div>

            <div className="flex gap-2">
              <input
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                placeholder="項目を追加..."
                className="app-no-drag flex-1 rounded-lg bg-black/5 px-3.5 py-2 text-sm outline-none dark:bg-white/10"
              />
              <button
                onClick={addItem}
                className="app-no-drag rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover"
              >
                追加
              </button>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto">
              {active.items.map((item) => (
                <div key={item.id} className="group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/10">
                  <input type="checkbox" checked={item.done} onChange={() => toggleItem(item.id)} className="app-no-drag h-4 w-4 accent-accent" />
                  <span className={`flex-1 text-sm ${item.done ? "line-through text-neutral-400" : ""}`}>{item.text}</span>
                  <Trash2
                    size={14}
                    className="app-no-drag shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100 cursor-pointer"
                    onClick={() => deleteItem(item.id)}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
            左のリストから選択、または新規作成してください
          </div>
        )}
      </div>
    </div>
  );
}

export const ChecklistPlugin: PluginModule = {
  manifest: {
    id: "checklist",
    name: "チェックリスト",
    version: "0.1.0",
    description: "複数のチェックリストを管理",
    category: "life",
    entry: "checklist",
  },
  icon: ClipboardList,
  Component: ChecklistPage,
};
