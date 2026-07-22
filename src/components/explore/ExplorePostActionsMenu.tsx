"use client";

import { useEffect, useRef, useState } from "react";

interface ExplorePostActionsMenuProps {
  onCopyPrompt: () => void;
  onEditCopy?: () => void;
  onAnimate?: () => void;
  onDownload: () => void;
  copiedPrompt: boolean;
  animateDisabled?: boolean;
  variant?: "default" | "header";
}

function DotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <circle cx="3" cy="9" r="1.5" fill="currentColor" />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" />
      <circle cx="15" cy="9" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function ExplorePostActionsMenu({
  onCopyPrompt,
  onEditCopy,
  onAnimate,
  onDownload,
  copiedPrompt,
  animateDisabled = false,
  variant = "default",
}: ExplorePostActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  const isHeader = variant === "header";

  return (
    <div ref={rootRef} className={`explore-actions-menu${isHeader ? " explore-actions-menu--header" : ""}`}>
      <button
        type="button"
        className={isHeader ? "explore-modal-menu-btn" : "explore-modal-btn"}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Actions"
        onClick={() => setOpen((v) => !v)}
      >
        {isHeader ? <DotsIcon /> : "⋯"}
      </button>
      {open && (
        <div className={`explore-actions-dropdown${isHeader ? " explore-actions-dropdown--header" : ""}`} role="menu">
          <button type="button" role="menuitem" onClick={() => run(onCopyPrompt)}>
            {copiedPrompt ? "Copied!" : "Copy prompt"}
          </button>
          {onEditCopy && (
            <button type="button" role="menuitem" onClick={() => run(onEditCopy)}>
              Edit
            </button>
          )}
          {onAnimate && (
            <button type="button" role="menuitem" disabled={animateDisabled} onClick={() => run(onAnimate)}>
              Animate image
            </button>
          )}
          <button type="button" role="menuitem" onClick={() => run(onDownload)}>
            Download
          </button>
        </div>
      )}
    </div>
  );
}
