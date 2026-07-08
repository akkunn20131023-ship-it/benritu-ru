import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Send, Square, Settings } from "lucide-react";
import type { AiConfigPublic, ChatMessage } from "@shared/types";
import type { PluginModule } from "../../types";

interface DisplayMessage extends ChatMessage {
  id: string;
  streaming?: boolean;
}

const SUBJECTS = ["数学", "英語", "国語", "理科", "社会", "プログラミング", "その他"];

function tutorSystemPrompt(subject: string): string {
  return `あなたは${subject}を教える親切で忍耐強い家庭教師です。生徒の理解度に合わせてわかりやすく説明してください。
答えをすぐに教えるのではなく、ヒントを段階的に与えて生徒自身が気づけるように導いてください。
専門用語を使うときは必ず平易な言葉で補足し、具体例を交えて説明してください。`;
}

function AiTutorPage() {
  const [config, setConfig] = useState<AiConfigPublic | null>(null);
  const [subject, setSubject] = useState(SUBJECTS[0]);
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

  function changeSubject(next: string) {
    setSubject(next);
    setMessages([]);
    conversationId.current = crypto.randomUUID();
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const userMsg: DisplayMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantMsg: DisplayMessage = { id: crypto.randomUUID(), role: "assistant", content: "", streaming: true };
    const history = [...messages, userMsg];
    setMessages([...history, assistantMsg]);
    setSending(true);
    const payload: ChatMessage[] = [
      { role: "system", content: tutorSystemPrompt(subject) },
      ...history.map(({ role, content }) => ({ role, content })),
    ];
    await window.api.ai.sendChat(conversationId.current, payload);
  }

  function stop() {
    void window.api.ai.stopChat(conversationId.current);
  }

  if (!config) return null;

  if (config.provider === "none") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <GraduationCap size={32} className="text-accent" />
        <p className="text-sm font-medium">AIプロバイダーが未設定です</p>
        <p className="max-w-sm text-xs text-neutral-500">AI家庭教師を利用するには設定画面からAIプロバイダーを接続してください。</p>
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
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => changeSubject(s)}
            className={`app-no-drag shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              subject === s ? "bg-accent text-white" : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto rounded-lg glass-panel p-4">
        {messages.length === 0 && (
          <p className="text-sm text-neutral-500">「{subject}」について質問してみましょう。わからないことを気軽に聞いてください。</p>
        )}
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
          placeholder={`${subject}について質問する...`}
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

export const AiTutorPlugin: PluginModule = {
  manifest: {
    id: "ai-tutor",
    name: "AI家庭教師",
    version: "0.1.0",
    description: "科目を選んでAIに質問できる家庭教師チャット",
    category: "study",
    entry: "ai-tutor",
  },
  icon: GraduationCap,
  Component: AiTutorPage,
};
