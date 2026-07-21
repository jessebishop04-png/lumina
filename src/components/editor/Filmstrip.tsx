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
    <div className="editor-filmstrip">
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
              className={`editor-filmstrip-thumb${isActive ? " is-active" : ""}`}
            >
              {img.mediaType === "video" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.thumbnailDataUrl} alt={img.name} />
                  <span className="editor-filmstrip-video-badge" aria-hidden>
                    ▶
                  </span>
                </>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={img.thumbnailDataUrl} alt={img.name} />
              )}
            </button>
            {img.id === imagineSourceImageId && imagineGenerating && <FilmstripGeneratingSlot />}
          </span>
        );
      })}

      <button
        onClick={() => fileRef.current?.click()}
        type="button"
        className="editor-filmstrip-add"
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
