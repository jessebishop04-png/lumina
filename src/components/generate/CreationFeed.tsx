"use client";

import { useRouter } from "next/navigation";
import type { GeneratedImage, GenerationJob } from "@/lib/types/generation";
import { getStyleById } from "@/lib/constants/generationStyles";
import { useGenerationStore } from "@/lib/store/generationStore";
import { useEditorStore } from "@/lib/store/editorStore";
import { ModalPortal } from "@/components/layout/ModalPortal";

function ImageSlot({
  image,
  job,
  index,
  onSelect,
}: {
  image?: GeneratedImage;
  job: GenerationJob;
  index: number;
  onSelect: () => void;
}) {
  const isLoading = job.status === "generating" && !image;
  const filled = job.images.length;
  const showLoader = isLoading && index >= filled;

  return (
    <button
      type="button"
      onClick={image ? onSelect : undefined}
      style={{
        position: "relative",
        aspectRatio: "1",
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-input)",
        padding: 0,
        cursor: image ? "pointer" : "default",
      }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : showLoader ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="spinner" style={{ width: 20, height: 20 }} />
        </div>
      ) : null}
    </button>
  );
}

const actionBtnStyle: React.CSSProperties = {
  padding: "5px 12px",
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 8,
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-panel)",
  color: "var(--color-text-secondary)",
};

function JobActions({ job }: { job: GenerationJob }) {
  const reroll = useGenerationStore((s) => s.reroll);
  const deleteJob = useGenerationStore((s) => s.deleteJob);
  const isGenerating = useGenerationStore((s) => s.isGenerating);

  if (job.status !== "complete") return null;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button type="button" disabled={isGenerating} onClick={() => void reroll(job.id)} style={actionBtnStyle}>
        ↻ Rerun
      </button>
      <button type="button" onClick={() => void deleteJob(job.id)} style={{ ...actionBtnStyle, color: "var(--color-text-muted)" }}>
        Delete
      </button>
    </div>
  );
}

export function GenerationJobCard({ job }: { job: GenerationJob }) {
  const setSelected = useGenerationStore((s) => s.setSelected);
  const slots = job.action === "upscale" ? 1 : 4;
  const style = getStyleById(job.styleId ?? null);

  return (
    <article style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border-subtle)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 14, color: "var(--color-text-primary)", margin: "0 0 4px", lineHeight: 1.4 }}>
            {job.prompt || (job.referenceImageDataUrl ? "Reference image generation" : "")}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
              {new Date(job.createdAt).toLocaleString()} · {job.settings.aspectRatio}
              {job.settings.draft ? " · Draft" : ""}
              {job.action !== "imagine" ? ` · ${job.action}` : ""}
              {style ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  · {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={style.previewUrl}
                    alt=""
                    width={18}
                    height={18}
                    style={{ width: 18, height: 18, borderRadius: 4, objectFit: "cover" }}
                  />
                  {style.label}
                </span>
              ) : (
                ""
              )}
              {job.referenceImageDataUrl ? " · 🖼 Reference" : ""}
            </span>
            {job.status === "generating" && (
              <span style={{ fontSize: 11, color: "var(--color-accent)" }}>{job.progress}%</span>
            )}
            {job.status === "failed" && (
              <span style={{ fontSize: 11, color: "#e74c3c" }}>{job.error ?? "Failed"}</span>
            )}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: slots === 1 ? "1fr" : "1fr 1fr",
            gap: 4,
            maxWidth: slots === 1 ? 360 : 720,
          }}
        >
          {Array.from({ length: slots }).map((_, i) => (
            <ImageSlot
              key={i}
              image={job.images[i]}
              job={job}
              index={i}
              onSelect={() => setSelected(job.id, job.images[i]?.id ?? null)}
            />
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <JobActions job={job} />
        </div>
      </div>
    </article>
  );
}

export function CreationFeed({ embedded = false }: { embedded?: boolean }) {
  const jobs = useGenerationStore((s) => s.jobs);

  if (jobs.length === 0) {
    return (
      <div
        style={
          embedded
            ? { display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px 64px", minHeight: "min(60vh, 480px)" }
            : { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }
        }
      >
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
            Create with Lumina
          </p>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>
            Type a prompt, drop a reference image, or pick a style in the box above. Lumina generates 4 variations — open any image in the photo editor or download it.
          </p>
        </div>
      </div>
    );
  }

  if (embedded) {
    return (
      <>
        {jobs.map((job) => (
          <GenerationJobCard key={job.id} job={job} />
        ))}
      </>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      {jobs.map((job) => (
        <GenerationJobCard key={job.id} job={job} />
      ))}
    </div>
  );
}

export function GenerationLightbox() {
  const router = useRouter();
  const jobs = useGenerationStore((s) => s.jobs);
  const selectedJobId = useGenerationStore((s) => s.selectedJobId);
  const selectedImageId = useGenerationStore((s) => s.selectedImageId);
  const setSelected = useGenerationStore((s) => s.setSelected);
  const createProjectFromDataUrl = useEditorStore((s) => s.createProjectFromDataUrl);

  if (!selectedJobId || !selectedImageId) return null;

  const job = jobs.find((j) => j.id === selectedJobId);
  const image = job?.images.find((i) => i.id === selectedImageId);
  if (!job || !image) return null;

  const close = () => setSelected(null, null);

  const openInEditor = async () => {
    const name = job.prompt.slice(0, 40) || "AI Image";
    const projectId = await createProjectFromDataUrl(image.url, name);
    router.push(`/editor/${projectId}`);
  };

  const btnStyle: React.CSSProperties = {
    padding: "10px 18px",
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 10,
    border: "1px solid var(--color-border)",
    background: "var(--color-surface-panel)",
    color: "var(--color-text-primary)",
  };

  return (
    <ModalPortal>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "rgba(0,0,0,0.92)",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={close}
      >
      <div
        style={{
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {job.prompt}
        </p>
        <button type="button" onClick={close} style={{ ...btnStyle, marginLeft: 16 }}>
          ✕
        </button>
      </div>

      <div
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, minHeight: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt=""
          style={{ maxWidth: "100%", maxHeight: "calc(100vh - 180px)", borderRadius: 8, boxShadow: "0 8px 40px var(--color-shadow)" }}
        />
      </div>

      <div
        style={{
          padding: "16px 24px",
          display: "flex",
          gap: 10,
          justifyContent: "center",
          flexWrap: "wrap",
          borderTop: "1px solid var(--color-border-subtle)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => {
            const a = document.createElement("a");
            a.href = image.url;
            a.download = "lumina-generation.png";
            a.click();
          }}
          style={btnStyle}
        >
          Download
        </button>
        <button
          type="button"
          onClick={() => void openInEditor()}
          style={{ ...btnStyle, background: "var(--color-accent)", borderColor: "var(--color-accent)", color: "#fff" }}
        >
          Edit in Lumina
        </button>
      </div>
    </div>
    </ModalPortal>
  );
}
