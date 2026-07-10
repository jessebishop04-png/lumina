"use client";

import { useRouter } from "next/navigation";
import type { GeneratedImage, GenerationJob, ImageAnimation } from "@/lib/types/generation";
import { getStyleById } from "@/lib/constants/generationStyles";
import { useGenerationStore } from "@/lib/store/generationStore";
import { useEditorStore } from "@/lib/store/editorStore";
import { ModalPortal } from "@/components/layout/ModalPortal";
import { MediaActionsMenu } from "@/components/generate/MediaActionsMenu";

function downloadMedia(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

function MediaSlot({
  image,
  job,
  index,
  aspectRatio = "1",
  maxHeight,
  onSelect,
  onGenerateVideo,
  onDownload,
  onEdit,
  generateVideoDisabled,
}: {
  image?: GeneratedImage;
  job: GenerationJob;
  index: number;
  aspectRatio?: string;
  maxHeight?: number;
  onSelect?: () => void;
  onGenerateVideo?: () => void;
  onDownload?: () => void;
  onEdit?: () => void;
  generateVideoDisabled?: boolean;
}) {
  const isVideo = image?.mediaType === "video";
  const isLoading = job.status === "generating" && !image;
  const filled = job.images.length;
  const showLoader = isLoading && index >= filled;
  const hasMenu = image && (onDownload || onGenerateVideo || onEdit);

  return (
    <div
      role={image && onSelect ? "button" : undefined}
      tabIndex={image && onSelect ? 0 : undefined}
      onClick={image && onSelect ? onSelect : undefined}
      onKeyDown={
        image && onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      style={{
        position: "relative",
        aspectRatio,
        maxHeight,
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-input)",
        padding: 0,
        cursor: image && onSelect ? "pointer" : "default",
        width: "100%",
      }}
    >
      {image ? (
        isVideo ? (
          <video
            src={image.url}
            muted
            loop
            playsInline
            autoPlay
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        )
      ) : showLoader ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="spinner" style={{ width: 20, height: 20 }} />
        </div>
      ) : null}
      {hasMenu && (
        <MediaActionsMenu
          onGenerateVideo={onGenerateVideo}
          onDownload={onDownload!}
          onEdit={onEdit}
          generateVideoDisabled={generateVideoDisabled}
        />
      )}
    </div>
  );
}

function AnimationSlot({
  animation,
  onSelect,
  onDownload,
}: {
  animation: ImageAnimation;
  onSelect?: () => void;
  onDownload?: () => void;
}) {
  const aspectRatio = animation.settings.aspectRatio === "16:9" ? "16 / 9" : "9 / 16";
  const style = getStyleById(animation.styleId ?? null);

  return (
    <div style={{ marginTop: 4 }}>
      <div
        style={{
          fontSize: 10,
          color: "var(--color-text-muted)",
          marginBottom: 4,
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <span>▶ {animation.settings.aspectRatio} · {animation.settings.videoDuration}s</span>
        {animation.status === "generating" && (
          <span style={{ color: "var(--color-accent)" }}>Animating…</span>
        )}
        {animation.status === "failed" && (
          <span style={{ color: "#e74c3c" }}>{animation.error ?? "Failed"}</span>
        )}
        {style && <span>· {style.label}</span>}
      </div>
      <div
        role={animation.video && onSelect ? "button" : undefined}
        tabIndex={animation.video && onSelect ? 0 : undefined}
        onClick={animation.video && onSelect ? onSelect : undefined}
        onKeyDown={
          animation.video && onSelect
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect();
                }
              }
            : undefined
        }
        style={{
          position: "relative",
          aspectRatio,
          maxHeight: 220,
          width: "100%",
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid var(--color-accent-soft, var(--color-border))",
          background: "var(--color-surface-input)",
          padding: 0,
          cursor: animation.video && onSelect ? "pointer" : "default",
        }}
      >
        {animation.video ? (
          <video
            src={animation.video.url}
            muted
            loop
            playsInline
            autoPlay
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : animation.status === "generating" ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="spinner" style={{ width: 20, height: 20 }} />
          </div>
        ) : null}
        {animation.video && onDownload && (
          <MediaActionsMenu onDownload={onDownload} />
        )}
      </div>
    </div>
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

function ImageCell({
  job,
  image,
  index,
}: {
  job: GenerationJob;
  image?: GeneratedImage;
  index: number;
}) {
  const router = useRouter();
  const setSelected = useGenerationStore((s) => s.setSelected);
  const setAnimateTarget = useGenerationStore((s) => s.setAnimateTarget);
  const isGenerating = useGenerationStore((s) => s.isGenerating);
  const createProjectFromDataUrl = useEditorStore((s) => s.createProjectFromDataUrl);
  const animations = (job.animations ?? []).filter((a) => image && a.sourceImageId === image.id);
  const animating = animations.some((a) => a.status === "generating");
  const isVideoCell = job.mediaType === "video" || image?.mediaType === "video";
  const isImage = image && image.mediaType !== "video" && job.mediaType !== "video";

  const openEditor = async () => {
    if (!image || isVideoCell) return;
    const name = job.prompt.slice(0, 40) || "AI Image";
    const projectId = await createProjectFromDataUrl(image.url, name);
    router.push(`/editor/${projectId}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      <MediaSlot
        image={image}
        job={job}
        index={index}
        aspectRatio={isVideoCell ? "9 / 16" : "1"}
        maxHeight={isVideoCell ? 420 : undefined}
        onSelect={image ? () => setSelected(job.id, image.id, null) : undefined}
        onGenerateVideo={
          isImage && job.status === "complete"
            ? () =>
                setAnimateTarget({
                  type: "job",
                  jobId: job.id,
                  imageId: image.id,
                  previewUrl: image.url,
                  prompt: job.prompt,
                  styleId: job.styleId ?? null,
                })
            : undefined
        }
        onDownload={
          image
            ? () => downloadMedia(image.url, isVideoCell ? "lumina-video.mp4" : "lumina-generation.png")
            : undefined
        }
        onEdit={isImage && job.status === "complete" ? () => void openEditor() : undefined}
        generateVideoDisabled={isGenerating || animating}
      />
      {animations.map((animation) => (
        <AnimationSlot
          key={animation.id}
          animation={animation}
          onSelect={() => animation.video && setSelected(job.id, image?.id ?? null, animation.id)}
          onDownload={
            animation.video
              ? () => downloadMedia(animation.video!.url, "lumina-video.mp4")
              : undefined
          }
        />
      ))}
    </div>
  );
}

export function GenerationJobCard({ job }: { job: GenerationJob }) {
  const isVideo = job.mediaType === "video";
  const slots = isVideo || job.action === "upscale" ? 1 : 4;
  const style = getStyleById(job.styleId ?? null);
  const animatingCount = (job.animations ?? []).filter((a) => a.status === "generating").length;

  return (
    <article style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border-subtle)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 14, color: "var(--color-text-primary)", margin: "0 0 4px", lineHeight: 1.4 }}>
            {job.prompt || (job.referenceImageDataUrl ? "Reference generation" : "")}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
              {new Date(job.createdAt).toLocaleString()} · {isVideo ? "Video" : "Image"} · {job.settings.aspectRatio}
              {isVideo ? ` · ${job.settings.videoDuration ?? 4}s` : job.settings.draft ? " · Draft" : ""}
              {isVideo && job.action === "animate"
                ? " · From image"
                : !isVideo && job.action && job.action !== "imagine"
                  ? ` · ${job.action}`
                  : ""}
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
              {animatingCount > 0 ? ` · ${animatingCount} animating` : ""}
            </span>
            {job.status === "generating" && (
              <span style={{ fontSize: 11, color: "var(--color-accent)" }}>
                {isVideo
                  ? job.action === "animate"
                    ? "Animating image…"
                    : "Generating video…"
                  : `${job.progress}%`}
              </span>
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
            maxWidth: isVideo ? 280 : slots === 1 ? 360 : 720,
            margin: isVideo ? "0 auto" : undefined,
          }}
        >
          {Array.from({ length: slots }).map((_, i) => (
            <ImageCell key={i} job={job} image={job.images[i]} index={i} />
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
            Type a prompt to generate images or short-form videos. Switch to Video above the prompt bar for 9:16 clips.
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
  const selectedAnimationId = useGenerationStore((s) => s.selectedAnimationId);
  const setSelected = useGenerationStore((s) => s.setSelected);
  const setAnimateTarget = useGenerationStore((s) => s.setAnimateTarget);
  const isGenerating = useGenerationStore((s) => s.isGenerating);
  const createProjectFromDataUrl = useEditorStore((s) => s.createProjectFromDataUrl);

  if (!selectedJobId) return null;

  const job = jobs.find((j) => j.id === selectedJobId);
  if (!job) return null;

  const animation = selectedAnimationId
    ? (job.animations ?? []).find((a) => a.id === selectedAnimationId)
    : undefined;
  const image = animation?.video
    ?? (selectedImageId ? job.images.find((i) => i.id === selectedImageId) : undefined);

  if (!image) return null;

  const isVideo = image.mediaType === "video" || !!animation;
  const close = () => setSelected(null, null, null);

  const sourceImage = selectedImageId ? job.images.find((i) => i.id === selectedImageId) : undefined;
  const sourceAnimating = sourceImage
    ? (job.animations ?? []).some((a) => a.sourceImageId === sourceImage.id && a.status === "generating")
    : false;

  const openInEditor = async () => {
    if (isVideo || !sourceImage) return;
    const name = job.prompt.slice(0, 40) || "AI Image";
    const projectId = await createProjectFromDataUrl(sourceImage.url, name);
    close();
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
            position: "relative",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {animation?.prompt ?? job.prompt}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 16 }}>
            <MediaActionsMenu
              overlay={false}
              align="left"
              onGenerateVideo={
                !isVideo && sourceImage
                  ? () =>
                      setAnimateTarget({
                        type: "job",
                        jobId: job.id,
                        imageId: sourceImage.id,
                        previewUrl: sourceImage.url,
                        prompt: job.prompt,
                        styleId: job.styleId ?? null,
                      })
                  : undefined
              }
              onDownload={() => downloadMedia(image.url, isVideo ? "lumina-video.mp4" : "lumina-generation.png")}
              onEdit={!isVideo && sourceImage ? () => void openInEditor() : undefined}
              generateVideoDisabled={isGenerating || sourceAnimating}
            />
            <button type="button" onClick={close} style={btnStyle}>
              ✕
            </button>
          </div>
        </div>

        <div
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, minHeight: 0, overflowY: "auto" }}
          onClick={(e) => e.stopPropagation()}
        >
          {isVideo ? (
            <video
              src={image.url}
              controls
              autoPlay
              loop
              playsInline
              style={{ maxWidth: "100%", maxHeight: "calc(100vh - 120px)", borderRadius: 8, boxShadow: "0 8px 40px var(--color-shadow)" }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.url}
              alt=""
              style={{ maxWidth: "100%", maxHeight: "calc(100vh - 120px)", borderRadius: 8, boxShadow: "0 8px 40px var(--color-shadow)" }}
            />
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
