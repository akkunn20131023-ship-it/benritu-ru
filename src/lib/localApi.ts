import type { OmniSuiteApi } from "../../electron/preload";
import { BUILTIN_MANIFESTS } from "../../electron/plugins/builtin-manifests";
import { DEFAULT_SETTINGS } from "@shared/types";
import type {
  AiConfigPublic,
  AppSettings,
  AuthUser,
  NoteItem,
  PluginManifest,
  RecentItem,
  TodoItem,
  UsageStat,
} from "@shared/types";
import { randomId } from "@/lib/randomId";

/**
 * バックエンド不要・ログイン不要の「ブラウザ内保存」実装。
 *
 * 一般公開Webサービスとして、初回アクセスした誰でもサーバーやアカウント無しで即利用できるように、
 * OmniSuiteApi と同じインターフェースを localStorage 上で実現する (Electron の preload / Web版の
 * HTTP 実装と差し替え可能)。すべてのデータはこのブラウザ内にのみ保存され、外部へは送信されない。
 *
 * サーバー同期版 (Postgres バックエンド) を使いたい場合は VITE_DATA_MODE=remote でビルドすると
 * src/lib/webApi.ts の HTTP 実装に切り替わる (src/main.tsx 参照)。
 */

const NS = "omni:";
const LOCAL_USER: AuthUser = { id: "local", email: "you@this-device" };

/** localStorage の全キー一覧 (エクスポート/インポートのバックアップ対象を判定するのに使う) */
export const LOCAL_STORE_PREFIX = NS;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    // 容量超過などは黙って無視 (UIは楽観的更新済みのため次回起動時に整合)
  }
}

function notImplemented(feature: string): never {
  throw new Error(`${feature} はこのブラウザ版では利用できません (デスクトップ版でご利用ください)`);
}

export function createLocalApi(): OmniSuiteApi {
  return {
    platform: "web",

    // ログイン画面は無い。この端末専用の固定ユーザーとして常にログイン済み扱いにする。
    auth: {
      me: async () => LOCAL_USER,
      ensureSession: async () => LOCAL_USER,
    },

    settings: {
      get: async (): Promise<AppSettings> => ({ ...DEFAULT_SETTINGS, ...read<Partial<AppSettings>>("settings", {}) }),
      set: async (key, value) => {
        const next = { ...DEFAULT_SETTINGS, ...read<Partial<AppSettings>>("settings", {}), [key]: value };
        write("settings", next);
        return next;
      },
    },

    window: {
      minimize: async () => {},
      maximize: async () => {},
      close: async () => {},
      isMaximized: async () => false,
      onMaximizedChange: () => () => {},
    },

    todo: {
      list: async () => read<TodoItem[]>("todos", []).slice().sort((a, b) => b.createdAt - a.createdAt),
      upsert: async (todo) => {
        const todos = read<TodoItem[]>("todos", []);
        if (todo.id) {
          const idx = todos.findIndex((t) => t.id === todo.id);
          if (idx >= 0) {
            const merged: TodoItem = { ...todos[idx], ...todo, title: todo.title };
            todos[idx] = merged;
            write("todos", todos);
            return merged;
          }
        }
        const created: TodoItem = {
          id: todo.id ?? randomId(),
          title: todo.title,
          done: todo.done ?? false,
          dueDate: todo.dueDate,
          createdAt: todo.createdAt ?? Date.now(),
        };
        write("todos", [created, ...todos]);
        return created;
      },
      delete: async (id) => {
        write("todos", read<TodoItem[]>("todos", []).filter((t) => t.id !== id));
      },
    },

    note: {
      list: async () => read<NoteItem[]>("notes", []).slice().sort((a, b) => b.updatedAt - a.updatedAt),
      upsert: async (note) => {
        const notes = read<NoteItem[]>("notes", []);
        const now = Date.now();
        if (note.id) {
          const idx = notes.findIndex((n) => n.id === note.id);
          if (idx >= 0) {
            const merged: NoteItem = { ...notes[idx], ...note, title: note.title, updatedAt: now };
            notes[idx] = merged;
            write("notes", notes);
            return merged;
          }
        }
        const created: NoteItem = {
          id: note.id ?? randomId(),
          title: note.title,
          content: note.content ?? "",
          tags: note.tags ?? [],
          createdAt: note.createdAt ?? now,
          updatedAt: now,
        };
        write("notes", [created, ...notes]);
        return created;
      },
      delete: async (id) => {
        write("notes", read<NoteItem[]>("notes", []).filter((n) => n.id !== id));
      },
    },

    recent: {
      list: async (limit?: number) => {
        const items = read<RecentItem[]>("recent", []);
        return limit ? items.slice(0, limit) : items;
      },
      push: async (item) => {
        const created: RecentItem = { id: randomId(), label: item.label, featureId: item.featureId, path: item.path, openedAt: Date.now() };
        const items = read<RecentItem[]>("recent", []).filter((r) => r.featureId !== item.featureId);
        write("recent", [created, ...items].slice(0, 50));
        return created;
      },
    },

    usage: {
      list: async () => read<UsageStat[]>("usage", []),
      track: async (featureId, deltaMs) => {
        const stats = read<UsageStat[]>("usage", []);
        const existing = stats.find((s) => s.featureId === featureId);
        if (existing) {
          existing.totalMs += deltaMs;
          existing.lastUsedAt = Date.now();
        } else {
          stats.push({ featureId, totalMs: deltaMs, lastUsedAt: Date.now() });
        }
        write("usage", stats);
      },
    },

    plugins: {
      list: async (): Promise<PluginManifest[]> => {
        const overrides = read<Record<string, boolean>>("plugins:enabled", {});
        return BUILTIN_MANIFESTS.map((m) => ({ ...m, enabled: overrides[m.id] ?? m.enabled }));
      },
      setEnabled: async (id, enabled) => {
        const overrides = read<Record<string, boolean>>("plugins:enabled", {});
        overrides[id] = enabled;
        write("plugins:enabled", overrides);
      },
      storeGet: async (pluginId, key) => {
        const raw = localStorage.getItem(`${NS}pstore:${pluginId}:${key}`);
        return raw === null ? undefined : (JSON.parse(raw) as unknown);
      },
      storeSet: async (pluginId, key, value) => {
        write(`pstore:${pluginId}:${key}`, value);
      },
    },

    // AI連携はブラウザ内に鍵を安全に保持する仕組み(暗号化)を別途実装するまでは未設定扱い。
    // 既存プラグインは "none" を見て通常のフォールバックUI(AI設定への導線)を表示する。
    ai: {
      getConfig: async (): Promise<AiConfigPublic> => ({
        provider: "none",
        model: {},
        localBaseUrl: "",
        hasKey: { openai: false, anthropic: false, gemini: false },
      }),
      setProvider: () => notImplemented("AI設定"),
      setApiKey: () => notImplemented("AI設定"),
      setBaseUrl: () => notImplemented("AI設定"),
      sendChat: () => notImplemented("AIチャット"),
      stopChat: async () => {},
      onChunk: () => () => {},
      onDone: () => () => {},
      onError: () => () => {},
    },

    // 実ファイルシステム/変換処理はデスクトップ版(Electron)専用。
    files: {
      extractPdfText: () => notImplemented("PDFテキスト抽出"),
      pickFolder: async () => null,
      pickFiles: async () => [],
      pickSavePath: async () => null,
      listDir: () => notImplemented("ファイル一覧"),
      stat: () => notImplemented("ファイル情報の取得"),
      readText: () => notImplemented("ファイルの読み込み"),
      writeText: () => notImplemented("ファイルの書き込み"),
      hash: () => notImplemented("ハッシュ計算"),
      trash: () => notImplemented("ファイルの削除"),
      zipCreate: () => notImplemented("ZIP作成"),
      zipExtract: () => notImplemented("ZIP解凍"),
      findDuplicates: () => notImplemented("重複ファイル検索"),
      compare: () => notImplemented("ファイル比較"),
      openPath: async () => {},
      showInFolder: async () => {},
      readBuffer: () => notImplemented("ファイルの読み込み"),
      writeBuffer: () => notImplemented("ファイルの書き込み"),
    },

    // ニュースは外部RSSの取得にサーバー(CORS回避プロキシ)が必要なため、バックエンドの無い
    // ブラウザ単独版では空を返す (ウィジェット側は空配列を安全に扱う)。
    news: {
      list: async () => [],
    },
  };
}
