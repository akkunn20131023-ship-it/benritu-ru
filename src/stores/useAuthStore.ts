import { create } from "zustand";
import type { AuthUser } from "@shared/types";

interface AuthState {
  status: "loading" | "authenticated";
  user: AuthUser | null;
  checkAuth: () => Promise<void>;
}

/**
 * ログイン画面は無く、ブラウザ単位で自動的にセッションが発行される。
 * 既存の有効なセッションがあればそれを使い、無ければ自動で匿名アカウントを作成する。
 * デスクトップ版では window.api.auth が常に固定ユーザーを返すスタブのため、実質何もしない。
 */
export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  user: null,

  checkAuth: async () => {
    const existing = await window.api.auth.me().catch(() => null);
    if (existing) {
      set({ status: "authenticated", user: existing });
      return;
    }
    const user = await window.api.auth.ensureSession();
    set({ status: "authenticated", user });
  },
}));
