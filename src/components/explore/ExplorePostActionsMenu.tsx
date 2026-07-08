"use client";

import { useEffect, useRef, useState } from "react";

interface ExplorePostActionsMenuProps {
  onCopyPrompt: () => void;
  onEditCopy: () => void;
  onDownload: () => void;
  copiedPrompt: boolean;
}

export function ExplorePostActionsMenu({ onCopyPrompt, onEditCopy, onDownload, copiedPrompt }: ExplorePostActionsMenuProps) {
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

  return (
    <div ref={rootRef} className="explore-actions-menu" style={{ position: "relative" }}>
      <button
        type="button"
        className="explore-modal-btn"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Actions"
        onClick={() => setOpen((v) => !v)}
      >
        ⋯
      </button>
      {open && (
        <div className="explore-actions-dropdown" role="menu">
          <button type="button" role="menuitem" onClick={() => run(onCopyPrompt)}>
            {copiedPrompt ? "Copied!" : "Copy prompt"}
          </button>
          <button type="button" role="menuitem" onClick={() => run(onEditCopy)}>
            Edit copy in Lumina
          </button>
          <button type="button" role="menuitem" onClick={() => run(onDownload)}>
            Download
          </button>
        </div>
      )}
    </div>
  );
}
