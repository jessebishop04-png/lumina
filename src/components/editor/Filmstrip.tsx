"use client";

import { useEffect, useRef } from "react";
import { ACCEPTED_IMAGE_EXTENSIONS, ACCEPTED_IMAGE_TYPES } from "@/lib/constants/exportPresets";
import { FilmstripGeneratingSlot } from "@/components/editor/ImagineGeneratingIndicator";
import { useEditorStore } from "@/lib/store/editorStore";

export function Filmstrip() {
  const project = useEditorStore((s) => s.project);
  const setActiveImage = useEditorStore((s) => s.setActiveImage);
  const setEditorModule = useEditorStore((s) => s.setEditorModule);
  const addImageToProject = useEditorStore((s) => s.addImageToProject);
  const imagineGenerating = useEditorStore((s) => s.imagineGenerating);
  const imagineSourceImageId = useEditorStore((s) => s.imagineSourceImageId);
  const fileRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [project?.activeImageId]);

  if (!project) return null;

  return (
    <div
      style={{
        height: 88,
        minHeight: 88,
        background: "var(--color-surface-panel)",
        borderTop: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: 8,
        overflowX: "auto",
        flexShrink: 0,
      }}
    >
      {project.images.map((img) => {
        const isActive = project.activeImageId === img.id;
        return (
          <span key={img.id} style={{ display: "contents" }}>
            <button
              ref={isActive ? activeRef : undefined}
              onClick={() => {
                setActiveImage(img.id);
                setEditorModule("edit");
              }}
              type="button"
              style={{
                flexShrink: 0,
                width: 68,
                height: 68,
                borderRadius: 4,
                overflow: "hidden",
                border: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
                opacity: isActive ? 1 : 0.55,
                padding: 0,
                cursor: "pointer",
                transition: "opacity 0.15s",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.thumbnailDataUrl} alt={img.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
            {img.id === imagineSourceImageId && imagineGenerating && <FilmstripGeneratingSlot />}
          </span>
        );
      })}

      <button
        onClick={() => fileRef.current?.click()}
        type="button"
        style={{
          flexShrink: 0,
          width: 68,
          height: 68,
          borderRadius: 4,
          border: "1px dashed var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-secondary)",
          fontSize: 24,
          background: "var(--color-surface)",
        }}
      >
        +
      </button>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_IMAGE_EXTENSIONS}
        style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f && ACCEPTED_IMAGE_TYPES.includes(f.type)) await addImageToProject(f);
        }}
      />
    </div>
  );
}
