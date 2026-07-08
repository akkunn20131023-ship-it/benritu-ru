import { create } from "zustand";
import type { ThemeMode } from "@shared/types";
import { ACCENT_PRESETS, hexToRgbChannels } from "@/lib/color";

interface ThemeState {
  mode: ThemeMode;
  resolved: "light" | "dark";
  accentColor: string;
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: string) => void;
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

function applyAccentToDom(color: string) {
  const preset = ACCENT_PRESETS.find((p) => p.color === color);
  document.documentElement.style.setProperty("--accent", hexToRgbChannels(color));
  document.documentElement.style.setProperty("--accent-hover", hexToRgbChannels(preset?.hover ?? color));
}

/** テーマ(ライト/ダーク/システム連動)とアクセントカラーの状態管理。DOM への反映も担う */
export const useThemeStore = create<ThemeState>((set) => ({
  mode: "system",
  resolved: resolveTheme("system"),
  accentColor: "#3b82f6",
  setMode: (mode) => {
    const resolved = resolveTheme(mode);
    applyToDom(resolved);
    set({ mode, resolved });
    void window.api?.settings.set("theme", mode);
  },
  setAccentColor: (color) => {
    applyAccentToDom(color);
    set({ accentColor: color });
    void window.api?.settings.set("accentColor", color);
  },
}));

applyToDom(useThemeStore.getState().resolved);
applyAccentToDom(useThemeStore.getState().accentColor);

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
  if (!settings) return;
  useThemeStore.getState().setMode(settings.theme);
  if (settings.accentColor) useThemeStore.getState().setAccentColor(settings.accentColor);
}
