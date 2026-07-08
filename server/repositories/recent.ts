import { randomUUID } from "node:crypto";
import { getPool } from "../db";
import type { RecentItem } from "../../shared/types";

/** electron/db/repositories.ts の recentRepo を Postgres + user_id スコープ向けに移植したもの */
export const recentRepo = {
  async list(userId: string, limit = 20): Promise<RecentItem[]> {
    const pool = getPool();
    const result = await pool.query<{ id: string; label: string; feature_id: string; path: string | null; opened_at: string }>(
      "SELECT id, label, feature_id, path, opened_at FROM recent_items WHERE user_id = $1 ORDER BY opened_at DESC LIMIT $2",
      [userId, limit]
    );
    return result.rows.map((r) => ({
      id: r.id,
      label: r.label,
      featureId: r.feature_id,
      path: r.path ?? undefined,
      openedAt: Number(r.opened_at),
    }));
  },

  async push(userId: string, item: Omit<RecentItem, "id" | "openedAt">): Promise<RecentItem> {
    const pool = getPool();
    const id = randomUUID();
    const openedAt = Date.now();
    await pool.query(
      "INSERT INTO recent_items (id, user_id, label, feature_id, path, opened_at) VALUES ($1,$2,$3,$4,$5,$6)",
      [id, userId, item.label, item.featureId, item.path ?? null, openedAt]
    );
    // 直近50件のみ保持 (electron版と同じ挙動)
    await pool.query(
      `DELETE FROM recent_items WHERE user_id = $1 AND id NOT IN (
         SELECT id FROM recent_items WHERE user_id = $1 ORDER BY opened_at DESC LIMIT 50
       )`,
      [userId]
    );
    return { id, openedAt, ...item };
  },
};
