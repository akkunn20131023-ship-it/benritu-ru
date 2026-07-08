import { randomUUID } from "node:crypto";
import { queryAll, run } from "./database";
import type { NoteItem, RecentItem, TodoItem, UsageStat } from "../../shared/types";

/** ToDo 関連のクエリをまとめたリポジトリ */
export const todoRepo = {
  list(): TodoItem[] {
    const rows = queryAll<{ id: string; title: string; done: number; due_date: string | null; created_at: number }>(
      "SELECT id, title, done, due_date, created_at FROM todos ORDER BY created_at DESC"
    );
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      done: !!r.done,
      dueDate: r.due_date ?? undefined,
      createdAt: r.created_at,
    }));
  },
  upsert(todo: Partial<TodoItem> & { title: string }): TodoItem {
    const id = todo.id ?? randomUUID();
    const createdAt = todo.createdAt ?? Date.now();
    run(
      `INSERT INTO todos (id, title, done, due_date, created_at) VALUES (@id, @title, @done, @dueDate, @createdAt)
       ON CONFLICT(id) DO UPDATE SET title = @title, done = @done, due_date = @dueDate`,
      { "@id": id, "@title": todo.title, "@done": todo.done ? 1 : 0, "@dueDate": todo.dueDate ?? null, "@createdAt": createdAt }
    );
    return { id, title: todo.title, done: !!todo.done, dueDate: todo.dueDate, createdAt };
  },
  delete(id: string): void {
    run("DELETE FROM todos WHERE id = @id", { "@id": id });
  },
};

/** Markdown ノート関連のクエリをまとめたリポジトリ */
export const noteRepo = {
  list(): NoteItem[] {
    const rows = queryAll<{ id: string; title: string; content: string; tags: string; created_at: number; updated_at: number }>(
      "SELECT id, title, content, tags, created_at, updated_at FROM notes ORDER BY updated_at DESC"
    );
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      tags: JSON.parse(r.tags) as string[],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },
  upsert(note: Partial<NoteItem> & { title: string }): NoteItem {
    const id = note.id ?? randomUUID();
    const now = Date.now();
    const createdAt = note.createdAt ?? now;
    const tags = JSON.stringify(note.tags ?? []);
    run(
      `INSERT INTO notes (id, title, content, tags, created_at, updated_at) VALUES (@id, @title, @content, @tags, @createdAt, @updatedAt)
       ON CONFLICT(id) DO UPDATE SET title = @title, content = @content, tags = @tags, updated_at = @updatedAt`,
      { "@id": id, "@title": note.title, "@content": note.content ?? "", "@tags": tags, "@createdAt": createdAt, "@updatedAt": now }
    );
    return { id, title: note.title, content: note.content ?? "", tags: note.tags ?? [], createdAt, updatedAt: now };
  },
  delete(id: string): void {
    run("DELETE FROM notes WHERE id = @id", { "@id": id });
  },
};

/** 「最近使った機能/ファイル」の記録。直近50件のみ保持する */
export const recentRepo = {
  list(limit = 20): RecentItem[] {
    const rows = queryAll<{ id: string; label: string; feature_id: string; path: string | null; opened_at: number }>(
      "SELECT id, label, feature_id, path, opened_at FROM recent_items ORDER BY opened_at DESC LIMIT @limit",
      { "@limit": limit }
    );
    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      featureId: r.feature_id,
      path: r.path ?? undefined,
      openedAt: r.opened_at,
    }));
  },
  push(item: Omit<RecentItem, "id" | "openedAt">): RecentItem {
    const id = randomUUID();
    const openedAt = Date.now();
    run("INSERT INTO recent_items (id, label, feature_id, path, opened_at) VALUES (@id, @label, @featureId, @path, @openedAt)", {
      "@id": id,
      "@label": item.label,
      "@featureId": item.featureId,
      "@path": item.path ?? null,
      "@openedAt": openedAt,
    });
    run("DELETE FROM recent_items WHERE id NOT IN (SELECT id FROM recent_items ORDER BY opened_at DESC LIMIT 50)");
    return { id, openedAt, ...item };
  },
};

/** 機能ごとの利用時間・使用統計 */
export const usageRepo = {
  list(): UsageStat[] {
    const rows = queryAll<{ feature_id: string; total_ms: number; last_used_at: number }>(
      "SELECT feature_id, total_ms, last_used_at FROM usage_stats ORDER BY total_ms DESC"
    );
    return rows.map((r) => ({ featureId: r.feature_id, totalMs: r.total_ms, lastUsedAt: r.last_used_at }));
  },
  track(featureId: string, deltaMs: number): void {
    const now = Date.now();
    run(
      `INSERT INTO usage_stats (feature_id, total_ms, last_used_at) VALUES (@featureId, @deltaMs, @now)
       ON CONFLICT(feature_id) DO UPDATE SET total_ms = total_ms + @deltaMs, last_used_at = @now`,
      { "@featureId": featureId, "@deltaMs": deltaMs, "@now": now }
    );
  },
};
