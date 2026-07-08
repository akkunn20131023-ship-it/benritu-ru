import { useEffect, useState } from "react";
import type { PluginManifest } from "@shared/types";
import { BUILTIN_PLUGIN_MODULES } from "./registry";
import type { RegisteredPlugin } from "./types";

/**
 * main プロセスが管理する PluginManifest(有効/無効の永続状態)と、renderer 側の
 * 実装レジストリ(BUILTIN_PLUGIN_MODULES)を突き合わせて実行可能なプラグイン一覧を返す。
 */
export function usePlugins() {
  const [plugins, setPlugins] = useState<RegisteredPlugin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    const manifests = (await window.api.plugins.list()) as PluginManifest[];
    const merged = manifests
      .map((m) => {
        const mod = BUILTIN_PLUGIN_MODULES[m.id];
        if (!mod) return null;
        return { ...mod, enabled: m.enabled } satisfies RegisteredPlugin;
      })
      .filter((p): p is RegisteredPlugin => p !== null);
    setPlugins(merged);
    setLoading(false);
  }

  async function setEnabled(id: string, enabled: boolean) {
    await window.api.plugins.setEnabled(id, enabled);
    setPlugins((prev) => prev.map((p) => (p.manifest.id === id ? { ...p, enabled } : p)));
  }

  return { plugins, loading, setEnabled, refresh };
}
