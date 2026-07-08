import type { AiProvider, ChatMessage, ChatOptions } from "../types";
import { iterateLines, assertOk } from "../lines";

/** OpenAI Chat Completions API (stream: true, SSE) */
export function createOpenAiProvider(apiKey: string, model: string): AiProvider {
  return {
    id: "openai",
    async chat(messages: ChatMessage[], onChunk, opts?: ChatOptions) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages, stream: true }),
        signal: opts?.signal,
      });
      await assertOk(res, "OpenAI");

      for await (const line of iterateLines(res)) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") return;
        if (!data) continue;
        const json = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) onChunk(delta);
      }
    },
  };
}
