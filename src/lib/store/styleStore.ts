import { create } from "zustand";
import { getLikedStyleIds, setLikedStyleIds } from "@/lib/storage/styleLikesStorage";

interface StyleState {
  likedStyleIds: Set<string>;
  filterTab: "all" | "liked";
  loadLikes: () => void;
  toggleStyleLike: (styleId: string) => void;
  setFilterTab: (tab: "all" | "liked") => void;
  isStyleLiked: (styleId: string) => boolean;
}

export const useStyleStore = create<StyleState>((set, get) => ({
  likedStyleIds: new Set(),
  filterTab: "all",

  loadLikes: () => {
    set({ likedStyleIds: getLikedStyleIds() });
  },

  toggleStyleLike: (styleId) => {
    const liked = new Set(get().likedStyleIds);
    if (liked.has(styleId)) {
      liked.delete(styleId);
    } else {
      liked.add(styleId);
    }
    setLikedStyleIds(liked);
    set({ likedStyleIds: liked });
  },

  setFilterTab: (tab) => set({ filterTab: tab }),

  isStyleLiked: (styleId) => get().likedStyleIds.has(styleId),
}));
