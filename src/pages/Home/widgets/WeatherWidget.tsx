import { CloudSun } from "lucide-react";

/**
 * 天気ウィジェット(プレースホルダー)。
 * 実際の天気 API 連携は「インターネット」機能実装フェーズで追加予定。
 */
export function WeatherWidget() {
  return (
    <div className="glass-panel flex items-center gap-4 rounded-xl2 p-6">
      <CloudSun size={40} className="text-accent" strokeWidth={1.5} />
      <div>
        <p className="text-sm font-medium">天気連携は準備中です</p>
        <p className="text-xs text-neutral-500">設定から地域と天気 API を連携すると表示されます</p>
      </div>
    </div>
  );
}
