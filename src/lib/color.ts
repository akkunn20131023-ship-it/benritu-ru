/** "#rrggbb" -> "r g b" (Tailwind の `rgb(var(--x) / <alpha-value>)` パターン向け) */
export function hexToRgbChannels(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export interface AccentPreset {
  id: string;
  label: string;
  color: string;
  hover: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: "blue", label: "ブルー", color: "#3b82f6", hover: "#2563eb" },
  { id: "green", label: "グリーン", color: "#22c55e", hover: "#16a34a" },
  { id: "purple", label: "パープル", color: "#a855f7", hover: "#9333ea" },
  { id: "orange", label: "オレンジ", color: "#f97316", hover: "#ea580c" },
  { id: "pink", label: "ピンク", color: "#ec4899", hover: "#db2777" },
  { id: "red", label: "レッド", color: "#ef4444", hover: "#dc2626" },
];
