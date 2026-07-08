import initSqlJs, { type Database } from "sql.js";
import { app } from "electron";
import path from "node:path";
import fs from "node:fs";

/**
 * アプリ全体で共有する SQLite (sql.js / WASM) 接続。
 * ネイティブビルド不要な sql.js を採用しているため、better-sqlite3 と異なりメモリ上で
 * DB を操作したあと明示的に save() でディスク(userData配下)へ書き出す必要がある。
 */
let db: Database | null = null;
let dbPath = "";
let saveTimer: NodeJS.Timeout | null = null;

export async function getDatabase(): Promise<Database> {
  if (db) return db;

  const userDataDir = app.getPath("userData");
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
  dbPath = path.join(userDataDir, "omnisuite.sqlite");

  const SQL = await initSqlJs();
  const fileBuffer = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : undefined;
  db = new SQL.Database(fileBuffer);

  migrate(db);
  save();
  return db;
}

/** 同期版アクセサ。getDatabase() で初期化済みであることを呼び出し側が保証すること */
export function getDatabaseSync(): Database {
  if (!db) throw new Error("Database not initialized. Call getDatabase() first.");
  return db;
}

function migrate(database: Database): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      due_date TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recent_items (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      feature_id TEXT NOT NULL,
      path TEXT,
      opened_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS usage_stats (
      feature_id TEXT PRIMARY KEY,
      total_ms INTEGER NOT NULL DEFAULT 0,
      last_used_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plugins (
      id TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS plugin_store (
      plugin_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (plugin_id, key)
    );
  `);
}

/** 書き込み系操作のあとに呼び出す。短時間の連続呼び出しはデバウンスしてディスクI/Oを抑える */
export function save(): void {
  if (!db) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (!db) return;
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }, 150);
}

/** SELECT 実行用ヘルパー。複数行を素の JS オブジェクト配列として返す */
export function queryAll<T>(sql: string, params: Record<string, unknown> = {}): T[] {
  const database = getDatabaseSync();
  const stmt = database.prepare(sql);
  stmt.bind(params as never);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

export function queryOne<T>(sql: string, params: Record<string, unknown> = {}): T | undefined {
  return queryAll<T>(sql, params)[0];
}

/** INSERT / UPDATE / DELETE 実行用ヘルパー。実行後にディスクへの保存をスケジュールする */
export function run(sql: string, params: Record<string, unknown> = {}): void {
  getDatabaseSync().run(sql, params as never);
  save();
}

export function closeDatabase(): void {
  if (db) {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
  db?.close();
  db = null;
}
