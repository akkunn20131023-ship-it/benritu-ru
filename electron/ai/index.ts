import { aiConfigStore } from "./secureStore";
import { createOpenAiProvider } from "./providers/openai";
import { createAnthropicProvider } from "./providers/anthropic";
import { createGeminiProvider } from "./providers/gemini";
import { createLocalProvider } from "./providers/local";
import { AI_DEFAULT_MODELS } from "../../shared/types";
import type { AiProvider } from "./types";

/** 現在の設定に基づいて有効化された AiProvider を組み立てる */
export function getActiveProvider(): AiProvider {
  const cfg = aiConfigStore.getInternal();

  switch (cfg.provider) {
    case "openai":
      if (!cfg.openaiKey) throw new Error("OpenAI の API キーが設定されていません");
      return createOpenAiProvider(cfg.openaiKey, cfg.model.openai || AI_DEFAULT_MODELS.openai);
    case "anthropic":
      if (!cfg.anthropicKey) throw new Error("Anthropic の API キーが設定されていません");
      return createAnthropicProvider(cfg.anthropicKey, cfg.model.anthropic || AI_DEFAULT_MODELS.anthropic);
    case "gemini":
      if (!cfg.geminiKey) throw new Error("Gemini の API キーが設定されていません");
      return createGeminiProvider(cfg.geminiKey, cfg.model.gemini || AI_DEFAULT_MODELS.gemini);
    case "local":
      return createLocalProvider(cfg.localBaseUrl, cfg.model.local || "llama3");
    default:
      throw new Error("AI プロバイダーが設定されていません。設定画面から接続してください。");
  }
}

/** 実行中のチャットを conversationId ごとに追跡し、キャンセル(AbortController)を可能にする */
class ChatSessionRegistry {
  private sessions = new Map<string, AbortController>();

  start(conversationId: string): AbortController {
    this.stop(conversationId);
    const controller = new AbortController();
    this.sessions.set(conversationId, controller);
    return controller;
  }

  stop(conversationId: string): void {
    this.sessions.get(conversationId)?.abort();
    this.sessions.delete(conversationId);
  }

  finish(conversationId: string): void {
    this.sessions.delete(conversationId);
  }
}

export const chatSessions = new ChatSessionRegistry();
