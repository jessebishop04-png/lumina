import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Appearance = "dark" | "light" | "system";

interface ThemeState {
  appearance: Appearance;
  resolved: "dark" | "light";
  setAppearance: (appearance: Appearance) => void;
  setResolved: (resolved: "dark" | "light") => void;
}

export function resolveAppearance(appearance: Appearance): "dark" | "light" {
  if (appearance === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return appearance;
}

export function applyThemeToDocument(resolved: "dark" | "light") {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.style.colorScheme = resolved;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      appearance: "dark",
      resolved: "dark",
      setAppearance: (appearance) => {
        const resolved = resolveAppearance(appearance);
        applyThemeToDocument(resolved);
        set({ appearance, resolved });
      },
      setResolved: (resolved) => {
        applyThemeToDocument(resolved);
        set({ resolved });
      },
    }),
    {
      name: "lumina-appearance",
      partialize: (state) => ({ appearance: state.appearance }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = resolveAppearance(state.appearance);
          applyThemeToDocument(resolved);
          state.resolved = resolved;
        }
      },
    }
  )
);
