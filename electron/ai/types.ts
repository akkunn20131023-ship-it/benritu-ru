import type { ChatMessage } from "../../shared/types";

export interface ChatOptions {
  signal?: AbortSignal;
}

/**
 * すべての AI プロバイダーが実装する共通契約。
 * OpenAI / Anthropic / Gemini / ローカルLLM(Ollama互換) を同じ形で扱えるようにする。
 */
export interface AiProvider {
  id: string;
  chat(messages: ChatMessage[], onChunk: (delta: string) => void, opts?: ChatOptions): Promise<void>;
}

export type { ChatMessage };
