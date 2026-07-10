"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditorStore, useActiveImage } from "@/lib/store/editorStore";
import { useGenerationStore } from "@/lib/store/generationStore";

export function EditorActionsMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeImage = useActiveImage();
  const processedImageUrl = useEditorStore((s) => s.processedImageUrl);
  const project = useEditorStore((s) => s.project);
  const setAnimateTarget = useGenerationStore((s) => s.setAnimateTarget);
  const isGenerating = useGenerationStore((s) => s.isGenerating);

  useEffect(() => {
    void fetch("/api/generate/status")
      .then((r) => r.json())
      .then((data: { videoGeneration?: boolean }) => setVideoEnabled(!!data.videoGeneration))
      .catch(() => setVideoEnabled(false));
  }, []);

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

  const imageUrl = processedImageUrl ?? activeImage?.originalDataUrl;

  const animateImage = () => {
    if (!imageUrl) return;
    setAnimateTarget({
      type: "url",
      imageUrl,
      prompt: project?.name ?? "gentle cinematic motion",
      styleId: null,
    });
    setOpen(false);
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `${project?.name ?? "lumina-edit"}.png`;
    a.click();
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="media-actions-menu" style={{ position: "relative" }}>
      <button
        type="button"
        className="media-actions-trigger media-actions-trigger--toolbar"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Editor actions"
        onClick={() => setOpen((v) => !v)}
      >
        ⋯
      </button>
      {open && (
        <div className="media-actions-dropdown media-actions-dropdown--right" role="menu">
          {videoEnabled && (
            <button type="button" role="menuitem" disabled={!imageUrl || isGenerating} onClick={animateImage}>
              Animate image
            </button>
          )}
          <button type="button" role="menuitem" disabled={!imageUrl} onClick={downloadImage}>
            Download
          </button>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); router.push("/generate"); }}>
            Open Create
          </button>
        </div>
      )}
    </div>
  );
}
