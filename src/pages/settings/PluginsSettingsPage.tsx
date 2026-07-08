import { Star } from "lucide-react";
import { usePlugins } from "@/plugins/usePlugins";
import { useFavoritesStore } from "@/stores/useFavoritesStore";

/** プラグインシステム最重要機能: 各プラグインの有効/無効切り替えとお気に入り登録 */
export default function PluginsSettingsPage() {
  const { plugins, setEnabled } = usePlugins();
  const { favoriteIds, toggleFavorite } = useFavoritesStore();

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-4">
      <div>
        <h1 className="text-xl font-semibold">プラグイン管理</h1>
        <p className="text-sm text-neutral-500">機能はすべてプラグインとして追加・削除できます。不要な機能はここで無効化してください。</p>
      </div>

      <div className="glass-panel divide-y divide-black/5 rounded-xl2 dark:divide-white/10">
        {plugins.map((p) => (
          <div key={p.manifest.id} className="flex items-center gap-4 p-4">
            <p.icon size={20} className="text-accent shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{p.manifest.name}</p>
              <p className="truncate text-xs text-neutral-500">{p.manifest.description}</p>
            </div>
            <button
              onClick={() => toggleFavorite(p.manifest.id)}
              className="app-no-drag shrink-0 text-neutral-400 hover:text-amber-400"
              title="お気に入り登録"
            >
              <Star size={16} fill={favoriteIds.includes(p.manifest.id) ? "currentColor" : "none"} className={favoriteIds.includes(p.manifest.id) ? "text-amber-400" : ""} />
            </button>
            <label className="app-no-drag relative inline-flex shrink-0 cursor-pointer items-center">
              <input
                type="checkbox"
                checked={p.enabled}
                onChange={(e) => setEnabled(p.manifest.id, e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-5 w-9 rounded-full bg-black/15 transition-colors peer-checked:bg-accent dark:bg-white/15" />
              <div className="absolute left-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
