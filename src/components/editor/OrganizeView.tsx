"use client";

import { useRef } from "react";
import { ACCEPTED_IMAGE_EXTENSIONS, ACCEPTED_IMAGE_TYPES } from "@/lib/constants/exportPresets";
import { useEditorStore } from "@/lib/store/editorStore";

export function OrganizeView() {
  const project = useEditorStore((s) => s.project);
  const setActiveImage = useEditorStore((s) => s.setActiveImage);
  const setEditorModule = useEditorStore((s) => s.setEditorModule);
  const addImageToProject = useEditorStore((s) => s.addImageToProject);
  const renameProject = useEditorStore((s) => s.renameProject);
  const persistProject = useEditorStore((s) => s.persistProject);
  const nameRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!project) return null;

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "var(--color-surface)", minWidth: 0 }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: "var(--color-surface-panel)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--color-border)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <input
            ref={nameRef}
            defaultValue={project.name}
            onBlur={() => {
              const n = nameRef.current?.value.trim();
              if (n && n !== project.name) {
                renameProject(n);
                persistProject();
              }
            }}
            style={{
              background: "transparent",
              border: "none",
              fontFamily: "var(--font-display)",
              fontSize: 18,
              fontWeight: 600,
              color: "var(--color-text-primary)",
              outline: "none",
            }}
          />
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "4px 0 0" }}>
            {project.images.length} photo{project.images.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            padding: "8px 16px",
            background: "var(--color-surface-panel)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Add photos
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

      {project.images.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--color-text-secondary)" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--color-text-primary)", marginBottom: 8 }}>
            No photos in this project
          </p>
          <p style={{ fontSize: 13 }}>Add photos to organize your library</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 2, padding: 2 }}>
          {project.images.map((img) => (
            <button
              key={img.id}
              onClick={() => {
                setActiveImage(img.id);
                setEditorModule("edit");
              }}
              type="button"
              style={{
                aspectRatio: "1",
                overflow: "hidden",
                padding: 0,
                cursor: "pointer",
                outline: project.activeImageId === img.id ? "2px solid var(--color-accent)" : "none",
                outlineOffset: -2,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.thumbnailDataUrl} alt={img.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
