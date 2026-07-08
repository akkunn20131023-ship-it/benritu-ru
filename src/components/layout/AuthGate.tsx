import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * ルートツリー全体をラップし、Web版では初回アクセス時に自動でブラウザ専用の匿名セッションを
 * 発行してから中身を表示する (ログイン画面は無い)。デスクトップ版では一瞬 "loading" を
 * 経て即座に通過する。
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status, checkAuth } = useAuthStore();

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  if (status === "loading") {
    return <div className="flex h-screen w-screen items-center justify-center bg-neutral-100 dark:bg-neutral-950" />;
  }
  return <>{children}</>;
}
