import { BrowserWindow, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

/** メインウィンドウを作成する。フレームレスにして自前の TitleBar (Windows 11 風) を描画する */
export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 860,
    minHeight: 560,
    show: false,
    frame: false,
    backgroundColor: "#00000000",
    titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // Chromium 内蔵の PDF ビューアを有効化 (PDF閲覧プラグインが <embed type="application/pdf"> で使用)
      plugins: true,
    },
  });

  win.once("ready-to-show", () => win.show());

  if (VITE_DEV_SERVER_URL) {
    win.webContents.on("console-message", (_e, level, message, line, sourceId) => {
      console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
    });
    win.webContents.on("render-process-gone", (_e, details) => {
      console.error("[renderer crashed]", details);
    });
  }

  // 外部リンクは既定ブラウザで開く (アプリ内ナビゲーションを防止)
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  win.on("maximize", () => win.webContents.send("window:maximizedChange", true));
  win.on("unmaximize", () => win.webContents.send("window:maximizedChange", false));

  return win;
}
