import { useEffect, useState } from "react";
import { ListChecks, Plus, Trash2, Wand2, Loader2 } from "lucide-react";
import type { TodoItem } from "@shared/types";
import type { PluginModule } from "../../types";
import { useAiComplete, parseJsonLoose } from "../../useAiComplete";
import { ASSISTANT_TONE } from "@/lib/assistantTone";

/** 巨大なタスクを「今すぐ手をつけられる小さなステップ」に分けてもらうための system プロンプト */
const BREAKDOWN_SYSTEM = `${ASSISTANT_TONE}

いま渡す作業を、今すぐ手をつけられる小さなステップに分けてください。
- ステップは3〜5個。
- それぞれ1行の、具体的で軽い行動にします。
- 最初のステップは特に軽く、30秒で始められるものにします。
出力は必ず次のJSONのみとし、説明やコードフェンスは含めないでください:
{"steps":["ステップ1","ステップ2","ステップ3"]}`;

function TodoPage() {
  const complete = useAiComplete();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [title, setTitle] = useState("");
  const [aiEnabled, setAiEnabled] = useState(false);
  const [breakingId, setBreakingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void window.api.todo.list().then(setTodos);
    void window.api.ai.getConfig().then((c) => setAiEnabled(c.provider !== "none"));
  }, []);

  async function addTodo() {
    if (!title.trim()) return;
    const created = await window.api.todo.upsert({ title: title.trim() });
    setTodos((prev) => [created, ...prev]);
    setTitle("");
  }

  async function toggleDone(todo: TodoItem) {
    const updated = await window.api.todo.upsert({ ...todo, done: !todo.done });
    setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  async function deleteTodo(id: string) {
    await window.api.todo.delete(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  /** 大きな1件を、やさしい小さなステップに分解して置き換える (元の大きなタスクは消す = 迷いを減らす) */
  async function breakdown(todo: TodoItem) {
    setBreakingId(todo.id);
    setError(null);
    try {
      const raw = await complete([
        { role: "system", content: BREAKDOWN_SYSTEM },
        { role: "user", content: todo.title },
      ]);
      const parsed = parseJsonLoose<{ steps: string[] }>(raw);
      const steps = (parsed.steps ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 5);
      if (steps.length === 0) throw new Error("うまく分けられませんでした。もう一度試してみてください。");
      const created: TodoItem[] = [];
      for (const step of steps) created.push(await window.api.todo.upsert({ title: step }));
      await window.api.todo.delete(todo.id);
      setTodos((prev) => [...created, ...prev.filter((t) => t.id !== todo.id)]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBreakingId(null);
    }
  }

  const pending = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-4">
      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="タスクを追加..."
          className="app-no-drag flex-1 rounded-lg glass-panel px-4 py-2.5 text-sm outline-none"
        />
        <button
          onClick={addTodo}
          className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          <Plus size={16} /> 追加
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex-1 space-y-4 overflow-y-auto">
        <section className="rounded-lg glass-panel p-2">
          {pending.length === 0 && <p className="p-3 text-sm text-neutral-500">未完了のタスクはありません</p>}
          {pending.map((t) => (
            <TodoRow
              key={t.id}
              todo={t}
              onToggle={toggleDone}
              onDelete={deleteTodo}
              onBreakdown={aiEnabled ? breakdown : undefined}
              breaking={breakingId === t.id}
            />
          ))}
        </section>

        {done.length > 0 && (
          <section className="rounded-lg glass-panel p-2 opacity-70">
            <p className="px-3 pt-1 text-xs font-medium text-neutral-500">完了済み</p>
            {done.map((t) => (
              <TodoRow key={t.id} todo={t} onToggle={toggleDone} onDelete={deleteTodo} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

function TodoRow({
  todo,
  onToggle,
  onDelete,
  onBreakdown,
  breaking,
}: {
  todo: TodoItem;
  onToggle: (t: TodoItem) => void;
  onDelete: (id: string) => void;
  onBreakdown?: (t: TodoItem) => void;
  breaking?: boolean;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-md px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10">
      <input type="checkbox" checked={todo.done} onChange={() => onToggle(todo)} className="app-no-drag h-4 w-4 accent-accent" />
      <span className={`flex-1 text-sm ${todo.done ? "line-through text-neutral-400" : ""}`}>{todo.title}</span>
      {onBreakdown &&
        (breaking ? (
          <Loader2 size={14} className="shrink-0 animate-spin text-accent" />
        ) : (
          <button
            title="小さなステップに分ける"
            onClick={() => onBreakdown(todo)}
            className="app-no-drag shrink-0 text-neutral-400 opacity-0 transition-opacity hover:text-accent group-hover:opacity-100"
          >
            <Wand2 size={14} />
          </button>
        ))}
      <Trash2
        size={14}
        className="app-no-drag shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100 cursor-pointer"
        onClick={() => onDelete(todo.id)}
      />
    </div>
  );
}

export const TodoPlugin: PluginModule = {
  manifest: {
    id: "todo",
    name: "ToDo",
    version: "0.1.0",
    description: "タスク管理・チェックリスト",
    category: "life",
    entry: "todo",
  },
  icon: ListChecks,
  Component: TodoPage,
};
