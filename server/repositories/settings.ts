import { getPool } from "../db.js";
import { DEFAULT_SETTINGS, type AppSettings } from "../../shared/types";

/** electron/settings.ts (electron-store) を Postgres + user_id スコープ向けに移植したもの */
export const settingsRepo = {
  async getAll(userId: string): Promise<AppSettings> {
    const pool = getPool();
    const result = await pool.query<{ key: string; value: string }>("SELECT key, value FROM settings WHERE user_id = $1", [userId]);
    const overrides = Object.fromEntries(result.rows.map((r) => [r.key, JSON.parse(r.value) as unknown]));
    return { ...DEFAULT_SETTINGS, ...overrides } as AppSettings;
  },

  async set<K extends keyof AppSettings>(userId: string, key: K, value: AppSettings[K]): Promise<AppSettings> {
    const pool = getPool();
    await pool.query(
      `INSERT INTO settings (user_id, key, value) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, key) DO UPDATE SET value = $3`,
      [userId, key, JSON.stringify(value)]
    );
    return this.getAll(userId);
  },
};
