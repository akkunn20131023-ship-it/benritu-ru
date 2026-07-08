import type { AiProvider, ChatMessage, ChatOptions } from "../types";
import { iterateLines, assertOk } from "../lines";

/** Ollama互換のローカルLLM API (NDJSON形式のストリーミング) */
export function createLocalProvider(baseUrl: string, model: string): AiProvider {
  return {
    id: "local",
    async chat(messages: ChatMessage[], onChunk, opts?: ChatOptions) {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream: true }),
        signal: opts?.signal,
      });
      await assertOk(res, "ローカルLLM");

      for await (const line of iterateLines(res)) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const json = JSON.parse(trimmed) as { message?: { content?: string }; done?: boolean };
        if (json.message?.content) onChunk(json.message.content);
        if (json.done) return;
      }
    },
  };
}
