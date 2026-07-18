import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Settings, Search, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLayoutStore } from "@/stores/useLayoutStore";
import { usePlugins } from "@/plugins/usePlugins";

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  action: () => void;
}

/** Ctrl+K で開くコマンドパレット。全プラグイン・主要導線への高速アクセスを提供する */
export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useLayoutStore();
  const { plugins } = usePlugins();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === "Escape") setCommandPaletteOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
      setHighlight(0);
    }
  }, [commandPaletteOpen]);

  const commands: Command[] = useMemo(
    () => [
      { id: "home", label: "ホームへ移動", icon: Home, action: () => navigate("/app") },
      { id: "settings", label: "設定を開く", icon: Settings, action: () => navigate("/settings") },
      ...plugins
        .filter((p) => p.enabled)
        .map((p) => ({
          id: p.manifest.id,
          label: p.manifest.name,
          hint: p.manifest.description,
          icon: p.icon,
          action: () => navigate(`/plugin/${p.manifest.id}`),
        })),
    ],
    [plugins, navigate]
  );

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  function runHighlighted() {
    const cmd = filtered[highlight];
    if (cmd) {
      cmd.action();
      setCommandPaletteOpen(false);
    }
  }

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-32"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel w-[32rem] overflow-hidden rounded-xl2"
          >
            <div className="flex items-center gap-2 border-b border-black/5 px-4 py-3 dark:border-white/10">
              <Search size={16} className="text-neutral-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") setHighlight((h) => Math.min(h + 1, filtered.length - 1));
                  if (e.key === "ArrowUp") setHighlight((h) => Math.max(h - 1, 0));
                  if (e.key === "Enter") runHighlighted();
                }}
                placeholder="機能を検索..."
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {filtered.length === 0 && <p className="p-4 text-center text-sm text-neutral-500">該当する機能がありません</p>}
              {filtered.map((c, i) => (
                <button
                  key={c.id}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => {
                    c.action();
                    setCommandPaletteOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${
                    i === highlight ? "bg-accent/15 text-accent" : "hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                >
                  <c.icon size={16} />
                  <span className="flex-1">{c.label}</span>
                  {c.hint && <span className="truncate text-xs text-neutral-400">{c.hint}</span>}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
