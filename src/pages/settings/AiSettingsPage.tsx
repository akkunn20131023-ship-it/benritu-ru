import { useEffect, useState } from "react";
import { Bot, Sparkles, Cpu, HardDrive, Ban, Check, type LucideIcon } from "lucide-react";
import { AI_DEFAULT_MODELS } from "@shared/types";
import type { AiConfigPublic, AiProviderId } from "@shared/types";

const PROVIDERS: { id: AiProviderId; label: string; icon: LucideIcon; needsKey: boolean }[] = [
  { id: "none", label: "未設定", icon: Ban, needsKey: false },
  { id: "openai", label: "OpenAI", icon: Sparkles, needsKey: true },
  { id: "anthropic", label: "Anthropic", icon: Bot, needsKey: true },
  { id: "gemini", label: "Google Gemini", icon: Cpu, needsKey: true },
  { id: "local", label: "ローカルLLM", icon: HardDrive, needsKey: false },
];

/** AI プロバイダー設定画面。APIキーは main プロセス側で OS のセキュアストレージに暗号化保存される */
export default function AiSettingsPage() {
  const [config, setConfig] = useState<AiConfigPublic | null>(null);
  const [provider, setProvider] = useState<AiProviderId>("none");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("http://localhost:11434");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void window.api.ai.getConfig().then((c) => {
      applyConfig(c);
    });
  }, []);

  function applyConfig(c: AiConfigPublic) {
    setConfig(c);
    setProvider(c.provider);
    setModel(c.model[c.provider] ?? defaultModelFor(c.provider));
    setBaseUrl(c.localBaseUrl);
  }

  function defaultModelFor(p: AiProviderId): string {
    if (p === "openai" || p === "anthropic" || p === "gemini") return AI_DEFAULT_MODELS[p];
    return "";
  }

  function handleProviderChange(next: AiProviderId) {
    setProvider(next);
    setApiKey("");
    setModel(config?.model[next] ?? defaultModelFor(next));
  }

  async function handleSave() {
    await window.api.ai.setProvider(provider, model || undefined);
    if ((provider === "openai" || provider === "anthropic" || provider === "gemini") && apiKey) {
      await window.api.ai.setApiKey(provider, apiKey);
    }
    if (provider === "local") {
      await window.api.ai.setBaseUrl(baseUrl);
    }
    const updated = await window.api.ai.getConfig();
    applyConfig(updated);
    setApiKey("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const needsKey = provider === "openai" || provider === "anthropic" || provider === "gemini";
  const hasExistingKey = needsKey && config?.hasKey[provider];

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-6">
      <div>
        <h1 className="text-xl font-semibold">AI設定</h1>
        <p className="text-sm text-neutral-500">アプリ全体で使う AI プロバイダーを選択し、API キーを設定します。</p>
      </div>

      <section className="glass-panel rounded-xl2 p-5">
        <h2 className="mb-3 text-sm font-semibold">プロバイダー</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleProviderChange(p.id)}
              className={`app-no-drag flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs transition-colors ${
                provider === p.id
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-transparent bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
              }`}
            >
              <p.icon size={18} />
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {provider !== "none" && (
        <section className="glass-panel space-y-4 rounded-xl2 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-500">モデル名</label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={defaultModelFor(provider) || "モデル名"}
              className="app-no-drag w-full rounded-lg bg-black/5 px-3.5 py-2.5 text-sm outline-none dark:bg-white/10"
            />
          </div>

          {needsKey && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">
                API キー {hasExistingKey && <span className="text-accent">(設定済み・変更する場合のみ入力)</span>}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={hasExistingKey ? "••••••••••••" : "API キーを入力"}
                className="app-no-drag w-full rounded-lg bg-black/5 px-3.5 py-2.5 text-sm outline-none dark:bg-white/10"
              />
            </div>
          )}

          {provider === "local" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">エンドポイント (Ollama互換)</label>
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="app-no-drag w-full rounded-lg bg-black/5 px-3.5 py-2.5 text-sm outline-none dark:bg-white/10"
              />
            </div>
          )}

          <button
            onClick={handleSave}
            className="app-no-drag flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            {saved ? <Check size={14} /> : null}
            {saved ? "保存しました" : "保存"}
          </button>
        </section>
      )}
    </div>
  );
}
