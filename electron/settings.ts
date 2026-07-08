import Store from "electron-store";
import { DEFAULT_SETTINGS, type AppSettings } from "../shared/types";

/** アプリ設定 (テーマ・言語など) の永続化。SQLite ではなく軽量な electron-store を使用 */
const store = new Store<AppSettings>({
  name: "settings",
  defaults: DEFAULT_SETTINGS,
});

export const settingsStore = {
  getAll(): AppSettings {
    return store.store;
  },
  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): AppSettings {
    store.set(key, value);
    return store.store;
  },
};
