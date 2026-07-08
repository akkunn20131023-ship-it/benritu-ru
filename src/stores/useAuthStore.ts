import { create } from "zustand";
import type { AuthUser } from "@shared/types";

interface AuthState {
  status: "loading" | "authenticated" | "anonymous";
  user: AuthUser | null;
  error: string | null;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Web版のみ意味を持つ認証状態。デスクトップ版では window.api.auth が常に固定ユーザーを
 * 返すスタブのため、実質的に何もせず即座に "authenticated" になる。
 */
export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  user: null,
  error: null,

  checkAuth: async () => {
    try {
      const user = await window.api.auth.me();
      set({ status: user ? "authenticated" : "anonymous", user, error: null });
    } catch {
      set({ status: "anonymous", user: null });
    }
  },

  login: async (email, password) => {
    set({ error: null });
    try {
      const user = await window.api.auth.login(email, password);
      set({ status: "authenticated", user });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  signup: async (email, password) => {
    set({ error: null });
    try {
      const user = await window.api.auth.signup(email, password);
      set({ status: "authenticated", user });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  logout: async () => {
    await window.api.auth.logout();
    set({ status: "anonymous", user: null });
  },
}));
