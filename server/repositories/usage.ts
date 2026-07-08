import { getPool } from "../db.js";
import type { UsageStat } from "../../shared/types";

/** electron/db/repositories.ts の usageRepo を Postgres + user_id スコープ向けに移植したもの */
export const usageRepo = {
  async list(userId: string): Promise<UsageStat[]> {
    const pool = getPool();
    const result = await pool.query<{ feature_id: string; total_ms: string; last_used_at: string }>(
      "SELECT feature_id, total_ms, last_used_at FROM usage_stats WHERE user_id = $1 ORDER BY total_ms DESC",
      [userId]
    );
    return result.rows.map((r) => ({ featureId: r.feature_id, totalMs: Number(r.total_ms), lastUsedAt: Number(r.last_used_at) }));
  },

  async track(userId: string, featureId: string, deltaMs: number): Promise<void> {
    const pool = getPool();
    const now = Date.now();
    await pool.query(
      `INSERT INTO usage_stats (user_id, feature_id, total_ms, last_used_at) VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, feature_id) DO UPDATE SET total_ms = usage_stats.total_ms + $3, last_used_at = $4`,
      [userId, featureId, deltaMs, now]
    );
  },
};
