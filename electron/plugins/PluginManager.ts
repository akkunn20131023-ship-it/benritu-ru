import { queryOne, run } from "../db/database";
import { BUILTIN_MANIFESTS } from "./builtin-manifests";
import type { PluginManifest } from "../../shared/types";

/**
 * プラグインの有効/無効状態を DB に永続化しつつ、マニフェスト一覧を提供する。
 * 将来的に外部プラグイン(ユーザーがフォルダを追加)にも対応できるよう、
 * マニフェスト取得元(ビルトイン / 外部)を関数として分離してある。
 */
class PluginManager {
  private manifests: PluginManifest[] = [];

  /** database.ts の getDatabase() で DB 初期化が完了した後に呼び出すこと */
  init(): void {
    this.manifests = BUILTIN_MANIFESTS.map((m) => {
      const existing = queryOne<{ enabled: number }>("SELECT enabled FROM plugins WHERE id = @id", { "@id": m.id });
      if (!existing) {
        run("INSERT INTO plugins (id, enabled) VALUES (@id, @enabled)", { "@id": m.id, "@enabled": m.enabled ? 1 : 0 });
      }
      return { ...m, enabled: existing ? !!existing.enabled : m.enabled };
    });
  }

  list(): PluginManifest[] {
    return this.manifests;
  }

  setEnabled(id: string, enabled: boolean): PluginManifest[] {
    run("UPDATE plugins SET enabled = @enabled WHERE id = @id", { "@enabled": enabled ? 1 : 0, "@id": id });
    this.manifests = this.manifests.map((m) => (m.id === id ? { ...m, enabled } : m));
    return this.manifests;
  }
}

export const pluginManager = new PluginManager();
