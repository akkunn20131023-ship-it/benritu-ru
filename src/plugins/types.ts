import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import type { PluginManifest } from "@shared/types";

/**
 * プラグイン SDK の中核契約。
 * サードパーティプラグインもこの形式で `manifest` と `Component` をエクスポートする。
 * (現段階ではビルトインプラグインを静的インポートしているが、将来的に
 * 外部フォルダから動的 import() する場合もこのインターフェースのまま拡張できる)
 */
export interface PluginModule {
  manifest: Omit<PluginManifest, "enabled" | "builtin">;
  icon: LucideIcon;
  Component: ComponentType;
}

/** main プロセスの manifest(有効/無効・永続化情報) と renderer 側の実装を合成した実行時表現 */
export interface RegisteredPlugin extends PluginModule {
  enabled: boolean;
}
