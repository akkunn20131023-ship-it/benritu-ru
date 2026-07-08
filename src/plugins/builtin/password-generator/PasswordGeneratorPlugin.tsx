import { useState } from "react";
import { KeyRound, Copy, RefreshCw, Check } from "lucide-react";
import { usePluginStore } from "../../usePluginStore";
import type { PluginModule } from "../../types";

const PLUGIN_ID = "password-generator";

interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

const DEFAULT_OPTIONS: PasswordOptions = { length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true };

const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}",
};

function generatePassword(opts: PasswordOptions): string {
  const pool = (Object.keys(CHARSETS) as (keyof typeof CHARSETS)[]).filter((k) => opts[k]).map((k) => CHARSETS[k]);
  const chars = pool.join("");
  if (!chars) return "";
  const randomValues = new Uint32Array(opts.length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (v) => chars[v % chars.length]).join("");
}

function strengthOf(opts: PasswordOptions): { label: string; color: string } {
  const varietyCount = [opts.uppercase, opts.lowercase, opts.numbers, opts.symbols].filter(Boolean).length;
  const score = varietyCount * opts.length;
  if (score >= 60) return { label: "非常に強い", color: "text-green-500" };
  if (score >= 40) return { label: "強い", color: "text-accent" };
  if (score >= 20) return { label: "普通", color: "text-amber-500" };
  return { label: "弱い", color: "text-red-500" };
}

function PasswordGeneratorPage() {
  const [options, setOptions, loaded] = usePluginStore<PasswordOptions>(PLUGIN_ID, "options", DEFAULT_OPTIONS);
  const [password, setPassword] = useState(() => generatePassword(DEFAULT_OPTIONS));
  const [copied, setCopied] = useState(false);

  function regenerate(next: PasswordOptions = options) {
    setPassword(generatePassword(next));
    setCopied(false);
  }

  function updateOption<K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) {
    const next = { ...options, [key]: value };
    setOptions(next);
    regenerate(next);
  }

  async function copy() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!loaded) return null;

  const strength = strengthOf(options);

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col gap-5 pt-6">
      <div className="glass-panel flex items-center gap-2 rounded-xl2 p-4">
        <p className="flex-1 truncate font-mono text-lg">{password}</p>
        <button onClick={() => regenerate()} className="app-no-drag rounded-md p-2 hover:bg-black/5 dark:hover:bg-white/10" title="再生成">
          <RefreshCw size={16} />
        </button>
        <button onClick={copy} className="app-no-drag rounded-md p-2 hover:bg-black/5 dark:hover:bg-white/10" title="コピー">
          {copied ? <Check size={16} className="text-accent" /> : <Copy size={16} />}
        </button>
      </div>

      <p className={`text-sm font-medium ${strength.color}`}>強度: {strength.label}</p>

      <div className="glass-panel space-y-4 rounded-xl2 p-5">
        <label className="flex items-center justify-between text-sm">
          <span>文字数: {options.length}</span>
          <input
            type="range"
            min={6}
            max={64}
            value={options.length}
            onChange={(e) => updateOption("length", Number(e.target.value))}
            className="app-no-drag w-48"
          />
        </label>
        {(
          [
            ["uppercase", "大文字 (A-Z)"],
            ["lowercase", "小文字 (a-z)"],
            ["numbers", "数字 (0-9)"],
            ["symbols", "記号 (!@#...)"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center justify-between text-sm">
            <span>{label}</span>
            <input
              type="checkbox"
              checked={options[key]}
              onChange={(e) => updateOption(key, e.target.checked)}
              className="app-no-drag h-4 w-4 accent-accent"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export const PasswordGeneratorPlugin: PluginModule = {
  manifest: {
    id: "password-generator",
    name: "パスワードジェネレーター",
    version: "0.1.0",
    description: "安全なランダムパスワードを生成",
    category: "life",
    entry: "password-generator",
  },
  icon: KeyRound,
  Component: PasswordGeneratorPage,
};
