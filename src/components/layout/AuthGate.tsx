import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * ルートツリー全体をラップし、Web版で未ログインなら /login へリダイレクトする。
 * デスクトップ版では window.api.auth.me() が常に固定ユーザーを返すため、実質的に
 * 一瞬 "loading" を経て即座に通過する。
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status, checkAuth } = useAuthStore();

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  if (status === "loading") {
    return <div className="flex h-screen w-screen items-center justify-center bg-neutral-100 dark:bg-neutral-950" />;
  }
  if (status === "anonymous") {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
