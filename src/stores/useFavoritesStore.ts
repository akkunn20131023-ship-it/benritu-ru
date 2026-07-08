import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  favoriteIds: string[];
  toggleFavorite: (featureId: string) => void;
  isFavorite: (featureId: string) => boolean;
}

/** お気に入り機能登録。頻繁な読み書きではないため localStorage への永続化で十分 */
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      toggleFavorite: (featureId) =>
        set((s) => ({
          favoriteIds: s.favoriteIds.includes(featureId)
            ? s.favoriteIds.filter((id) => id !== featureId)
            : [...s.favoriteIds, featureId],
        })),
      isFavorite: (featureId) => get().favoriteIds.includes(featureId),
    }),
    { name: "omnisuite-favorites" }
  )
);
