import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, HelpCircle } from "lucide-react";
import type { TodoItem } from "@shared/types";
import { pickGentleNudge } from "@/lib/assistantTone";

/**
 * 「次の1つ」ヒーロー。
 *
 * このアプリで最も大事な問いは「次に何をするか」だけ。未完了タスクの中から今いちばん向き合うと良い
 * 1件だけを大きく表示し、余計な情報は出さない。迷ったときだけ、候補を最大3つに絞って提示する
 * (それ以上は出さない = 迷いを増やさないため)。
 */

/** 締切が近いもの→古くから残っているものの順で「次の1つ」を決める */
function sortByPriority(todos: TodoItem[]): TodoItem[] {
  return [...todos].sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return a.createdAt - b.createdAt;
  });
}

export function NextThingWidget() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [showChoices, setShowChoices] = useState(false);
  const nudge = useMemo(() => pickGentleNudge(), []);

  useEffect(() => {
    void window.api.todo
      .list()
      .then(setTodos)
      .catch(() => setTodos([]))
      .finally(() => setLoading(false));
  }, []);

  const pending = useMemo(() => sortByPriority(todos.filter((t) => !t.done)), [todos]);
  // 「あとで」で送ったものを除いた先頭が現在の1つ。全部送ったら最初に戻す。
  const queue = pending.filter((t) => !skipped.has(t.id));
  const current = queue[0] ?? pending[0] ?? null;
  const choices = pending.filter((t) => t.id !== current?.id).slice(0, 3);

  async function complete(todo: TodoItem) {
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: true } : t)));
    setShowChoices(false);
    try {
      await window.api.todo.upsert({ ...todo, done: true });
    } catch {
      // 失敗時は次回のリスト取得で整合するため、ここでは静かに無視する
    }
  }

  function later(todo: TodoItem) {
    setSkipped((prev) => new Set(prev).add(todo.id));
    setShowChoices(false);
  }

  function focusOn(todo: TodoItem) {
    // 選んだものを先頭に戻す (他を「あとで」扱いにする)
    setSkipped(new Set(pending.filter((t) => t.id !== todo.id).map((t) => t.id)));
    setShowChoices(false);
  }

  return (
    <div className="glass-panel relative overflow-hidden rounded-xl2 p-6 md:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl"
      />

      {loading ? (
        <div className="h-24 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
      ) : !current ? (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-accent">今日はここまででも進歩です</p>
          <p className="text-lg font-semibold">やることは空にできています 🌱</p>
          <p className="text-sm text-neutral-500">
            ゆっくり休んで大丈夫。何か思いついたら
            <Link to="/plugin/todo" className="mx-1 text-accent hover:underline">
              ToDo
            </Link>
            に置いておきましょう。
          </p>
        </div>
      ) : (
        <div className="relative flex flex-col gap-5">
          <p className="text-sm font-medium text-accent">次はこれだけ</p>

          <AnimatePresence mode="wait">
            <motion.h2
              key={current.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="text-2xl font-bold leading-snug md:text-3xl"
            >
              {current.title}
            </motion.h2>
          </AnimatePresence>

          <p className="text-sm text-neutral-500">{nudge}</p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => complete(current)}
              className="app-no-drag flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              <Check size={16} /> できた
            </button>
            <button
              onClick={() => later(current)}
              className="app-no-drag flex items-center gap-1.5 rounded-full bg-black/5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
            >
              あとで <ChevronRight size={15} />
            </button>
            {choices.length > 0 && (
              <button
                onClick={() => setShowChoices((v) => !v)}
                className="app-no-drag ml-auto flex items-center gap-1.5 rounded-full px-3 py-2 text-xs text-neutral-500 transition-colors hover:text-accent"
              >
                <HelpCircle size={14} /> 迷ったら候補を見る
              </button>
            )}
          </div>

          <AnimatePresence>
            {showChoices && choices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <p className="mb-2 text-xs text-neutral-500">この中から選んでも大丈夫です。</p>
                <div className="flex flex-col gap-1.5">
                  {choices.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => focusOn(t)}
                      className="app-no-drag flex items-center gap-2 rounded-lg bg-black/5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/15 hover:text-accent dark:bg-white/5"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span className="truncate">{t.title}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
