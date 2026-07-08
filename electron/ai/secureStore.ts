import Store from "electron-store";
import { safeStorage } from "electron";
import type { AiConfigPublic, AiProviderId } from "../../shared/types";

type SecretProvider = "openai" | "anthropic" | "gemini";

interface AiConfigInternal {
  provider: AiProviderId;
  model: Partial<Record<AiProviderId, string>>;
  encryptedKeys: Partial<Record<SecretProvider, string>>;
  localBaseUrl: string;
}

/** AI設定・APIキーの永続化。キーは OS のセキュアストレージ(DPAPI等)で暗号化してから保存する */
const store = new Store<AiConfigInternal>({
  name: "ai-config",
  defaults: { provider: "none", model: {}, encryptedKeys: {}, localBaseUrl: "http://localhost:11434" },
});

function encrypt(raw: string): string {
  if (!safeStorage.isEncryptionAvailable()) return Buffer.from(raw, "utf-8").toString("base64");
  return safeStorage.encryptString(raw).toString("base64");
}

function decrypt(encoded: string): string {
  const buf = Buffer.from(encoded, "base64");
  if (!safeStorage.isEncryptionAvailable()) return buf.toString("utf-8");
  return safeStorage.decryptString(buf);
}

function getPublic(): AiConfigPublic {
  const s = store.store;
  return {
    provider: s.provider,
    model: s.model,
    localBaseUrl: s.localBaseUrl,
    hasKey: {
      openai: !!s.encryptedKeys.openai,
      anthropic: !!s.encryptedKeys.anthropic,
      gemini: !!s.encryptedKeys.gemini,
    },
  };
}

export const aiConfigStore = {
  getPublic,

  setProvider(provider: AiProviderId, model?: string): AiConfigPublic {
    store.set("provider", provider);
    if (model) store.set(`model.${provider}`, model);
    return getPublic();
  },

  setApiKey(provider: SecretProvider, key: string): AiConfigPublic {
    const encryptedKeys = { ...store.get("encryptedKeys") };
    if (key) encryptedKeys[provider] = encrypt(key);
    else delete encryptedKeys[provider];
    store.set("encryptedKeys", encryptedKeys);
    return getPublic();
  },

  setLocalBaseUrl(baseUrl: string): AiConfigPublic {
    store.set("localBaseUrl", baseUrl);
    return getPublic();
  },

  /** 実際に API 呼び出しを行う main プロセス内部でのみ使用する。renderer には絶対に渡さないこと */
  getInternal() {
    const s = store.store;
    return {
      provider: s.provider,
      openaiKey: s.encryptedKeys.openai ? decrypt(s.encryptedKeys.openai) : undefined,
      anthropicKey: s.encryptedKeys.anthropic ? decrypt(s.encryptedKeys.anthropic) : undefined,
      geminiKey: s.encryptedKeys.gemini ? decrypt(s.encryptedKeys.gemini) : undefined,
      model: s.model,
      localBaseUrl: s.localBaseUrl,
    };
  },
};
