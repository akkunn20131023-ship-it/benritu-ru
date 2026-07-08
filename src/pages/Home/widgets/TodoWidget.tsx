import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ListChecks } from "lucide-react";
import type { TodoItem } from "@shared/types";

/** ホーム画面向けの今日の ToDo サマリー */
export function TodoWidget() {
  const [todos, setTodos] = useState<TodoItem[]>([]);

  useEffect(() => {
    void window.api.todo.list().then(setTodos);
  }, []);

  const pending = todos.filter((t) => !t.done).slice(0, 5);

  return (
    <div className="glass-panel flex flex-col rounded-xl2 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <ListChecks size={16} className="text-accent" /> 今日の ToDo
        </h3>
        <Link to="/plugin/todo" className="text-xs text-accent hover:underline">
          すべて見る
        </Link>
      </div>
      {pending.length === 0 ? (
        <p className="text-sm text-neutral-500">未完了のタスクはありません 🎉</p>
      ) : (
        <ul className="space-y-1.5">
          {pending.map((t) => (
            <li key={t.id} className="flex items-center gap-2 text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {t.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
