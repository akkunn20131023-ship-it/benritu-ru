import { getPool } from "../db";

let migrated: Promise<void> | null = null;

/**
 * 冪等なスキーマ作成。Vercel Functions のコールドスタート毎に1回だけ実行されるよう
 * モジュールスコープの Promise でメモ化する (同一インスタンス内での重複実行を防ぐ)。
 */
export function ensureMigrated(): Promise<void> {
  if (!migrated) migrated = runMigration();
  return migrated;
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
  `);
}
