import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { hydrateThemeFromSettings } from "./stores/useThemeStore";
import { createWebApi } from "./lib/webApi";
import { createLocalApi } from "./lib/localApi";
import { applyCanonicalUrls } from "./lib/seo";
import "./index.css";

// Electron の preload が注入されていない = ブラウザ実行 (Web版) の場合、同じ OmniSuiteApi
// インターフェースの実装を差し込む。これによりプラグイン側のコードは実装を意識せず動作する。
//   - 既定 (VITE_DATA_MODE !== "remote"): ブラウザ内保存 (localStorage)。サーバー/ログイン不要で即利用できる。
//   - VITE_DATA_MODE === "remote": 既存の HTTP バックエンド (Postgres 同期) を使う。
if (!window.api) {
  window.api = import.meta.env.VITE_DATA_MODE === "remote" ? createWebApi() : createLocalApi();
}

// 公開ドメインに追従して canonical / OG の URL を実行時に確定する (独自ドメイン移行時も再ビルド不要)。
applyCanonicalUrls();

// テーマの初期反映。ローカル保存版では常に成功し、remote 版で未ログイン時は静かに無視する。
void hydrateThemeFromSettings().catch(() => {});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// PWA: オフライン利用とホーム画面への追加のため Service Worker を登録する。
// http(s) 配信時 (=公開Web) のみ。Electron の file:// やビルド外では登録しない。
if ("serviceWorker" in navigator && import.meta.env.PROD && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // 登録失敗はオフライン機能が使えないだけでアプリ本体は動作するため握りつぶす
    });
  });
}
