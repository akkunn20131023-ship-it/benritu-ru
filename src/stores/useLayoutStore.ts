import { create } from "zustand";

interface LayoutState {
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  /** スマホ幅でのドロワー型サイドバーの開閉 (md未満でのみ使用) */
  mobileNavOpen: boolean;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
}

/** サイドバー開閉・コマンドパレット表示など UI シェルの状態管理 */
export const useLayoutStore = create<LayoutState>((set) => ({
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  mobileNavOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
}));
