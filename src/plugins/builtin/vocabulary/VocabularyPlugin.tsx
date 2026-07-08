import { useMemo, useState } from "react";
import { BookOpen, Plus, Trash2, Shuffle, Check, X } from "lucide-react";
import { randomId } from "@/lib/randomId";
import { usePluginStore } from "../../usePluginStore";
import type { PluginModule } from "../../types";

interface VocabWord {
  id: string;
  word: string;
  meaning: string;
  example?: string;
  memorized: boolean;
  createdAt: number;
}

const PLUGIN_ID = "vocabulary";

function VocabularyPage() {
  const [words, setWords, loaded] = usePluginStore<VocabWord[]>(PLUGIN_ID, "words", []);
  const [mode, setMode] = useState<"list" | "practice">("list");
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState("");
  const [filter, setFilter] = useState<"all" | "unmemorized" | "memorized">("all");

  function addWord() {
    if (!word.trim() || !meaning.trim()) return;
    setWords([
      { id: randomId(), word: word.trim(), meaning: meaning.trim(), example: example.trim() || undefined, memorized: false, createdAt: Date.now() },
      ...words,
    ]);
    setWord("");
    setMeaning("");
    setExample("");
  }

  function toggleMemorized(id: string) {
    setWords(words.map((w) => (w.id === id ? { ...w, memorized: !w.memorized } : w)));
  }

  function deleteWord(id: string) {
    setWords(words.filter((w) => w.id !== id));
  }

  const filtered = words.filter((w) => (filter === "all" ? true : filter === "memorized" ? w.memorized : !w.memorized));

  if (!loaded) return null;

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <button
            onClick={() => setMode("list")}
            className={`app-no-drag rounded-lg px-3.5 py-1.5 text-sm ${mode === "list" ? "bg-accent text-white" : "bg-black/5 hover:bg-black/10 dark:bg-white/10"}`}
          >
            単語一覧
          </button>
          <button
            onClick={() => setMode("practice")}
            disabled={words.length === 0}
            className={`app-no-drag rounded-lg px-3.5 py-1.5 text-sm disabled:opacity-40 ${mode === "practice" ? "bg-accent text-white" : "bg-black/5 hover:bg-black/10 dark:bg-white/10"}`}
          >
            学習モード
          </button>
        </div>
        <span className="text-xs text-neutral-500">
          {words.filter((w) => w.memorized).length}/{words.length} 暗記済み
        </span>
      </div>

      {mode === "list" ? (
        <>
          <div className="glass-panel grid grid-cols-1 gap-2 rounded-lg p-3 sm:grid-cols-3">
            <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="単語" className="app-no-drag rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10" />
            <input value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="意味" className="app-no-drag rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10" />
            <div className="flex gap-2">
              <input
                value={example}
                onChange={(e) => setExample(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addWord()}
                placeholder="例文 (任意)"
                className="app-no-drag flex-1 rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10"
              />
              <button onClick={addWord} className="app-no-drag rounded-lg bg-accent px-3 py-2 text-white hover:bg-accent-hover">
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="flex gap-1.5">
            {(["all", "unmemorized", "memorized"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`app-no-drag rounded-full px-3 py-1 text-xs ${filter === f ? "bg-accent text-white" : "bg-black/5 hover:bg-black/10 dark:bg-white/10"}`}
              >
                {f === "all" ? "すべて" : f === "memorized" ? "暗記済み" : "未暗記"}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto">
            {filtered.length === 0 && <p className="p-4 text-center text-sm text-neutral-500">単語がありません</p>}
            {filtered.map((w) => (
              <div key={w.id} className="glass-panel group flex items-center gap-3 rounded-lg p-3">
                <input type="checkbox" checked={w.memorized} onChange={() => toggleMemorized(w.id)} className="app-no-drag h-4 w-4 accent-accent" />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${w.memorized ? "text-neutral-400 line-through" : ""}`}>
                    {w.word} <span className="font-normal text-neutral-500">— {w.meaning}</span>
                  </p>
                  {w.example && <p className="truncate text-xs text-neutral-400">{w.example}</p>}
                </div>
                <Trash2
                  size={14}
                  className="app-no-drag shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100 cursor-pointer"
                  onClick={() => deleteWord(w.id)}
                />
              </div>
            ))}
          </div>
        </>
      ) : (
        <PracticeMode words={words} onResult={toggleMemorized} />
      )}
    </div>
  );
}

function PracticeMode({ words, onResult }: { words: VocabWord[]; onResult: (id: string) => void }) {
  const shuffled = useMemo(() => [...words].sort(() => Math.random() - 0.5), [words]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (index >= shuffled.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-sm text-neutral-500">すべての単語を確認しました</p>
        <button
          onClick={() => {
            setIndex(0);
            setRevealed(false);
          }}
          className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <Shuffle size={14} /> もう一度
        </button>
      </div>
    );
  }

  const current = shuffled[index];

  function next(memorized: boolean) {
    if (memorized !== current.memorized) onResult(current.id);
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <p className="text-xs text-neutral-500">
        {index + 1} / {shuffled.length}
      </p>
      <button
        onClick={() => setRevealed((r) => !r)}
        className="app-no-drag glass-panel flex h-52 w-full max-w-sm flex-col items-center justify-center gap-2 rounded-xl2 p-8 text-center"
      >
        <p className="text-2xl font-semibold">{current.word}</p>
        {revealed && (
          <>
            <p className="text-sm text-neutral-500">{current.meaning}</p>
            {current.example && <p className="mt-2 text-xs text-neutral-400">{current.example}</p>}
          </>
        )}
        {!revealed && <p className="text-xs text-neutral-400">クリックして意味を表示</p>}
      </button>
      <div className="flex gap-3">
        <button
          onClick={() => next(false)}
          className="app-no-drag flex items-center gap-1.5 rounded-lg bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/20"
        >
          <X size={16} /> まだ
        </button>
        <button
          onClick={() => next(true)}
          className="app-no-drag flex items-center gap-1.5 rounded-lg bg-green-500/10 px-5 py-2.5 text-sm font-medium text-green-600 hover:bg-green-500/20"
        >
          <Check size={16} /> 覚えた
        </button>
      </div>
    </div>
  );
}

export const VocabularyPlugin: PluginModule = {
  manifest: {
    id: "vocabulary",
    name: "英単語帳",
    version: "0.1.0",
    description: "単語・意味・例文を登録して暗記練習",
    category: "study",
    entry: "vocabulary",
  },
  icon: BookOpen,
  Component: VocabularyPage,
};
