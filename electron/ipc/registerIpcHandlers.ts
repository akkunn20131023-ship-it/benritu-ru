import { ipcMain, type BrowserWindow } from "electron";
import { IPC } from "../../shared/types";
import type { AiProviderId, AppSettings, ChatMessage, NoteItem, TodoItem } from "../../shared/types";
import { settingsStore } from "../settings";
import { todoRepo, noteRepo, recentRepo, usageRepo } from "../db/repositories";
import { pluginManager } from "../plugins/PluginManager";
import { queryOne, run as dbRun } from "../db/database";
import { aiConfigStore } from "../ai/secureStore";
import { getActiveProvider, chatSessions } from "../ai";
import { extractPdfText } from "../files/pdfText";
import * as fsOps from "../files/fsOps";
import { createZip, extractZip } from "../files/zip";

/** すべての IPC ハンドラをここで一括登録する。main.ts から一度だけ呼び出すこと */
export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle(IPC.SETTINGS_GET, () => settingsStore.getAll());
  ipcMain.handle(IPC.SETTINGS_SET, (_e, key: keyof AppSettings, value: AppSettings[keyof AppSettings]) =>
    settingsStore.set(key, value)
  );

  ipcMain.handle(IPC.WINDOW_MINIMIZE, () => mainWindow.minimize());
  ipcMain.handle(IPC.WINDOW_MAXIMIZE, () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.handle(IPC.WINDOW_CLOSE, () => mainWindow.close());
  ipcMain.handle(IPC.WINDOW_IS_MAXIMIZED, () => mainWindow.isMaximized());

  ipcMain.handle(IPC.DB_TODO_LIST, () => todoRepo.list());
  ipcMain.handle(IPC.DB_TODO_UPSERT, (_e, todo: Partial<TodoItem> & { title: string }) => todoRepo.upsert(todo));
  ipcMain.handle(IPC.DB_TODO_DELETE, (_e, id: string) => todoRepo.delete(id));

  ipcMain.handle(IPC.DB_NOTE_LIST, () => noteRepo.list());
  ipcMain.handle(IPC.DB_NOTE_UPSERT, (_e, note: Partial<NoteItem> & { title: string }) => noteRepo.upsert(note));
  ipcMain.handle(IPC.DB_NOTE_DELETE, (_e, id: string) => noteRepo.delete(id));

  ipcMain.handle(IPC.DB_RECENT_LIST, (_e, limit?: number) => recentRepo.list(limit));
  ipcMain.handle(IPC.DB_RECENT_PUSH, (_e, item: Parameters<typeof recentRepo.push>[0]) => recentRepo.push(item));

  ipcMain.handle(IPC.DB_USAGE_LIST, () => usageRepo.list());
  ipcMain.handle(IPC.DB_USAGE_TRACK, (_e, featureId: string, deltaMs: number) => usageRepo.track(featureId, deltaMs));

  ipcMain.handle(IPC.PLUGIN_LIST, () => pluginManager.list());
  ipcMain.handle(IPC.PLUGIN_SET_ENABLED, (_e, id: string, enabled: boolean) => pluginManager.setEnabled(id, enabled));

  ipcMain.handle(IPC.PLUGIN_STORE_GET, (_e, pluginId: string, key: string) => {
    const row = queryOne<{ value: string }>("SELECT value FROM plugin_store WHERE plugin_id = @pluginId AND key = @key", {
      "@pluginId": pluginId,
      "@key": key,
    });
    return row ? (JSON.parse(row.value) as unknown) : undefined;
  });
  ipcMain.handle(IPC.PLUGIN_STORE_SET, (_e, pluginId: string, key: string, value: unknown) => {
    dbRun(
      `INSERT INTO plugin_store (plugin_id, key, value, updated_at) VALUES (@pluginId, @key, @value, @updatedAt)
       ON CONFLICT(plugin_id, key) DO UPDATE SET value = @value, updated_at = @updatedAt`,
      { "@pluginId": pluginId, "@key": key, "@value": JSON.stringify(value), "@updatedAt": Date.now() }
    );
  });

  ipcMain.handle(IPC.AI_CONFIG_GET, () => aiConfigStore.getPublic());
  ipcMain.handle(IPC.AI_CONFIG_SET_PROVIDER, (_e, provider: AiProviderId, model?: string) =>
    aiConfigStore.setProvider(provider, model)
  );
  ipcMain.handle(IPC.AI_CONFIG_SET_API_KEY, (_e, provider: "openai" | "anthropic" | "gemini", key: string) =>
    aiConfigStore.setApiKey(provider, key)
  );
  ipcMain.handle(IPC.AI_CONFIG_SET_BASE_URL, (_e, baseUrl: string) => aiConfigStore.setLocalBaseUrl(baseUrl));

  ipcMain.handle(IPC.AI_CHAT_SEND, async (_e, conversationId: string, messages: ChatMessage[]) => {
    const controller = chatSessions.start(conversationId);
    try {
      const provider = getActiveProvider();
      await provider.chat(
        messages,
        (delta) => {
          mainWindow.webContents.send(IPC.AI_CHAT_CHUNK, { conversationId, delta });
        },
        { signal: controller.signal }
      );
      mainWindow.webContents.send(IPC.AI_CHAT_DONE, { conversationId });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        mainWindow.webContents.send(IPC.AI_CHAT_DONE, { conversationId });
      } else {
        mainWindow.webContents.send(IPC.AI_CHAT_ERROR, { conversationId, message: (err as Error).message });
      }
    } finally {
      chatSessions.finish(conversationId);
    }
  });

  ipcMain.handle(IPC.AI_CHAT_STOP, (_e, conversationId: string) => chatSessions.stop(conversationId));

  ipcMain.handle(IPC.FILE_EXTRACT_PDF_TEXT, async (_e, data: ArrayBuffer) => extractPdfText(Buffer.from(data)));

  ipcMain.handle(IPC.FILE_PICK_FOLDER, () => fsOps.pickFolder(mainWindow));
  ipcMain.handle(IPC.FILE_PICK_FILES, (_e, filters?: Electron.FileFilter[]) => fsOps.pickFiles(mainWindow, filters));
  ipcMain.handle(IPC.FILE_PICK_SAVE_PATH, (_e, defaultName: string, filters?: Electron.FileFilter[]) =>
    fsOps.pickSavePath(mainWindow, defaultName, filters)
  );
  ipcMain.handle(IPC.FILE_LIST_DIR, (_e, dirPath: string) => fsOps.listDirectory(dirPath));
  ipcMain.handle(IPC.FILE_STAT, (_e, filePath: string) => fsOps.statFile(filePath));
  ipcMain.handle(IPC.FILE_READ_TEXT, (_e, filePath: string) => fsOps.readTextFile(filePath));
  ipcMain.handle(IPC.FILE_WRITE_TEXT, (_e, filePath: string, content: string) => fsOps.writeTextFile(filePath, content));
  ipcMain.handle(IPC.FILE_HASH, (_e, filePath: string, algo?: "md5" | "sha1" | "sha256") => fsOps.hashFile(filePath, algo));
  ipcMain.handle(IPC.FILE_TRASH, (_e, filePath: string) => fsOps.trashFile(filePath));
  ipcMain.handle(IPC.FILE_ZIP_CREATE, (_e, sourcePaths: string[], outputZipPath: string) => createZip(sourcePaths, outputZipPath));
  ipcMain.handle(IPC.FILE_ZIP_EXTRACT, (_e, zipPath: string, destDir: string) => extractZip(zipPath, destDir));
  ipcMain.handle(IPC.FILE_FIND_DUPLICATES, (_e, dirPath: string) => fsOps.findDuplicates(dirPath));
  ipcMain.handle(IPC.FILE_COMPARE, (_e, pathA: string, pathB: string) => fsOps.compareFiles(pathA, pathB));
  ipcMain.handle(IPC.FILE_OPEN_PATH, (_e, filePath: string) => fsOps.openPath(filePath));
  ipcMain.handle(IPC.FILE_SHOW_IN_FOLDER, (_e, filePath: string) => fsOps.showInFolder(filePath));
  ipcMain.handle(IPC.FILE_READ_BUFFER, (_e, filePath: string) => fsOps.readFileBuffer(filePath));
  ipcMain.handle(IPC.FILE_WRITE_BUFFER, (_e, filePath: string, data: ArrayBuffer) => fsOps.writeFileBuffer(filePath, data));
}
