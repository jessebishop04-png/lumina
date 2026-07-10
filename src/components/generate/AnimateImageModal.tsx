"use client";

import { ModalPortal } from "@/components/layout/ModalPortal";
import { AnimateImagePanel } from "@/components/generate/AnimateImagePanel";
import { useGenerationStore } from "@/lib/store/generationStore";

export function AnimateImageModal() {
  const animateTarget = useGenerationStore((s) => s.animateTarget);
  const setAnimateTarget = useGenerationStore((s) => s.setAnimateTarget);
  const animateImage = useGenerationStore((s) => s.animateImage);
  const animateFromUrl = useGenerationStore((s) => s.animateFromUrl);
  const isGenerating = useGenerationStore((s) => s.isGenerating);

  if (!animateTarget) return null;

  const close = () => setAnimateTarget(null);

  const handleGenerate = (options: Parameters<typeof animateImage>[2]) => {
    if (animateTarget.type === "job") {
      void animateImage(animateTarget.jobId, animateTarget.imageId, options);
    } else {
      void animateFromUrl(
        animateTarget.imageUrl,
        animateTarget.prompt,
        animateTarget.styleId ?? null,
        options
      );
    }
    close();
  };

  const previewUrl = animateTarget.type === "job" ? animateTarget.previewUrl : animateTarget.imageUrl;

  return (
    <ModalPortal>
      <div className="animate-image-modal-backdrop" onClick={close}>
        <div className="animate-image-modal-panel" onClick={(e) => e.stopPropagation()}>
          <div className="animate-image-modal-header">
            <p className="animate-image-modal-title">Generate video</p>
            <button type="button" className="animate-image-modal-close" onClick={close} aria-label="Close">
              ✕
            </button>
          </div>

          <div className="animate-image-modal-body">
            <div className="animate-image-modal-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="" />
            </div>
            <AnimateImagePanel
              defaultPrompt={animateTarget.prompt ?? ""}
              defaultStyleId={animateTarget.styleId ?? null}
              disabled={isGenerating}
              onCancel={close}
              onGenerate={handleGenerate}
            />
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
