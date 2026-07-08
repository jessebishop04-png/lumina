"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { useCanvasLayout } from "@/lib/hooks/useCanvasLayout";
import { useEditorStore } from "@/lib/store/editorStore";

interface CanvasViewportProps {
  imageId?: string;
  originalDataUrl?: string;
  rotation?: number;
  imageUrl?: string | null;
  alt: string;
  children?: ReactNode;
  overlay?: ReactNode;
  cursor?: string;
  disablePan?: boolean;
  onImagePointerDown?: (e: React.PointerEvent) => void;
  onImagePointerMove?: (e: React.PointerEvent) => void;
  onImagePointerUp?: (e: React.PointerEvent) => void;
}

export function CanvasViewport({
  imageId,
  originalDataUrl,
  rotation = 0,
  imageUrl,
  alt,
  children,
  overlay,
  cursor = "grab",
  disablePan = false,
  onImagePointerDown,
  onImagePointerMove,
  onImagePointerUp,
}: CanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasView = useEditorStore((s) => s.canvasView);
  const setCanvasView = useEditorStore((s) => s.setCanvasView);
  const layout = useCanvasLayout(imageId, originalDataUrl, rotation, containerRef);
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      setCanvasView({
        zoom: Math.max(0.25, Math.min(4, canvasView.zoom + (e.deltaY > 0 ? -0.08 : 0.08))),
        fitToScreen: false,
      });
    },
    [canvasView.zoom, setCanvasView]
  );

  const displayUrl = imageUrl ?? originalDataUrl;

  return (
    <div
      ref={containerRef}
      className="lr-canvas-bg"
      style={{
        flex: 1,
        minWidth: 0,
        position: "relative",
        overflow: "hidden",
        cursor: panning ? "grabbing" : cursor,
      }}
      onWheel={onWheel}
      onMouseDown={(e) => {
        if (e.button !== 0 || onImagePointerDown || disablePan) return;
        setPanning(true);
        setPanStart({ x: e.clientX - canvasView.panX, y: e.clientY - canvasView.panY });
      }}
      onMouseMove={(e) => {
        if (panning) {
          setCanvasView({
            panX: e.clientX - panStart.x,
            panY: e.clientY - panStart.y,
            fitToScreen: false,
          });
        }
      }}
      onMouseUp={() => setPanning(false)}
      onMouseLeave={() => setPanning(false)}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {layout && displayUrl && (
          <div
            style={{
              position: "relative",
              width: layout.width,
              height: layout.height,
              flexShrink: 0,
              transform: canvasView.fitToScreen
                ? undefined
                : `translate(${canvasView.panX}px, ${canvasView.panY}px) scale(${canvasView.zoom})`,
              transformOrigin: "center center",
            }}
            onPointerDown={onImagePointerDown}
            onPointerMove={onImagePointerMove}
            onPointerUp={onImagePointerUp}
            onPointerLeave={onImagePointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt={alt}
              draggable={false}
              className="lr-canvas-image"
              style={{
                width: layout.width,
                height: layout.height,
                objectFit: "fill",
                display: "block",
                boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                userSelect: "none",
              }}
            />
            {overlay}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
