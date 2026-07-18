import { createHashRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGate } from "@/components/layout/AuthGate";
import LandingPage from "@/pages/Landing/LandingPage";
import TermsPage from "@/pages/legal/TermsPage";
import PrivacyPage from "@/pages/legal/PrivacyPage";
import HomePage from "@/pages/Home/HomePage";
import PluginPage from "@/pages/PluginPage";
import PluginsSettingsPage from "@/pages/settings/PluginsSettingsPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import AiSettingsPage from "@/pages/settings/AiSettingsPage";

// file:// で読み込まれる本番ビルドでも動作するよう HashRouter を使用。
//   "/"        … 一般公開のランディングページ (ログイン/AuthGate 不要・即表示)
//   "/terms"   … 利用規約 / "/privacy" … プライバシーポリシー
//   パスなしレイアウトルート … アプリ本体 (AuthGate + サイドバー等)。ダッシュボードは "/app"。
//   plugin/:id・settings 系は従来どおり "/plugin/..." "/settings" のまま (招待URL・既存導線を壊さない)。
export const router = createHashRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/terms", element: <TermsPage /> },
  { path: "/privacy", element: <PrivacyPage /> },
  {
    element: (
      <AuthGate>
        <AppLayout />
      </AuthGate>
    ),
    children: [
      { path: "app", element: <HomePage /> },
      { path: "plugin/:id", element: <PluginPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "settings/plugins", element: <PluginsSettingsPage /> },
      { path: "settings/ai", element: <AiSettingsPage /> },
    ],
  },
]);
