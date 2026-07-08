import { contextBridge, ipcRenderer } from "electron";
import { IPC } from "../shared/types";
import type {
  AiConfigPublic,
  AiProviderId,
  AppSettings,
  ChatMessage,
  DuplicateGroup,
  FileEntry,
  NoteItem,
  TodoItem,
} from "../shared/types";

/**
 * renderer に公開する唯一の窓口。contextIsolation 有効のため window.api 経由のみで
 * main プロセスと通信できる。チャンネル名は shared/types.ts の IPC 定数で一元管理する。
 */
const api = {
  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke(IPC.SETTINGS_GET),
    set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
      ipcRenderer.invoke(IPC.SETTINGS_SET, key, value) as Promise<AppSettings>,
  },
  window: {
    minimize: () => ipcRenderer.invoke(IPC.WINDOW_MINIMIZE),
    maximize: () => ipcRenderer.invoke(IPC.WINDOW_MAXIMIZE),
    close: () => ipcRenderer.invoke(IPC.WINDOW_CLOSE),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke(IPC.WINDOW_IS_MAXIMIZED),
    onMaximizedChange: (cb: (maximized: boolean) => void) => {
      const listener = (_: unknown, maximized: boolean) => cb(maximized);
      ipcRenderer.on("window:maximizedChange", listener);
      return () => {
        ipcRenderer.removeListener("window:maximizedChange", listener);
      };
    },
  },
  todo: {
    list: (): Promise<TodoItem[]> => ipcRenderer.invoke(IPC.DB_TODO_LIST),
    upsert: (todo: Partial<TodoItem> & { title: string }): Promise<TodoItem> =>
      ipcRenderer.invoke(IPC.DB_TODO_UPSERT, todo),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IPC.DB_TODO_DELETE, id),
  },
  note: {
    list: (): Promise<NoteItem[]> => ipcRenderer.invoke(IPC.DB_NOTE_LIST),
    upsert: (note: Partial<NoteItem> & { title: string }): Promise<NoteItem> =>
      ipcRenderer.invoke(IPC.DB_NOTE_UPSERT, note),
    delete: (id: string): Promise<void> => ipcRenderer.invoke(IPC.DB_NOTE_DELETE, id),
  },
  recent: {
    list: (limit?: number) => ipcRenderer.invoke(IPC.DB_RECENT_LIST, limit),
    push: (item: { label: string; featureId: string; path?: string }) => ipcRenderer.invoke(IPC.DB_RECENT_PUSH, item),
  },
  usage: {
    list: () => ipcRenderer.invoke(IPC.DB_USAGE_LIST),
    track: (featureId: string, deltaMs: number) => ipcRenderer.invoke(IPC.DB_USAGE_TRACK, featureId, deltaMs),
  },
  plugins: {
    list: () => ipcRenderer.invoke(IPC.PLUGIN_LIST),
    setEnabled: (id: string, enabled: boolean) => ipcRenderer.invoke(IPC.PLUGIN_SET_ENABLED, id, enabled),
    storeGet: (pluginId: string, key: string) => ipcRenderer.invoke(IPC.PLUGIN_STORE_GET, pluginId, key),
    storeSet: (pluginId: string, key: string, value: unknown) =>
      ipcRenderer.invoke(IPC.PLUGIN_STORE_SET, pluginId, key, value),
  },
  ai: {
    getConfig: (): Promise<AiConfigPublic> => ipcRenderer.invoke(IPC.AI_CONFIG_GET),
    setProvider: (provider: AiProviderId, model?: string): Promise<AiConfigPublic> =>
      ipcRenderer.invoke(IPC.AI_CONFIG_SET_PROVIDER, provider, model),
    setApiKey: (provider: "openai" | "anthropic" | "gemini", key: string): Promise<AiConfigPublic> =>
      ipcRenderer.invoke(IPC.AI_CONFIG_SET_API_KEY, provider, key),
    setBaseUrl: (baseUrl: string): Promise<AiConfigPublic> => ipcRenderer.invoke(IPC.AI_CONFIG_SET_BASE_URL, baseUrl),
    sendChat: (conversationId: string, messages: ChatMessage[]): Promise<void> =>
      ipcRenderer.invoke(IPC.AI_CHAT_SEND, conversationId, messages),
    stopChat: (conversationId: string): Promise<void> => ipcRenderer.invoke(IPC.AI_CHAT_STOP, conversationId),
    onChunk: (cb: (payload: { conversationId: string; delta: string }) => void) => {
      const listener = (_: unknown, payload: { conversationId: string; delta: string }) => cb(payload);
      ipcRenderer.on(IPC.AI_CHAT_CHUNK, listener);
      return () => {
        ipcRenderer.removeListener(IPC.AI_CHAT_CHUNK, listener);
      };
    },
    onDone: (cb: (payload: { conversationId: string }) => void) => {
      const listener = (_: unknown, payload: { conversationId: string }) => cb(payload);
      ipcRenderer.on(IPC.AI_CHAT_DONE, listener);
      return () => {
        ipcRenderer.removeListener(IPC.AI_CHAT_DONE, listener);
      };
    },
    onError: (cb: (payload: { conversationId: string; message: string }) => void) => {
      const listener = (_: unknown, payload: { conversationId: string; message: string }) => cb(payload);
      ipcRenderer.on(IPC.AI_CHAT_ERROR, listener);
      return () => {
        ipcRenderer.removeListener(IPC.AI_CHAT_ERROR, listener);
      };
    },
  },
  files: {
    extractPdfText: (data: ArrayBuffer): Promise<string> => ipcRenderer.invoke(IPC.FILE_EXTRACT_PDF_TEXT, data),
    pickFolder: (): Promise<string | null> => ipcRenderer.invoke(IPC.FILE_PICK_FOLDER),
    pickFiles: (filters?: Electron.FileFilter[]): Promise<string[]> => ipcRenderer.invoke(IPC.FILE_PICK_FILES, filters),
    pickSavePath: (defaultName: string, filters?: Electron.FileFilter[]): Promise<string | null> =>
      ipcRenderer.invoke(IPC.FILE_PICK_SAVE_PATH, defaultName, filters),
    listDir: (dirPath: string): Promise<FileEntry[]> => ipcRenderer.invoke(IPC.FILE_LIST_DIR, dirPath),
    stat: (filePath: string): Promise<FileEntry> => ipcRenderer.invoke(IPC.FILE_STAT, filePath),
    readText: (filePath: string): Promise<string> => ipcRenderer.invoke(IPC.FILE_READ_TEXT, filePath),
    writeText: (filePath: string, content: string): Promise<void> => ipcRenderer.invoke(IPC.FILE_WRITE_TEXT, filePath, content),
    hash: (filePath: string, algo?: "md5" | "sha1" | "sha256"): Promise<string> => ipcRenderer.invoke(IPC.FILE_HASH, filePath, algo),
    trash: (filePath: string): Promise<void> => ipcRenderer.invoke(IPC.FILE_TRASH, filePath),
    zipCreate: (sourcePaths: string[], outputZipPath: string): Promise<void> =>
      ipcRenderer.invoke(IPC.FILE_ZIP_CREATE, sourcePaths, outputZipPath),
    zipExtract: (zipPath: string, destDir: string): Promise<void> => ipcRenderer.invoke(IPC.FILE_ZIP_EXTRACT, zipPath, destDir),
    findDuplicates: (dirPath: string): Promise<DuplicateGroup[]> => ipcRenderer.invoke(IPC.FILE_FIND_DUPLICATES, dirPath),
    compare: (pathA: string, pathB: string): Promise<{ identical: boolean; hashA: string; hashB: string }> =>
      ipcRenderer.invoke(IPC.FILE_COMPARE, pathA, pathB),
    openPath: (filePath: string): Promise<void> => ipcRenderer.invoke(IPC.FILE_OPEN_PATH, filePath),
    showInFolder: (filePath: string): Promise<void> => ipcRenderer.invoke(IPC.FILE_SHOW_IN_FOLDER, filePath),
    readBuffer: (filePath: string): Promise<Uint8Array> => ipcRenderer.invoke(IPC.FILE_READ_BUFFER, filePath),
    writeBuffer: (filePath: string, data: ArrayBuffer | Uint8Array): Promise<void> =>
      ipcRenderer.invoke(IPC.FILE_WRITE_BUFFER, filePath, data),
  },
};

contextBridge.exposeInMainWorld("api", api);

export type OmniSuiteApi = typeof api;
