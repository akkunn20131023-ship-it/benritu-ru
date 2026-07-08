/**
 * main / preload / renderer すべてから参照される共有型定義。
 * ここを変更する場合は IPC の契約が壊れないよう electron/preload.ts と src/lib/ipc.ts も合わせて確認すること。
 */

export type ThemeMode = "light" | "dark" | "system";

export type AiProviderId = "openai" | "anthropic" | "gemini" | "local" | "none";

export interface AppSettings {
  theme: ThemeMode;
  accentColor: string;
  locale: "ja" | "en";
  sidebarCollapsed: boolean;
  aiProvider: AiProviderId;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  accentColor: "#3b82f6",
  locale: "ja",
  sidebarCollapsed: false,
  aiProvider: "none",
};

/** AI チャットの1メッセージ。ロールは各プロバイダー共通の最小集合 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** renderer に公開する AI 設定。API キー本体は含まれない (main プロセス内で暗号化保存) */
export interface AiConfigPublic {
  provider: AiProviderId;
  model: Partial<Record<AiProviderId, string>>;
  localBaseUrl: string;
  hasKey: { openai: boolean; anthropic: boolean; gemini: boolean };
}

export const AI_DEFAULT_MODELS: Record<Exclude<AiProviderId, "none" | "local">, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-opus-4-8",
  gemini: "gemini-2.0-flash",
};

/** プラグインが app.db に対して発行できる汎用 CRUD スコープ (プラグインID配下の名前空間に限定) */
export interface PluginStoreRecord {
  id: string;
  pluginId: string;
  key: string;
  value: unknown;
  updatedAt: number;
}

export interface TodoItem {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string;
  createdAt: number;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface RecentItem {
  id: string;
  label: string;
  featureId: string;
  path?: string;
  openedAt: number;
}

export interface UsageStat {
  featureId: string;
  totalMs: number;
  lastUsedAt: number;
}

/** アプリの実行環境。TitleBar等が Electron 専用機能の表示可否を判定するのに使う */
export type Platform = "electron" | "web";

/** Web版のメール+パスワード認証で扱うユーザー情報 (デスクトップ版では常に固定のダミー値) */
export interface AuthUser {
  id: string;
  email: string;
}

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: number;
}

export interface DuplicateGroup {
  hash: string;
  size: number;
  paths: string[];
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
}

/** プラグインマニフェスト: プラグインシステムのコア契約 */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  icon?: string;
  category:
    | "life"
    | "study"
    | "files"
    | "document"
    | "image"
    | "video"
    | "audio"
    | "internet"
    | "game"
    | "creator"
    | "developer"
    | "ai"
    | "security"
    | "other";
  entry: string;
  enabled: boolean;
  builtin: boolean;
}

export const IPC = {
  SETTINGS_GET: "settings:get",
  SETTINGS_SET: "settings:set",
  WINDOW_MINIMIZE: "window:minimize",
  WINDOW_MAXIMIZE: "window:maximize",
  WINDOW_CLOSE: "window:close",
  WINDOW_IS_MAXIMIZED: "window:isMaximized",
  DB_TODO_LIST: "db:todo:list",
  DB_TODO_UPSERT: "db:todo:upsert",
  DB_TODO_DELETE: "db:todo:delete",
  DB_NOTE_LIST: "db:note:list",
  DB_NOTE_UPSERT: "db:note:upsert",
  DB_NOTE_DELETE: "db:note:delete",
  DB_RECENT_LIST: "db:recent:list",
  DB_RECENT_PUSH: "db:recent:push",
  DB_USAGE_LIST: "db:usage:list",
  DB_USAGE_TRACK: "db:usage:track",
  PLUGIN_LIST: "plugin:list",
  PLUGIN_SET_ENABLED: "plugin:setEnabled",
  PLUGIN_STORE_GET: "plugin:store:get",
  PLUGIN_STORE_SET: "plugin:store:set",
  AI_CONFIG_GET: "ai:config:get",
  AI_CONFIG_SET_PROVIDER: "ai:config:setProvider",
  AI_CONFIG_SET_API_KEY: "ai:config:setApiKey",
  AI_CONFIG_SET_BASE_URL: "ai:config:setBaseUrl",
  AI_CHAT_SEND: "ai:chat:send",
  AI_CHAT_STOP: "ai:chat:stop",
  AI_CHAT_CHUNK: "ai:chat:chunk",
  AI_CHAT_DONE: "ai:chat:done",
  AI_CHAT_ERROR: "ai:chat:error",
  FILE_EXTRACT_PDF_TEXT: "file:extractPdfText",
  FILE_PICK_FOLDER: "file:pickFolder",
  FILE_PICK_FILES: "file:pickFiles",
  FILE_PICK_SAVE_PATH: "file:pickSavePath",
  FILE_LIST_DIR: "file:listDir",
  FILE_STAT: "file:stat",
  FILE_READ_TEXT: "file:readText",
  FILE_WRITE_TEXT: "file:writeText",
  FILE_HASH: "file:hash",
  FILE_TRASH: "file:trash",
  FILE_ZIP_CREATE: "file:zipCreate",
  FILE_ZIP_EXTRACT: "file:zipExtract",
  FILE_FIND_DUPLICATES: "file:findDuplicates",
  FILE_COMPARE: "file:compare",
  FILE_OPEN_PATH: "file:openPath",
  FILE_SHOW_IN_FOLDER: "file:showInFolder",
  FILE_READ_BUFFER: "file:readBuffer",
  FILE_WRITE_BUFFER: "file:writeBuffer",
  NEWS_LIST: "news:list",
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];
