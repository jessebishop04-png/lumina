"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ACCEPTED_IMAGE_EXTENSIONS, ACCEPTED_IMAGE_TYPES } from "@/lib/constants/exportPresets";
import { useEditorStore } from "@/lib/store/editorStore";
import type { ProjectSummary } from "@/lib/types";

const MIN_COL_WIDTH = 120;
const MAX_COL_WIDTH = 320;

function ProjectPhoto({ project, onOpen }: { project: ProjectSummary; onOpen: () => void }) {
  const src = project.previewDataUrl ?? project.thumbnailDataUrl;
  if (!src) return null;
  return (
    <button
      onClick={onOpen}
      style={{ breakInside: "avoid", marginBottom: 2, padding: 0, border: "none", cursor: "pointer", display: "block", width: "100%" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={project.name}
        loading="lazy"
        decoding="async"
        style={{
          width: "100%",
          display: "block",
          borderRadius: 1,
          background: "var(--color-surface-input)",
          imageRendering: "auto",
        }}
      />
    </button>
  );
}

interface LibraryGridProps {
  fileRef: React.RefObject<HTMLInputElement | null>;
}

export function LibraryGrid({ fileRef }: LibraryGridProps) {
  const router = useRouter();
  const { recentProjects, loadRecentProjects } = useEditorStore();
  const [gridSize, setGridSize] = useState(180);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const schedule = () => loadRecentProjects();
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(schedule);
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(schedule, 0);
    return () => clearTimeout(id);
  }, [loadRecentProjects]);

  const totalPhotos = recentProjects.reduce((n, p) => n + p.imageCount, 0);
  const query = search.trim().toLowerCase();

  const filteredProjects = recentProjects.filter(
    (p) => !query || p.name.toLowerCase().includes(query)
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--color-surface)", minWidth: 0 }}>
      <header
        style={{
          height: 52,
          minHeight: 52,
          background: "var(--color-surface-panel)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 16,
        }}
      >
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, margin: 0, color: "var(--color-text-primary)", whiteSpace: "nowrap" }}>
          All Photos
        </h1>

        <div style={{ flex: 1, maxWidth: 420, position: "relative" }}>
          <svg
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)" }}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search photos"
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              background: "var(--color-surface-input)",
              border: "1px solid transparent",
              borderRadius: 8,
              color: "var(--color-text-primary)",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => fileRef.current?.click()}
          style={{
            padding: "7px 16px",
            background: "var(--color-surface-panel)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          Add photos
        </button>
      </header>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 16px" }}>
        {filteredProjects.length > 0 ? (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>Your photos</h2>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{filteredProjects.length} projects</span>
            </div>
            <div style={{ columnCount: Math.max(2, Math.floor(800 / gridSize)), columnGap: 2 }}>
              {filteredProjects.map((p) => (
                <ProjectPhoto key={p.id} project={p} onOpen={() => router.push(`/editor/${p.id}`)} />
              ))}
            </div>
          </section>
        ) : (
          <div style={{ textAlign: "center", padding: "64px 24px", maxWidth: 420, margin: "0 auto" }}>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>
              {query ? "No photos match your search" : "No photos yet"}
            </p>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6, margin: "0 0 20px" }}>
              {query ? "Try a different search term." : "Upload a photo or create something in Explore to get started."}
            </p>
            {!query && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "none",
                  background: "var(--color-accent)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Add photos
              </button>
            )}
          </div>
        )}
      </div>

      <footer
        style={{
          height: 44,
          borderTop: "1px solid var(--color-border)",
          background: "var(--color-surface-panel)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: "var(--color-surface-input)",
              color: "var(--color-text-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Grid view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setGridSize((s) => Math.max(MIN_COL_WIDTH, s - 20))} style={{ color: "var(--color-text-secondary)", fontSize: 18 }} type="button">
            −
          </button>
          <input
            type="range"
            min={MIN_COL_WIDTH}
            max={MAX_COL_WIDTH}
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            style={{ width: 140 }}
          />
          <button onClick={() => setGridSize((s) => Math.min(MAX_COL_WIDTH, s + 20))} style={{ color: "var(--color-text-secondary)", fontSize: 18 }} type="button">
            +
          </button>
        </div>

        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{totalPhotos} photos</span>
      </footer>
    </div>
  );
}

export function usePhotoUpload() {
  const router = useRouter();
  const createProjectFromFile = useEditorStore((s) => s.createProjectFromFile);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return;
      setIsUploading(true);
      try {
        const id = await createProjectFromFile(file);
        router.push(`/editor/${id}`);
      } finally {
        setIsUploading(false);
      }
    },
    [createProjectFromFile, router]
  );

  const uploadInput = (
    <input
      ref={fileRef}
      type="file"
      accept={ACCEPTED_IMAGE_EXTENSIONS}
      style={{ display: "none" }}
      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
    />
  );

  const uploadingOverlay = isUploading ? (
    <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto 12px" }} />
        <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>Preparing photo…</p>
      </div>
    </div>
  ) : null;

  return { fileRef, uploadInput, uploadingOverlay, openUpload: () => fileRef.current?.click() };
}
