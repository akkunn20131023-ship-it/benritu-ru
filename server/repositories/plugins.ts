import { getPool } from "../db.js";
import { BUILTIN_MANIFESTS } from "../../electron/plugins/builtin-manifests.js";
import type { PluginManifest } from "../../shared/types";

/**
 * プラグインの有効/無効状態。マニフェスト一覧自体はデスクトップ版と共通の
 * electron/plugins/builtin-manifests.ts (純粋なデータ、Electron非依存) を再利用する。
 */
export const pluginRepo = {
  async list(userId: string): Promise<PluginManifest[]> {
    const pool = getPool();
    const result = await pool.query<{ plugin_id: string; enabled: boolean }>(
      "SELECT plugin_id, enabled FROM plugins WHERE user_id = $1",
      [userId]
    );
    const overrides = new Map(result.rows.map((r) => [r.plugin_id, r.enabled]));
    return BUILTIN_MANIFESTS.map((m) => ({ ...m, enabled: overrides.get(m.id) ?? m.enabled }));
  },

  async setEnabled(userId: string, pluginId: string, enabled: boolean): Promise<void> {
    const pool = getPool();
    await pool.query(
      `INSERT INTO plugins (user_id, plugin_id, enabled) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, plugin_id) DO UPDATE SET enabled = $3`,
      [userId, pluginId, enabled]
    );
  },
};

export const pluginStoreRepo = {
  async get(userId: string, pluginId: string, key: string): Promise<unknown> {
    const pool = getPool();
    const result = await pool.query<{ value: string }>(
      "SELECT value FROM plugin_store WHERE user_id = $1 AND plugin_id = $2 AND key = $3",
      [userId, pluginId, key]
    );
    return result.rows[0] ? (JSON.parse(result.rows[0].value) as unknown) : undefined;
  },

  async set(userId: string, pluginId: string, key: string, value: unknown): Promise<void> {
    const pool = getPool();
    await pool.query(
      `INSERT INTO plugin_store (user_id, plugin_id, key, value, updated_at) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id, plugin_id, key) DO UPDATE SET value = $4, updated_at = $5`,
      [userId, pluginId, key, JSON.stringify(value), Date.now()]
    );
  },
};
