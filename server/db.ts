import { Pool } from "pg";

let pool: Pool | null = null;

/**
 * Neon (Serverless Postgres) への接続プール。Vercel Functions はコールドスタート毎に
 * モジュールが再評価されることがあるため、プールをモジュールスコープでシングルトン化する。
 */
export function getPool(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL が設定されていません (.env.local または Vercel の環境変数を確認してください)");
  }

  pool = new Pool({
    connectionString,
    ssl: connectionString.includes("sslmode=require") || connectionString.includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
  });
  return pool;
}
