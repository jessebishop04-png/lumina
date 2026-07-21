"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { animateThemeTransition, getThemeToggleOrigin } from "@/lib/theme/themeTransition";
import { useThemeStore } from "@/lib/store/themeStore";

function SunIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
    </svg>
  );
}

function applyIconState(
  isDark: boolean,
  refs: {
    iconWrap: HTMLSpanElement;
    sun: HTMLSpanElement;
    moon: HTMLSpanElement;
  },
  animate: boolean,
) {
  const props = {
    iconWrap: { rotate: isDark ? 0 : 180 },
    sun: { opacity: isDark ? 0 : 1, scale: isDark ? 0.72 : 1 },
    moon: { opacity: isDark ? 1 : 0, scale: isDark ? 1 : 0.72 },
  };

  if (animate) {
    gsap.to(refs.iconWrap, { ...props.iconWrap, duration: 0.45, ease: "power2.out" });
    gsap.to(refs.sun, { ...props.sun, duration: 0.4, ease: "power2.out" });
    gsap.to(refs.moon, { ...props.moon, duration: 0.4, ease: "power2.out" });
    return;
  }

  gsap.set(refs.iconWrap, props.iconWrap);
  gsap.set(refs.sun, props.sun);
  gsap.set(refs.moon, props.moon);
}

export function ThemeToggle() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const iconWrapRef = useRef<HTMLSpanElement>(null);
  const sunRef = useRef<HTMLSpanElement>(null);
  const moonRef = useRef<HTMLSpanElement>(null);
  const animatingRef = useRef(false);

  const resolved = useThemeStore((s) => s.resolved);
  const setAppearance = useThemeStore((s) => s.setAppearance);
  const isDark = resolved === "dark";

  useEffect(() => {
    if (animatingRef.current || !iconWrapRef.current || !sunRef.current || !moonRef.current) return;

    applyIconState(isDark, {
      iconWrap: iconWrapRef.current,
      sun: sunRef.current,
      moon: moonRef.current,
    }, false);
  }, [isDark]);

  const toggle = async () => {
    if (animatingRef.current || !buttonRef.current || !iconWrapRef.current || !sunRef.current || !moonRef.current) {
      return;
    }

    const next = isDark ? "light" : "dark";
    const origin = getThemeToggleOrigin(buttonRef.current);

    animatingRef.current = true;
    buttonRef.current.disabled = true;

    applyIconState(!isDark, {
      iconWrap: iconWrapRef.current,
      sun: sunRef.current,
      moon: moonRef.current,
    }, true);

    try {
      await animateThemeTransition(origin, next, () => setAppearance(next));
    } finally {
      animatingRef.current = false;
      if (buttonRef.current) buttonRef.current.disabled = false;
    }
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      className="sidebar-rail-item sidebar-rail-theme-toggle"
      onClick={() => void toggle()}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span className="sidebar-rail-icon-slot">
        <span ref={iconWrapRef} className="theme-toggle-icon-wrap">
          <span ref={moonRef} className="theme-toggle-icon theme-toggle-icon--moon">
            <MoonIcon />
          </span>
          <span ref={sunRef} className="theme-toggle-icon theme-toggle-icon--sun">
            <SunIcon />
          </span>
        </span>
      </span>
      <span className="sidebar-rail-label">{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
