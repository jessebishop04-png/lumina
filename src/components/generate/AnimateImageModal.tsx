"use client";

import { useEffect, useRef } from "react";
import { ModalPortal } from "@/components/layout/ModalPortal";
import { AnimateImagePanel } from "@/components/generate/AnimateImagePanel";
import { animateImageModalDialStyles } from "@/lib/dials/animateImageModalDialStyles";
import { useAnimateImageModalDials } from "@/lib/dials/useAnimateImageModalDials";
import { scrollToGenerationTarget } from "@/lib/generation/scrollToGenerationTarget";
import { useGenerationStore } from "@/lib/store/generationStore";

export function AnimateImageModal() {
  const dials = useAnimateImageModalDials();
  const animateTarget = useGenerationStore((s) => s.animateTarget);
  const setAnimateTarget = useGenerationStore((s) => s.setAnimateTarget);
  const animateImage = useGenerationStore((s) => s.animateImage);
  const animateFromUrl = useGenerationStore((s) => s.animateFromUrl);
  const isGenerating = useGenerationStore((s) => s.isGenerating);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animateTarget) return;
    bodyRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [animateTarget]);

  if (!animateTarget) return null;

  const close = () => setAnimateTarget(null);

  const handleGenerate = async (options: Parameters<typeof animateImage>[2]) => {
    close();

    if (animateTarget.type === "job") {
      const animationId = await animateImage(animateTarget.jobId, animateTarget.imageId, options);
      if (animationId) {
        scrollToGenerationTarget({ jobId: animateTarget.jobId, animationId });
      }
      return;
    }

    const jobId = await animateFromUrl(
      animateTarget.imageUrl,
      animateTarget.prompt,
      animateTarget.styleId ?? null,
      options,
    );
    if (jobId) {
      scrollToGenerationTarget({ jobId });
    }
  };

  const previewUrl = animateTarget.type === "job" ? animateTarget.previewUrl : animateTarget.imageUrl;

  return (
    <ModalPortal>
      <div
        className="animate-image-modal-backdrop animate-image-modal-root"
        style={animateImageModalDialStyles(dials)}
        onClick={close}
      >
        <div className="animate-image-modal-panel" onClick={(e) => e.stopPropagation()}>
          <div className="animate-image-modal-header">
            <p className="animate-image-modal-title">Generate video</p>
            <button type="button" className="animate-image-modal-close" onClick={close} aria-label="Close">
              ✕
            </button>
          </div>

          <div ref={bodyRef} className="animate-image-modal-body">
            <div className="animate-image-modal-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="" />
            </div>
            <AnimateImagePanel
              defaultPrompt={animateTarget.prompt ?? ""}
              defaultStyleId={animateTarget.styleId ?? null}
              disabled={isGenerating}
              onCancel={close}
              onGenerate={(options) => void handleGenerate(options)}
            />
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
