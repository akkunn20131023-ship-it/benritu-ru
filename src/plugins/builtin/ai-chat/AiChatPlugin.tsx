import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Send, Square, Settings } from "lucide-react";
import type { AiConfigPublic, ChatMessage } from "@shared/types";
import type { PluginModule } from "../../types";

interface DisplayMessage extends ChatMessage {
  id: string;
  streaming?: boolean;
}

function AiChatPage() {
  const [config, setConfig] = useState<AiConfigPublic | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const conversationId = useRef(crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void window.api.ai.getConfig().then(setConfig);
  }, []);

  useEffect(() => {
    const offChunk = window.api.ai.onChunk(({ conversationId: id, delta }) => {
      if (id !== conversationId.current) return;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.role !== "assistant" || !last.streaming) return prev;
        return [...prev.slice(0, -1), { ...last, content: last.content + delta }];
      });
    });
    const offDone = window.api.ai.onDone(({ conversationId: id }) => {
      if (id !== conversationId.current) return;
      setSending(false);
      setMessages((prev) => prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)));
    });
    const offError = window.api.ai.onError(({ conversationId: id, message }) => {
      if (id !== conversationId.current) return;
      setSending(false);
      setMessages((prev) => [
        ...prev.filter((m) => !m.streaming),
        { id: crypto.randomUUID(), role: "assistant", content: `エラー: ${message}` },
      ]);
    });
    return () => {
      offChunk();
      offDone();
      offError();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const userMsg: DisplayMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantMsg: DisplayMessage = { id: crypto.randomUUID(), role: "assistant", content: "", streaming: true };
    const history = [...messages, userMsg];
    setMessages([...history, assistantMsg]);
    setSending(true);
    await window.api.ai.sendChat(
      conversationId.current,
      history.map(({ role, content }) => ({ role, content }))
    );
  }

  function stop() {
    void window.api.ai.stopChat(conversationId.current);
  }

  if (!config) return null;

  if (config.provider === "none") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <Sparkles size={32} className="text-accent" />
        <p className="text-sm font-medium">AIプロバイダーが未設定です</p>
        <p className="max-w-sm text-xs text-neutral-500">
          OpenAI / Anthropic / Gemini / ローカルLLM のいずれかを設定画面から接続すると、ここでチャットできるようになります。
        </p>
        <Link
          to="/settings/ai"
          className="app-no-drag mt-2 flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <Settings size={14} /> AI設定を開く
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-3">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto rounded-lg glass-panel p-4">
        {messages.length === 0 && <p className="text-sm text-neutral-500">メッセージを送ってAIと会話を始めましょう。</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm ${
                m.role === "user" ? "bg-accent text-white" : "bg-black/5 dark:bg-white/10"
              }`}
            >
              {m.content || (m.streaming ? "…" : "")}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="メッセージを入力..."
          className="app-no-drag flex-1 rounded-lg glass-panel px-4 py-2.5 text-sm outline-none"
        />
        {sending ? (
          <button
            onClick={stop}
            className="app-no-drag flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600"
          >
            <Square size={14} /> 停止
          </button>
        ) : (
          <button
            onClick={send}
            className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            <Send size={14} /> 送信
          </button>
        )}
      </div>
    </div>
  );
}

export const AiChatPlugin: PluginModule = {
  manifest: {
    id: "ai-chat",
    name: "AIチャット",
    version: "0.1.0",
    description: "OpenAI/Anthropic/Gemini/ローカルLLMと対話",
    category: "ai",
    entry: "ai-chat",
  },
  icon: Sparkles,
  Component: AiChatPage,
};
