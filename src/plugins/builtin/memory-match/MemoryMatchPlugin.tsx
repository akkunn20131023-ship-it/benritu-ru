import { useEffect, useState } from "react";
import { Gamepad2, RotateCcw } from "lucide-react";
import type { PluginModule } from "../../types";

const EMOJIS = ["🍎", "🍋", "🍇", "🍓", "🍉", "🍑", "🍒", "🥝"];

interface Card {
  id: number;
  emoji: string;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function newDeck(): Card[] {
  return shuffle([...EMOJIS, ...EMOJIS]).map((emoji, id) => ({ id, emoji, matched: false }));
}

function MemoryMatchPage() {
  const [cards, setCards] = useState<Card[]>(newDeck);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [busy, setBusy] = useState(false);

  const won = cards.every((c) => c.matched);

  useEffect(() => {
    if (flipped.length !== 2) return;
    setBusy(true);
    setMoves((m) => m + 1);
    const [a, b] = flipped;
    const timer = setTimeout(() => {
      setCards((prev) => {
        if (prev[a].emoji === prev[b].emoji) {
          return prev.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c));
        }
        return prev;
      });
      setFlipped([]);
      setBusy(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [flipped]);

  function flip(i: number) {
    if (busy || flipped.includes(i) || cards[i].matched || flipped.length === 2) return;
    setFlipped((prev) => [...prev, i]);
  }

  function restart() {
    setCards(newDeck());
    setFlipped([]);
    setMoves(0);
    setBusy(false);
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">手数: {moves}</p>
        <button
          onClick={restart}
          className="app-no-drag flex items-center gap-1.5 rounded-lg bg-black/5 px-3 py-1.5 text-sm hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
        >
          <RotateCcw size={14} /> やり直す
        </button>
      </div>

      {won && (
        <div className="glass-panel rounded-xl2 p-4 text-center text-sm font-medium text-accent">
          クリア! {moves} 手でそろいました 🎉
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {cards.map((card, i) => {
          const isOpen = card.matched || flipped.includes(i);
          return (
            <button
              key={card.id}
              onClick={() => flip(i)}
              className={`app-no-drag flex aspect-square items-center justify-center rounded-lg text-2xl transition-colors ${
                isOpen ? "bg-accent/20" : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
              }`}
            >
              {isOpen ? card.emoji : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const MemoryMatchPlugin: PluginModule = {
  manifest: {
    id: "memory-match",
    name: "神経衰弱",
    version: "0.1.0",
    description: "絵柄をそろえる暇つぶしカードゲーム",
    category: "game",
    entry: "memory-match",
  },
  icon: Gamepad2,
  Component: MemoryMatchPage,
};
