import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { usePlugins } from "@/plugins/usePlugins";

/** URL の :id に対応するプラグイン画面をレンダリングし、利用時間と最近使った項目を記録する */
export default function PluginPage() {
  const { id } = useParams<{ id: string }>();
  const { plugins, loading } = usePlugins();
  const startedAt = useRef(Date.now());

  const plugin = plugins.find((p) => p.manifest.id === id);

  useEffect(() => {
    if (!plugin) return;
    startedAt.current = Date.now();
    void window.api.recent.push({ label: plugin.manifest.name, featureId: plugin.manifest.id });

    return () => {
      const elapsed = Date.now() - startedAt.current;
      if (elapsed > 1000) void window.api.usage.track(plugin.manifest.id, elapsed);
    };
  }, [plugin?.manifest.id]);

  if (loading) return null;

  if (!plugin) {
    return <p className="text-sm text-neutral-500">プラグインが見つからないか無効化されています。</p>;
  }

  const Component = plugin.Component;
  return (
    <div className="h-full animate-fade-in">
      <Component />
    </div>
  );
}
