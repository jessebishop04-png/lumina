"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CropRect } from "@/lib/types";
import { DEFAULT_CROP } from "@/lib/types";
import { CanvasViewport } from "@/components/editor/CanvasViewport";
import { useActiveImage, useEditorStore } from "@/lib/store/editorStore";

type Handle = "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

const MIN_SIZE = 0.05;

function clampCrop(crop: CropRect): CropRect {
  const x = Math.max(0, Math.min(1 - MIN_SIZE, crop.x));
  const y = Math.max(0, Math.min(1 - MIN_SIZE, crop.y));
  const width = Math.max(MIN_SIZE, Math.min(1 - x, crop.width));
  const height = Math.max(MIN_SIZE, Math.min(1 - y, crop.height));
  return { x, y, width, height };
}

export function CropCanvas() {
  const activeImage = useActiveImage();
  const setCrop = useEditorStore((s) => s.setCrop);
  const crop = activeImage?.crop ?? DEFAULT_CROP;
  const boxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ handle: Handle; startCrop: CropRect; startX: number; startY: number } | null>(
    null
  );
  const [localCrop, setLocalCrop] = useState<CropRect | null>(null);
  const displayCrop = localCrop ?? crop;

  const onPointerMove = useCallback((clientX: number, clientY: number) => {
    const drag = dragRef.current;
    const el = boxRef.current?.parentElement;
    if (!drag || !el) return;
    const rect = el.getBoundingClientRect();
    const dx = (clientX - drag.startX) / rect.width;
    const dy = (clientY - drag.startY) / rect.height;
    const s = drag.startCrop;
    const next = { ...s };

    switch (drag.handle) {
      case "move":
        next.x = s.x + dx;
        next.y = s.y + dy;
        break;
      case "nw":
        next.x = s.x + dx;
        next.y = s.y + dy;
        next.width = s.width - dx;
        next.height = s.height - dy;
        break;
      case "ne":
        next.y = s.y + dy;
        next.width = s.width + dx;
        next.height = s.height - dy;
        break;
      case "sw":
        next.x = s.x + dx;
        next.width = s.width - dx;
        next.height = s.height + dy;
        break;
      case "se":
        next.width = s.width + dx;
        next.height = s.height + dy;
        break;
      case "n":
        next.y = s.y + dy;
        next.height = s.height - dy;
        break;
      case "s":
        next.height = s.height + dy;
        break;
      case "w":
        next.x = s.x + dx;
        next.width = s.width - dx;
        break;
      case "e":
        next.width = s.width + dx;
        break;
    }

    setLocalCrop(clampCrop(next));
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => onPointerMove(e.clientX, e.clientY);
    const onUp = () => {
      if (localCrop) {
        setCrop(localCrop);
        setLocalCrop(null);
      }
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [localCrop, onPointerMove, setCrop]);

  const startDrag = (e: React.PointerEvent, handle: Handle) => {
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = { handle, startCrop: displayCrop, startX: e.clientX, startY: e.clientY };
  };

  if (!activeImage) {
    return (
      <div
        className="lr-canvas-bg"
        style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <p style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Select a photo to crop</p>
      </div>
    );
  }

  const pct = (v: number) => `${v * 100}%`;
  const handleStyle = (cursor: string): React.CSSProperties => ({
    position: "absolute",
    width: 10,
    height: 10,
    background: "var(--color-surface-panel)",
    border: "2px solid var(--color-accent)",
    borderRadius: 2,
    cursor,
    zIndex: 3,
  });

  return (
    <CanvasViewport
      imageId={activeImage.id}
      originalDataUrl={activeImage.originalDataUrl}
      rotation={activeImage.rotation}
      imageUrl={activeImage.originalDataUrl}
      alt={activeImage.name}
      cursor="default"
      disablePan
      overlay={
        <div ref={boxRef} style={{ position: "absolute", inset: 0 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--color-overlay)",
              clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${pct(displayCrop.x)} ${pct(displayCrop.y)}, ${pct(displayCrop.x)} ${pct(displayCrop.y + displayCrop.height)}, ${pct(displayCrop.x + displayCrop.width)} ${pct(displayCrop.y + displayCrop.height)}, ${pct(displayCrop.x + displayCrop.width)} ${pct(displayCrop.y)}, ${pct(displayCrop.x)} ${pct(displayCrop.y)})`,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: pct(displayCrop.x),
              top: pct(displayCrop.y),
              width: pct(displayCrop.width),
              height: pct(displayCrop.height),
              border: "2px solid var(--color-accent)",
              cursor: "move",
            }}
            onPointerDown={(e) => startDrag(e, "move")}
          >
            {(["nw", "ne", "sw", "se", "n", "s", "e", "w"] as Handle[]).map((h) => {
              const pos: Record<Handle, React.CSSProperties> = {
                nw: { left: -5, top: -5, cursor: "nwse-resize" },
                ne: { right: -5, top: -5, cursor: "nesw-resize" },
                sw: { left: -5, bottom: -5, cursor: "nesw-resize" },
                se: { right: -5, bottom: -5, cursor: "nwse-resize" },
                n: { left: "50%", top: -5, transform: "translateX(-50%)", cursor: "ns-resize" },
                s: { left: "50%", bottom: -5, transform: "translateX(-50%)", cursor: "ns-resize" },
                w: { top: "50%", left: -5, transform: "translateY(-50%)", cursor: "ew-resize" },
                e: { top: "50%", right: -5, transform: "translateY(-50%)", cursor: "ew-resize" },
                move: {},
              };
              return (
                <div
                  key={h}
                  style={{ ...handleStyle(pos[h].cursor as string), ...pos[h] }}
                  onPointerDown={(e) => startDrag(e, h)}
                />
              );
            })}
          </div>
        </div>
      }
    />
  );
}
