import type { NextFunction, Request, Response } from "express";
import { getPool } from "../db.js";

let migrated: Promise<void> | null = null;

/**
 * 冪等なスキーマ作成。Vercel Functions のコールドスタート毎に1回だけ実行されるよう
 * モジュールスコープの Promise でメモ化する (同一インスタンス内での重複実行を防ぐ)。
 *
 * タイムスタンプ系のカラムは Electron 版 (electron/db/database.ts) と型を揃えるため
 * Date.now() の epoch ミリ秒を BIGINT でそのまま保持する (Date型に変換しない)。
 */
export function ensureMigrated(): Promise<void> {
  if (!migrated) migrated = runMigration();
  return migrated;
}

/** Express ルーターで `router.use(requireAuth, migrationGate)` として使う */
export function migrationGate(_req: Request, _res: Response, next: NextFunction): void {
  ensureMigrated()
    .then(() => next())
    .catch(next);
}

async function runMigration(): Promise<void> {
  const pool = getPool();
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS settings (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (user_id, key)
    );

    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT false,
      due_date TEXT,
      created_at BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id);

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);

    CREATE TABLE IF NOT EXISTS recent_items (
      id TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      feature_id TEXT NOT NULL,
      path TEXT,
      opened_at BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_recent_user ON recent_items(user_id);

    CREATE TABLE IF NOT EXISTS usage_stats (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      feature_id TEXT NOT NULL,
      total_ms BIGINT NOT NULL DEFAULT 0,
      last_used_at BIGINT NOT NULL,
      PRIMARY KEY (user_id, feature_id)
    );

    CREATE TABLE IF NOT EXISTS plugins (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plugin_id TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT true,
      PRIMARY KEY (user_id, plugin_id)
    );

    CREATE TABLE IF NOT EXISTS plugin_store (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plugin_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at BIGINT NOT NULL,
      PRIMARY KEY (user_id, plugin_id, key)
    );
  `);
}
