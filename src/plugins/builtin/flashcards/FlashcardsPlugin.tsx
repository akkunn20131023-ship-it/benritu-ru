import { useMemo, useState } from "react";
import { Layers, Plus, Trash2, Play, Check, X, ArrowLeft } from "lucide-react";
import { randomId } from "@/lib/randomId";
import { usePluginStore } from "../../usePluginStore";
import type { PluginModule } from "../../types";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface Deck {
  id: string;
  name: string;
  cards: Flashcard[];
}

const PLUGIN_ID = "flashcards";

function FlashcardsPage() {
  const [decks, setDecks, loaded] = usePluginStore<Deck[]>(PLUGIN_ID, "decks", []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [studying, setStudying] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  const active = decks.find((d) => d.id === activeId) ?? null;

  function createDeck() {
    const deck: Deck = { id: randomId(), name: "新しいデッキ", cards: [] };
    setDecks([deck, ...decks]);
    setActiveId(deck.id);
  }

  function deleteDeck(id: string) {
    setDecks(decks.filter((d) => d.id !== id));
    if (activeId === id) setActiveId(null);
  }

  function renameDeck(id: string, name: string) {
    setDecks(decks.map((d) => (d.id === id ? { ...d, name } : d)));
  }

  function addCard() {
    if (!active || !front.trim() || !back.trim()) return;
    const card: Flashcard = { id: randomId(), front: front.trim(), back: back.trim() };
    setDecks(decks.map((d) => (d.id === active.id ? { ...d, cards: [...d.cards, card] } : d)));
    setFront("");
    setBack("");
  }

  function deleteCard(cardId: string) {
    if (!active) return;
    setDecks(decks.map((d) => (d.id === active.id ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) } : d)));
  }

  if (!loaded) return null;

  if (active && studying) {
    return <StudyMode deck={active} onExit={() => setStudying(false)} />;
  }

  return (
    <div className="flex h-full gap-4">
      <div className="w-64 shrink-0 flex flex-col gap-2">
        <button
          onClick={createDeck}
          className="app-no-drag flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <Plus size={16} /> 新規デッキ
        </button>
        <div className="flex-1 overflow-y-auto rounded-lg glass-panel p-1.5 flex flex-col gap-1">
          {decks.length === 0 && <p className="p-3 text-sm text-neutral-500">デッキはまだありません</p>}
          {decks.map((d) => (
            <button
              key={d.id}
              onClick={() => setActiveId(d.id)}
              className={`group flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                d.id === active?.id ? "bg-accent/15 text-accent" : "hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              <span className="truncate">
                {d.name || "無題"} <span className="text-xs text-neutral-400">({d.cards.length})</span>
              </span>
              <Trash2
                size={14}
                className="shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteDeck(d.id);
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
                value={active.name}
                onChange={(e) => renameDeck(active.id, e.target.value)}
                className="app-no-drag flex-1 bg-transparent text-lg font-semibold outline-none"
              />
              <button
                onClick={() => setStudying(true)}
                disabled={active.cards.length === 0}
                className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40"
              >
                <Play size={14} /> 学習開始
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="表 (問題)"
                className="app-no-drag rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10"
              />
              <div className="flex gap-2">
                <input
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCard()}
                  placeholder="裏 (答え)"
                  className="app-no-drag flex-1 rounded-lg bg-black/5 px-3 py-2 text-sm outline-none dark:bg-white/10"
                />
                <button onClick={addCard} className="app-no-drag rounded-lg bg-accent px-3 py-2 text-white hover:bg-accent-hover">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto">
              {active.cards.map((c) => (
                <div key={c.id} className="group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/10">
                  <span className="flex-1 truncate text-sm">
                    {c.front} <span className="text-neutral-400">→</span> {c.back}
                  </span>
                  <Trash2
                    size={14}
                    className="app-no-drag shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100 cursor-pointer"
                    onClick={() => deleteCard(c.id)}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
            左のデッキから選択、または新規作成してください
          </div>
        )}
      </div>
    </div>
  );
}

function StudyMode({ deck, onExit }: { deck: Deck; onExit: () => void }) {
  const order = useMemo(() => [...deck.cards].sort(() => Math.random() - 0.5), [deck]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);

  if (index >= order.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold">
          結果: {correct} / {order.length} 正解
        </p>
        <button onClick={onExit} className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
          <ArrowLeft size={14} /> デッキに戻る
        </button>
      </div>
    );
  }

  const card = order[index];

  function answer(isCorrect: boolean) {
    if (isCorrect) setCorrect((c) => c + 1);
    setFlipped(false);
    setIndex((i) => i + 1);
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <button onClick={onExit} className="app-no-drag absolute left-6 top-20 flex items-center gap-1 text-sm text-neutral-500 hover:text-accent">
        <ArrowLeft size={14} /> 戻る
      </button>
      <p className="text-xs text-neutral-500">
        {index + 1} / {order.length}
      </p>
      <button
        onClick={() => setFlipped((f) => !f)}
        className="app-no-drag glass-panel flex h-52 w-full max-w-sm flex-col items-center justify-center gap-2 rounded-xl2 p-8 text-center"
      >
        <p className="text-xl font-semibold">{flipped ? card.back : card.front}</p>
        {!flipped && <p className="text-xs text-neutral-400">クリックして答えを表示</p>}
      </button>
      {flipped && (
        <div className="flex gap-3">
          <button
            onClick={() => answer(false)}
            className="app-no-drag flex items-center gap-1.5 rounded-lg bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/20"
          >
            <X size={16} /> 不正解
          </button>
          <button
            onClick={() => answer(true)}
            className="app-no-drag flex items-center gap-1.5 rounded-lg bg-green-500/10 px-5 py-2.5 text-sm font-medium text-green-600 hover:bg-green-500/20"
          >
            <Check size={16} /> 正解
          </button>
        </div>
      )}
    </div>
  );
}

export const FlashcardsPlugin: PluginModule = {
  manifest: {
    id: "flashcards",
    name: "暗記カード",
    version: "0.1.0",
    description: "表裏のあるカードで反復学習",
    category: "study",
    entry: "flashcards",
  },
  icon: Layers,
  Component: FlashcardsPage,
};
