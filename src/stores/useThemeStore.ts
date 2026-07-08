import { create } from "zustand";
import type { ThemeMode } from "@shared/types";

interface ThemeState {
  mode: ThemeMode;
  resolved: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
}

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function applyToDom(resolved: "light" | "dark") {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

/** テーマ(ライト/ダーク/システム連動)の状態管理。DOM の `dark` クラス切り替えも担う */
export const useThemeStore = create<ThemeState>((set) => ({
  mode: "system",
  resolved: resolveTheme("system"),
  setMode: (mode) => {
    const resolved = resolveTheme(mode);
    applyToDom(resolved);
    set({ mode, resolved });
    void window.api?.settings.set("theme", mode);
  },
}));

applyToDom(useThemeStore.getState().resolved);

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  const { mode } = useThemeStore.getState();
  if (mode === "system") {
    const resolved = resolveTheme("system");
    applyToDom(resolved);
    useThemeStore.setState({ resolved });
  }
});

export async function hydrateThemeFromSettings(): Promise<void> {
  const settings = await window.api?.settings.get();
  if (settings) useThemeStore.getState().setMode(settings.theme);
}
