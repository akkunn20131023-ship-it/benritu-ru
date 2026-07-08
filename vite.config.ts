import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron/simple";
import electronRenderer from "vite-plugin-electron-renderer";
import path from "node:path";

// Vercel のビルド環境では自動的に VERCEL=1 が設定される。Web ビルドでは Electron 関連プラグインを含めない。
const isWebBuild = !!process.env.VERCEL;

// OmniSuite ビルド設定: renderer(React) と Electron main/preload を単一の Vite プロセスでビルドする
// (Web版デプロイ時は Electron 関連プラグインを除外し、純粋な静的サイトとしてビルドする)
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  plugins: [
    react(),
    ...(isWebBuild
      ? []
      : [
          electron({
            main: {
              entry: "electron/main.ts",
              vite: {
                build: {
                  outDir: "dist-electron",
                  rollupOptions: {
                    external: ["sql.js", "electron-store", "pdf-parse", "jszip"],
                  },
                },
              },
            },
            preload: {
              input: path.join(__dirname, "electron/preload.ts"),
              vite: {
                build: {
                  outDir: "dist-electron",
                  rollupOptions: {
                    output: {
                      format: "cjs",
                      entryFileNames: "preload.cjs",
                    },
                  },
                },
              },
            },
            renderer: {},
          }),
          electronRenderer(),
        ]),
  ],
});
