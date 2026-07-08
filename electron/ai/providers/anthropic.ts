import type { AiProvider, ChatMessage, ChatOptions } from "../types";
import { iterateLines, assertOk } from "../lines";

/** Anthropic Messages API (stream: true, SSE)。system は独立フィールドとして渡す */
export function createAnthropicProvider(apiKey: string, model: string): AiProvider {
  return {
    id: "anthropic",
    async chat(messages: ChatMessage[], onChunk, opts?: ChatOptions) {
      const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
      const conversation = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          stream: true,
          ...(system ? { system } : {}),
          messages: conversation,
        }),
        signal: opts?.signal,
      });
      await assertOk(res, "Anthropic");

      for await (const line of iterateLines(res)) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (!data) continue;
        const json = JSON.parse(data) as {
          type?: string;
          delta?: { type?: string; text?: string };
        };
        if (json.type === "content_block_delta" && json.delta?.type === "text_delta" && json.delta.text) {
          onChunk(json.delta.text);
        }
        if (json.type === "message_stop") return;
      }
    },
  };
}
