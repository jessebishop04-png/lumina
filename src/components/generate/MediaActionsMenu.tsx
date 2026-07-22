"use client";

import { useEffect, useRef, useState } from "react";

interface MediaActionsMenuProps {
  onGenerateVideo?: () => void;
  onDownload: () => void;
  onEdit?: () => void;
  generateVideoDisabled?: boolean;
  align?: "left" | "right";
  overlay?: boolean;
}

export function MediaActionsMenu({
  onGenerateVideo,
  onDownload,
  onEdit,
  generateVideoDisabled = false,
  align = "right",
  overlay = true,
}: MediaActionsMenuProps) {
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
    <div
      ref={rootRef}
      className="media-actions-menu"
      style={
        overlay
          ? { position: "absolute", top: 8, [align === "right" ? "right" : "left"]: 8, zIndex: 3 }
          : { position: "relative", zIndex: 3 }
      }
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={`media-actions-trigger${overlay ? "" : " media-actions-trigger--toolbar"}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Image actions"
        onClick={() => setOpen((v) => !v)}
      >
        ⋯
      </button>
      {open && (
        <div className={`media-actions-dropdown media-actions-dropdown--${align}`} role="menu">
          {onGenerateVideo && (
            <button
              type="button"
              role="menuitem"
              disabled={generateVideoDisabled}
              onClick={() => run(onGenerateVideo)}
            >
              Generate video
            </button>
          )}
          <button type="button" role="menuitem" onClick={() => run(onDownload)}>
            Download
          </button>
          {onEdit && (
            <button type="button" role="menuitem" onClick={() => run(onEdit)}>
              Edit
            </button>
          )}
        </div>
      )}
    </div>
  );
}
