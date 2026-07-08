import { randomUUID } from "node:crypto";
import { getPool } from "../db";
import type { NoteItem } from "../../shared/types";

/** electron/db/repositories.ts の noteRepo を Postgres + user_id スコープ向けに移植したもの */
export const noteRepo = {
  async list(userId: string): Promise<NoteItem[]> {
    const pool = getPool();
    const result = await pool.query<{
      id: string;
      title: string;
      content: string;
      tags: string;
      created_at: string;
      updated_at: string;
    }>("SELECT id, title, content, tags, created_at, updated_at FROM notes WHERE user_id = $1 ORDER BY updated_at DESC", [userId]);
    return result.rows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      tags: JSON.parse(r.tags) as string[],
      createdAt: Number(r.created_at),
      updatedAt: Number(r.updated_at),
    }));
  },

  async upsert(userId: string, note: Partial<NoteItem> & { title: string }): Promise<NoteItem> {
    const pool = getPool();
    const id = note.id ?? randomUUID();
    const now = Date.now();
    const createdAt = note.createdAt ?? now;
    const tags = JSON.stringify(note.tags ?? []);
    await pool.query(
      `INSERT INTO notes (id, user_id, title, content, tags, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id) DO UPDATE SET title = $3, content = $4, tags = $5, updated_at = $7 WHERE notes.user_id = $2`,
      [id, userId, note.title, note.content ?? "", tags, createdAt, now]
    );
    return { id, title: note.title, content: note.content ?? "", tags: note.tags ?? [], createdAt, updatedAt: now };
  },

  async delete(userId: string, id: string): Promise<void> {
    const pool = getPool();
    await pool.query("DELETE FROM notes WHERE id = $1 AND user_id = $2", [id, userId]);
  },
};
