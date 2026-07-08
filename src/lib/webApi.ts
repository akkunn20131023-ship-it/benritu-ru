import type { OmniSuiteApi } from "../../electron/preload";
import type { AiConfigPublic, AppSettings, AuthUser, NoteItem, PluginManifest, RecentItem, TodoItem, UsageStat } from "@shared/types";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let message = `リクエストに失敗しました (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // レスポンスがJSONでない場合はデフォルトメッセージのまま
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function notImplemented(feature: string): never {
  throw new Error(`${feature} はWeb版ではまだ利用できません (今後のアップデートで対応予定です)`);
}

/**
 * ブラウザ実行時 (Electron の preload が注入されていない場合) に window.api へ差し込む実装。
 * Electron 版と同じ OmniSuiteApi インターフェースを HTTP 経由で実現することで、
 * プラグイン側のコードは一切変更せずに動作する (src/main.tsx 参照)。
 *
 * ai.* と files.* の一部は Web版バックエンドが未実装 (今後の W4/W5 フェーズで対応) のため、
 * 呼び出すと分かりやすいエラーを返すスタブになっている。
 */
export function createWebApi(): OmniSuiteApi {
  return {
    platform: "web",

    // ログイン画面は無く、ブラウザごとに自動で匿名アカウントが発行される (Cookie は
    // HttpOnly のため他人からは読み取れず、このブラウザ専用のデータとして分離される)。
    auth: {
      me: () => apiFetch<AuthUser>("/api/auth/me").catch(() => null),
      ensureSession: () => apiFetch<AuthUser>("/api/auth/anonymous", { method: "POST" }),
    },

    settings: {
      get: () => apiFetch<AppSettings>("/api/settings"),
      set: (key, value) => apiFetch<AppSettings>(`/api/settings/${key}`, { method: "PUT", body: JSON.stringify({ value }) }),
    },

    window: {
      minimize: async () => {},
      maximize: async () => {},
      close: async () => {},
      isMaximized: async () => false,
      onMaximizedChange: () => () => {},
    },

    todo: {
      list: () => apiFetch<TodoItem[]>("/api/todos"),
      upsert: (todo) => apiFetch<TodoItem>("/api/todos", { method: "POST", body: JSON.stringify(todo) }),
      delete: (id) => apiFetch<void>(`/api/todos/${id}`, { method: "DELETE" }),
    },

    note: {
      list: () => apiFetch<NoteItem[]>("/api/notes"),
      upsert: (note) => apiFetch<NoteItem>("/api/notes", { method: "POST", body: JSON.stringify(note) }),
      delete: (id) => apiFetch<void>(`/api/notes/${id}`, { method: "DELETE" }),
    },

    recent: {
      list: (limit?: number) => apiFetch<RecentItem[]>(`/api/recent${limit ? `?limit=${limit}` : ""}`),
      push: (item) => apiFetch<RecentItem>("/api/recent", { method: "POST", body: JSON.stringify(item) }),
    },

    usage: {
      list: () => apiFetch<UsageStat[]>("/api/usage"),
      track: (featureId, deltaMs) =>
        apiFetch<void>("/api/usage/track", { method: "POST", body: JSON.stringify({ featureId, deltaMs }) }),
    },

    plugins: {
      list: () => apiFetch<PluginManifest[]>("/api/plugins"),
      setEnabled: (id, enabled) => apiFetch<void>(`/api/plugins/${id}/enabled`, { method: "PUT", body: JSON.stringify({ enabled }) }),
      storeGet: (pluginId, key) =>
        apiFetch<{ value: unknown }>(`/api/plugins/${pluginId}/store/${key}`).then((r) => r.value),
      storeSet: (pluginId, key, value) =>
        apiFetch<void>(`/api/plugins/${pluginId}/store/${key}`, { method: "PUT", body: JSON.stringify({ value }) }),
    },

    // AI連携はバックエンドのAPIキー保管・ストリーミングエンドポイントが未実装 (W4で対応予定)。
    // getConfig だけは「未設定」を返して既存プラグインの通常のフォールバックUIを利用する。
    ai: {
      getConfig: () =>
        apiFetch<AiConfigPublic>("/api/ai/config").catch(() => ({
          provider: "none" as const,
          model: {},
          localBaseUrl: "",
          hasKey: { openai: false, anthropic: false, gemini: false },
        })),
      setProvider: () => notImplemented("AI設定"),
      setApiKey: () => notImplemented("AI設定"),
      setBaseUrl: () => notImplemented("AI設定"),
      sendChat: () => notImplemented("AIチャット"),
      stopChat: async () => {},
      onChunk: () => () => {},
      onDone: () => () => {},
      onError: () => () => {},
    },

    // 実ファイルシステム/PDF処理はファイルストレージ (Vercel Blob) 実装後の W5 で対応予定。
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
  };
}
