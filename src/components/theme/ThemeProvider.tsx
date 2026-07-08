"use client";

import { useEffect } from "react";
import { applyThemeToDocument, resolveAppearance, useThemeStore } from "@/lib/store/themeStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const appearance = useThemeStore((s) => s.appearance);
  const setResolved = useThemeStore((s) => s.setResolved);

  useEffect(() => {
    const resolved = resolveAppearance(appearance);
    applyThemeToDocument(resolved);
    setResolved(resolved);

    if (appearance !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = resolveAppearance("system");
      applyThemeToDocument(next);
      setResolved(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [appearance, setResolved]);

  return children;
}
