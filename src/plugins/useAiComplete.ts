import { useCallback } from "react";
import type { ChatMessage } from "@shared/types";

/**
 * ストリーミングを画面に逐次表示する必要がない一括利用向けのヘルパー。
 * クイズ生成など「まとめて結果が欲しい」ケースで使う (チャットUIには useAi 相当の逐次表示ロジックを別途使う)。
 */
export function useAiComplete() {
  return useCallback((messages: ChatMessage[]): Promise<string> => {
    return new Promise((resolve, reject) => {
      const conversationId = crypto.randomUUID();
      let full = "";

      const cleanup = () => {
        offChunk();
        offDone();
        offError();
      };
      const offChunk = window.api.ai.onChunk(({ conversationId: id, delta }) => {
        if (id === conversationId) full += delta;
      });
      const offDone = window.api.ai.onDone(({ conversationId: id }) => {
        if (id === conversationId) {
          cleanup();
          resolve(full);
        }
      });
      const offError = window.api.ai.onError(({ conversationId: id, message }) => {
        if (id === conversationId) {
          cleanup();
          reject(new Error(message));
        }
      });

      void window.api.ai.sendChat(conversationId, messages);
    });
  }, []);
}

/** AI の応答からコードフェンスやテキストに紛れた JSON オブジェクトを緩く取り出す */
export function parseJsonLoose<T>(text: string): T {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1] : text;
  const braceStart = candidate.indexOf("{");
  const braceEnd = candidate.lastIndexOf("}");
  if (braceStart === -1 || braceEnd === -1) throw new Error("AIの応答からJSONを抽出できませんでした");
  return JSON.parse(candidate.slice(braceStart, braceEnd + 1)) as T;
}
