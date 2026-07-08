import type { AiProvider, ChatMessage, ChatOptions } from "../types";
import { iterateLines, assertOk } from "../lines";

/** Google Gemini streamGenerateContent API (alt=sse) */
export function createGeminiProvider(apiKey: string, model: string): AiProvider {
  return {
    id: "gemini",
    async chat(messages: ChatMessage[], onChunk, opts?: ChatOptions) {
      const systemInstruction = messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .join("\n\n");
      const contents = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
        }),
        signal: opts?.signal,
      });
      await assertOk(res, "Gemini");

      for await (const line of iterateLines(res)) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (!data) continue;
        const json = JSON.parse(data) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
        if (text) onChunk(text);
      }
    },
  };
}
