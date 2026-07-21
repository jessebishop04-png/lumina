"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProjectSummary } from "@/lib/types";

gsap.registerPlugin(useGSAP);

const STATIC_SUGGESTIONS = ["Portraits", "Landscapes", "Edits", "Recent"];

function buildSuggestions(projects: ProjectSummary[], query: string): { label: string; type: "project" | "suggested" }[] {
  const q = query.trim().toLowerCase();
  const seen = new Set<string>();
  const results: { label: string; type: "project" | "suggested" }[] = [];

  const add = (label: string, type: "project" | "suggested") => {
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    results.push({ label, type });
  };

  for (const project of projects) {
    if (!q || project.name.toLowerCase().includes(q)) {
      add(project.name, "project");
    }
    if (results.length >= 6) break;
  }

  if (results.length < 4) {
    for (const term of STATIC_SUGGESTIONS) {
      if (!q || term.toLowerCase().includes(q)) {
        add(term, "suggested");
      }
      if (results.length >= 6) break;
    }
  }

  return results.slice(0, 6);
}

interface LibrarySearchProps {
  value: string;
  onChange: (value: string) => void;
  projects: ProjectSummary[];
}

export function LibrarySearch({ value, onChange, projects }: LibrarySearchProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const blurTimeoutRef = useRef<number | null>(null);

  const suggestions = useMemo(() => buildSuggestions(projects, value), [projects, value]);
  const showPanel = focused && suggestions.length > 0;

  const selectSuggestion = useCallback(
    (label: string) => {
      onChange(label);
      setHighlightIndex(-1);
      setFocused(false);
    },
    [onChange],
  );

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      window.clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setFocused(true);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = window.setTimeout(() => {
      setFocused(false);
      setHighlightIndex(-1);
    }, 140);
  };

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) window.clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  useGSAP(
    () => {
      const field = fieldRef.current;
      if (!field) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(field, { clearProps: "boxShadow" });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (focused) {
          gsap.to(field, {
            boxShadow: "0 4px 20px rgba(0, 149, 246, 0.12)",
            duration: 0.28,
            ease: "power2.out",
          });
        } else {
          gsap.to(field, {
            boxShadow: "0 0 0 rgba(0, 149, 246, 0)",
            duration: 0.22,
            ease: "power2.in",
          });
        }
      });

      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [focused] },
  );

  useGSAP(
    () => {
      const panel = panelRef.current;
      if (!panel || !showPanel) return;

      const items = panel.querySelectorAll<HTMLElement>(".library-search-suggestion");

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set([panel, items], { opacity: 1, y: 0, x: 0 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          panel,
          { opacity: 0, y: -6, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.26, ease: "power2.out" },
        );
        if (items.length > 0) {
          gsap.fromTo(
            items,
            { opacity: 0, x: -10 },
            { opacity: 1, x: 0, duration: 0.22, stagger: 0.04, ease: "power2.out", delay: 0.04 },
          );
        }
      });

      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [showPanel, suggestions] },
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPanel) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightIndex].label);
    } else if (e.key === "Escape") {
      setFocused(false);
      setHighlightIndex(-1);
    }
  };

  return (
    <div ref={rootRef} className={`library-search${focused ? " is-focused" : ""}`}>
      <div ref={fieldRef} className="library-search-field">
        <span className="library-search-icon-wrap" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </span>
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setHighlightIndex(-1);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Search photos"
          aria-label="Search photos"
          aria-expanded={showPanel}
          aria-autocomplete="list"
          role="combobox"
        />
        {value && (
          <button
            type="button"
            className="library-search-clear"
            aria-label="Clear search"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange("");
              setHighlightIndex(-1);
            }}
          >
            ✕
          </button>
        )}
      </div>

      {showPanel && (
        <div ref={panelRef} className="library-search-panel" role="listbox">
          {value.trim() ? <p className="library-search-panel-label">Matching</p> : null}
          <ul className="library-search-suggestions">
            {suggestions.map((item, index) => (
              <li key={`${item.type}-${item.label}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === highlightIndex}
                  className={`library-search-suggestion${index === highlightIndex ? " is-highlighted" : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(item.label)}
                >
                  <span className="library-search-suggestion-icon" aria-hidden>
                    {item.type === "project" ? "🖼" : "✦"}
                  </span>
                  <span className="library-search-suggestion-text">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
