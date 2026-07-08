import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import type { AiConfigPublic } from "@shared/types";

/** AI からのおすすめウィジェット。プロバイダー設定状態に応じて導線を出し分ける */
export function AiSuggestionWidget() {
  const [config, setConfig] = useState<AiConfigPublic | null>(null);

  useEffect(() => {
    void window.api.ai.getConfig().then(setConfig);
  }, []);

  const configured = config && config.provider !== "none";

  return (
    <div className="glass-panel flex flex-col gap-2 rounded-xl2 p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles size={16} className="text-accent" /> AI からのおすすめ
      </h3>
      {configured ? (
        <>
          <p className="text-sm text-neutral-500">AIチャットで今日の予定やタスクについて相談できます。</p>
          <Link to="/plugin/ai-chat" className="text-xs font-medium text-accent hover:underline">
            AIチャットを開く →
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-neutral-500">
            AI プロバイダーが未設定です。OpenAI / Anthropic / Gemini / ローカル LLM を接続すると、AIのおすすめや相談ができるようになります。
          </p>
          <Link to="/settings/ai" className="text-xs font-medium text-accent hover:underline">
            AI設定を開く →
          </Link>
        </>
      )}
    </div>
  );
}
