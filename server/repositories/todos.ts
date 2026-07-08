import { randomUUID } from "node:crypto";
import { getPool } from "../db";
import type { TodoItem } from "../../shared/types";

/** electron/db/repositories.ts の todoRepo を Postgres + user_id スコープ向けに移植したもの */
export const todoRepo = {
  async list(userId: string): Promise<TodoItem[]> {
    const pool = getPool();
    const result = await pool.query<{ id: string; title: string; done: boolean; due_date: string | null; created_at: string }>(
      "SELECT id, title, done, due_date, created_at FROM todos WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return result.rows.map((r) => ({
      id: r.id,
      title: r.title,
      done: r.done,
      dueDate: r.due_date ?? undefined,
      createdAt: Number(r.created_at),
    }));
  },

  async upsert(userId: string, todo: Partial<TodoItem> & { title: string }): Promise<TodoItem> {
    const pool = getPool();
    const id = todo.id ?? randomUUID();
    const createdAt = todo.createdAt ?? Date.now();
    await pool.query(
      `INSERT INTO todos (id, user_id, title, done, due_date, created_at) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET title = $3, done = $4, due_date = $5 WHERE todos.user_id = $2`,
      [id, userId, todo.title, !!todo.done, todo.dueDate ?? null, createdAt]
    );
    return { id, title: todo.title, done: !!todo.done, dueDate: todo.dueDate, createdAt };
  },

  async delete(userId: string, id: string): Promise<void> {
    const pool = getPool();
    await pool.query("DELETE FROM todos WHERE id = $1 AND user_id = $2", [id, userId]);
  },
};
