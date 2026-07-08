"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useActiveImage, useEditorStore } from "@/lib/store/editorStore";

const PREVIEW_MAX = 560;

export function StudioCanvas() {
  const activeImage = useActiveImage();
  const studio = activeImage?.studio;
  const studioTool = useEditorStore((s) => s.studioTool);
  const studioBrushSize = useEditorStore((s) => s.studioBrushSize);
  const updateStudioState = useEditorStore((s) => s.updateStudioState);
  const containerRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLCanvasElement>(null);
  const paintingRef = useRef(false);
  const [layout, setLayout] = useState({ imgW: 400, imgH: 400, scale: 1 });

  useEffect(() => {
    if (!activeImage) return;
    const img = new Image();
    img.onload = () => {
      const cw = studio?.canvasWidth ?? 1024;
      const ch = studio?.canvasHeight ?? 1024;
      const previewScale = Math.min(PREVIEW_MAX / cw, PREVIEW_MAX / ch, 1);
      const imgScale = studio?.imageScale ?? 1;
      const drawW = img.naturalWidth * imgScale * previewScale * 0.85;
      const drawH = img.naturalHeight * imgScale * previewScale * 0.85;
      setLayout({
        imgW: Math.round(drawW),
        imgH: Math.round(drawH),
        scale: previewScale,
      });
    };
    img.src = activeImage.originalDataUrl;
  }, [activeImage, studio?.canvasWidth, studio?.canvasHeight, studio?.imageScale]);

  useEffect(() => {
    if (!maskRef.current || !studio) return;
    const canvas = maskRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (studio.eraseMaskDataUrl) {
      const m = new Image();
      m.onload = () => ctx.drawImage(m, 0, 0, canvas.width, canvas.height);
      m.src = studio.eraseMaskDataUrl;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [studio?.eraseMaskDataUrl, layout.imgW, layout.imgH]);

  const paint = useCallback(
    (e: React.PointerEvent, erase: boolean) => {
      const canvas = maskRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
      const r = studioBrushSize * scaleX;
      ctx.fillStyle = erase ? "#ffffff" : "#000000";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    },
    [studioBrushSize]
  );

  const commitMask = useCallback(() => {
    const canvas = maskRef.current;
    if (!canvas) return;
    updateStudioState({ eraseMaskDataUrl: canvas.toDataURL("image/png") });
  }, [updateStudioState]);

  const onPanDrag = (edge: "top" | "bottom" | "left" | "right", delta: number) => {
    if (!studio) return;
    const d = Math.round(delta / layout.scale);
    if (edge === "top") updateStudioState({ padTop: Math.max(0, studio.padTop + d), canvasHeight: studio.canvasHeight + d });
    if (edge === "bottom") updateStudioState({ padBottom: Math.max(0, studio.padBottom + d), canvasHeight: studio.canvasHeight + d });
    if (edge === "left") updateStudioState({ padLeft: Math.max(0, studio.padLeft + d), canvasWidth: studio.canvasWidth + d });
    if (edge === "right") updateStudioState({ padRight: Math.max(0, studio.padRight + d), canvasWidth: studio.canvasWidth + d });
  };

  if (!activeImage || !studio) {
    return (
      <div className="lr-canvas-bg" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Select a photo for Studio editing</p>
      </div>
    );
  }

  const canvasW = Math.round(studio.canvasWidth * layout.scale);
  const canvasH = Math.round(studio.canvasHeight * layout.scale);
  const padT = Math.round(studio.padTop * layout.scale);
  const padL = Math.round(studio.padLeft * layout.scale);

  const handleStyle = (cursor: string): React.CSSProperties => ({
    position: "absolute",
    background: "var(--color-text-muted)",
    opacity: 0.7,
    cursor,
    zIndex: 4,
  });

  return (
    <div ref={containerRef} className="lr-canvas-bg" style={{ flex: 1, minWidth: 0, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ position: "relative", width: canvasW, height: canvasH, flexShrink: 0 }}>
        {/* Checkerboard */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
            backgroundColor: "#2a2a2a",
            borderRadius: 4,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: padL + (studio.offsetX * layout.scale),
            top: padT + (studio.offsetY * layout.scale),
            width: layout.imgW,
            height: layout.imgH,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImage.originalDataUrl}
            alt=""
            draggable={studioTool === "move"}
            style={{ width: "100%", height: "100%", display: "block", pointerEvents: studioTool === "move" ? "auto" : "none" }}
            onMouseDown={(e) => {
              if (studioTool !== "move") return;
              const startX = e.clientX;
              const startY = e.clientY;
              const ox = studio.offsetX;
              const oy = studio.offsetY;
              const onMove = (ev: MouseEvent) => {
                updateStudioState({
                  offsetX: ox + (ev.clientX - startX) / layout.scale,
                  offsetY: oy + (ev.clientY - startY) / layout.scale,
                });
              };
              const onUp = () => {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
              };
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            }}
          />

          {(studioTool === "erase" || studioTool === "restore") && (
            <canvas
              ref={maskRef}
              width={512}
              height={512}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                opacity: 0.5,
                mixBlendMode: "multiply",
                cursor: "crosshair",
              }}
              onPointerDown={(e) => {
                paintingRef.current = true;
                (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
                paint(e, studioTool === "erase");
              }}
              onPointerMove={(e) => {
                if (paintingRef.current) paint(e, studioTool === "erase");
              }}
              onPointerUp={() => {
                paintingRef.current = false;
                commitMask();
              }}
            />
          )}
        </div>

        {/* Pan handles (Midjourney gray bars) */}
        {["top", "bottom", "left", "right"].map((edge) => {
          const isVert = edge === "top" || edge === "bottom";
          return (
            <div
              key={edge}
              style={{
                ...handleStyle(isVert ? "ns-resize" : "ew-resize"),
                ...(edge === "top" && { top: -6, left: "50%", transform: "translateX(-50%)", width: 48, height: 6, borderRadius: 3 }),
                ...(edge === "bottom" && { bottom: -6, left: "50%", transform: "translateX(-50%)", width: 48, height: 6, borderRadius: 3 }),
                ...(edge === "left" && { left: -6, top: "50%", transform: "translateY(-50%)", width: 6, height: 48, borderRadius: 3 }),
                ...(edge === "right" && { right: -6, top: "50%", transform: "translateY(-50%)", width: 6, height: 48, borderRadius: 3 }),
              }}
              onMouseDown={(e) => {
                const start = isVert ? e.clientY : e.clientX;
                const onMove = (ev: MouseEvent) => {
                  const delta = (isVert ? ev.clientY - start : ev.clientX - start) * (edge === "top" || edge === "left" ? -1 : 1);
                  onPanDrag(edge as "top" | "bottom" | "left" | "right", delta);
                };
                const onUp = () => {
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
