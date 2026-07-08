import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Sparkles, LogIn, UserPlus } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

/** Web版のログイン/新規登録画面。デスクトップ版では認証ゲートが常に通過するため表示されない */
export default function AuthPage() {
  const { status, error, login, signup } = useAuthStore();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (status === "authenticated") return <Navigate to="/" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") await login(email, password);
      else await signup(email, password);
    } catch {
      // エラーは useAuthStore.error に格納済み
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-neutral-100 dark:bg-neutral-950">
      <form onSubmit={submit} className="glass-panel w-full max-w-sm space-y-5 rounded-xl2 p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-white">
            <Sparkles size={20} />
          </div>
          <h1 className="text-lg font-semibold">OmniSuite</h1>
          <p className="text-xs text-neutral-500">{mode === "login" ? "アカウントにログイン" : "アカウントを作成"}</p>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            className="w-full rounded-lg bg-black/5 px-3.5 py-2.5 text-sm outline-none dark:bg-white/10"
          />
          <input
            type="password"
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード (8文字以上)"
            className="w-full rounded-lg bg-black/5 px-3.5 py-2.5 text-sm outline-none dark:bg-white/10"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {mode === "login" ? <LogIn size={14} /> : <UserPlus size={14} />}
          {submitting ? "処理中..." : mode === "login" ? "ログイン" : "登録する"}
        </button>

        <button
          type="button"
          onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
          className="w-full text-center text-xs text-neutral-500 hover:text-accent"
        >
          {mode === "login" ? "アカウントをお持ちでない方はこちら" : "既にアカウントをお持ちの方はこちら"}
        </button>
      </form>
    </div>
  );
}
