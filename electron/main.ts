import { app, BrowserWindow } from "electron";
import { createMainWindow } from "./window";
import { registerIpcHandlers } from "./ipc/registerIpcHandlers";
import { pluginManager } from "./plugins/PluginManager";
import { closeDatabase, getDatabase } from "./db/database";

// Windows/Linux: 複数プロセス起動を防止しシングルインスタンス化
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    await getDatabase();
    pluginManager.init();
    const mainWindow = createMainWindow();
    registerIpcHandlers(mainWindow);

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  app.on("window-all-closed", () => {
    closeDatabase();
    if (process.platform !== "darwin") app.quit();
  });

  app.on("before-quit", () => closeDatabase());
}
