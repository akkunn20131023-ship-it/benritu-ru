import { createHashRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGate } from "@/components/layout/AuthGate";
import HomePage from "@/pages/Home/HomePage";
import PluginPage from "@/pages/PluginPage";
import PluginsSettingsPage from "@/pages/settings/PluginsSettingsPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import AiSettingsPage from "@/pages/settings/AiSettingsPage";

// file:// で読み込まれる本番ビルドでも動作するよう HashRouter を使用
export const router = createHashRouter([
  {
    path: "/",
    element: (
      <AuthGate>
        <AppLayout />
      </AuthGate>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: "plugin/:id", element: <PluginPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "settings/plugins", element: <PluginsSettingsPage /> },
      { path: "settings/ai", element: <AiSettingsPage /> },
    ],
  },
]);
