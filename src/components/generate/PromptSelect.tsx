"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";

gsap.registerPlugin(useGSAP);

export interface PromptSelectOption {
  value: string;
  label: string;
}

interface PromptSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: PromptSelectOption[];
  ariaLabel: string;
}

export function PromptSelect({ value, onChange, options, ariaLabel }: PromptSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const selected = options.find((o) => o.value === value) ?? options[0];
  const showPanel = open && options.length > 0;

  const close = useCallback(() => {
    setOpen(false);
    setHighlightIndex(-1);
  }, []);

  const selectOption = useCallback(
    (next: string) => {
      onChange(next);
      close();
      fieldRef.current?.focus();
    },
    [close, onChange],
  );

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [close, open]);

  useGSAP(
    () => {
      const field = fieldRef.current;
      if (!field) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(field, { clearProps: "boxShadow" });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (open) {
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
    { scope: rootRef, dependencies: [open] },
  );

  useGSAP(
    () => {
      const panel = panelRef.current;
      if (!panel || !showPanel) return;

      const items = panel.querySelectorAll<HTMLElement>(".prompt-select-option");

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set([panel, items], { opacity: 1, y: 0, x: 0, scale: 1 });
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
    { scope: rootRef, dependencies: [showPanel, options] },
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlightIndex(0);
        return;
      }
      setHighlightIndex((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlightIndex(options.length - 1);
        return;
      }
      setHighlightIndex((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlightIndex(options.findIndex((o) => o.value === value));
        return;
      }
      if (highlightIndex >= 0) {
        selectOption(options[highlightIndex].value);
      }
    } else if (e.key === "Escape") {
      close();
    }
  };

  return (
    <div ref={rootRef} className={`prompt-select${open ? " is-open" : ""}`}>
      <button
        ref={fieldRef}
        type="button"
        className="prompt-select-field"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
      >
        <span className="prompt-select-value">{selected?.label}</span>
        <span className="prompt-select-chevron" aria-hidden>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {showPanel && (
        <div ref={panelRef} className="prompt-select-panel" role="listbox" aria-label={ariaLabel}>
          <ul className="prompt-select-options">
            {options.map((option, index) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={`prompt-select-option${option.value === value ? " is-selected" : ""}${index === highlightIndex ? " is-highlighted" : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => selectOption(option.value)}
                >
                  <span className="prompt-select-option-text">{option.label}</span>
                  {option.value === value && (
                    <span className="prompt-select-option-check" aria-hidden>
                      ✓
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
