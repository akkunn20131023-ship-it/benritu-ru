import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { hydrateThemeFromSettings } from "./stores/useThemeStore";
import { createWebApi } from "./lib/webApi";
import "./index.css";

// Electron の preload が注入されていない = ブラウザ実行 (Web版) の場合、
// 同じ OmniSuiteApi インターフェースを HTTP 実装で差し込む。これにより
// プラグイン側のコードは window.api の実装を意識せず動作する。
if (!window.api) {
  window.api = createWebApi();
}

// Web版で未ログインの場合 settings.get() は401になるため、ここでは静かに無視する
// (ログイン後は AuthGate 経由で通常のフローに乗り、以降のテーマ変更は setMode 経由で保存される)
void hydrateThemeFromSettings().catch(() => {});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
