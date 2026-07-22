"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { GenerationSettingsFields } from "@/components/generate/GenerationSettingsFields";
import { StylePresetChips } from "@/components/generate/StylePresetChips";
import { ALL_STYLES } from "@/lib/constants/generationStyles";
import { useImageDrop } from "@/lib/hooks/useImageDrop";
import { promptBoxDialStyles } from "@/lib/dials/promptBoxDialStyles";
import { usePromptBoxDials } from "@/lib/dials/usePromptBoxDials";
import { useGenerationStore } from "@/lib/store/generationStore";
import { useAuthStore } from "@/lib/store/authStore";
import {
  PROMPT_PANEL_COLLAPSE_DURATION,
  PROMPT_PANEL_COLLAPSE_EASE,
  PROMPT_PANEL_COLLAPSE_FADE_RATIO,
  PROMPT_PANEL_EXPAND_DURATION,
  PROMPT_PANEL_EXPAND_EASE,
} from "@/lib/generation/promptPanelMotion";

gsap.registerPlugin(useGSAP);

interface CreatePromptBarProps {
  sticky?: boolean;
  showHint?: boolean;
  wide?: boolean;
  variant?: "default" | "flat";
}

export function CreatePromptBar({ sticky = true, showHint = true, wide = false, variant = "default" }: CreatePromptBarProps) {
  const dials = usePromptBoxDials();
  const prompt = useGenerationStore((s) => s.prompt);
  const setPrompt = useGenerationStore((s) => s.setPrompt);
  const settings = useGenerationStore((s) => s.settings);
  const setSettings = useGenerationStore((s) => s.setSettings);
  const imagine = useGenerationStore((s) => s.imagine);
  const isGenerating = useGenerationStore((s) => s.isGenerating);
  const referenceImageDataUrl = useGenerationStore((s) => s.referenceImageDataUrl);
  const setReferenceImage = useGenerationStore((s) => s.setReferenceImage);
  const mediaType = useGenerationStore((s) => s.mediaType);
  const setMediaType = useGenerationStore((s) => s.setMediaType);
  const activeStyleId = useGenerationStore((s) => s.activeStyleId);
  const toggleStyle = useGenerationStore((s) => s.toggleStyle);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsRendered, setSettingsRendered] = useState(false);
  const [referenceImg2img, setReferenceImg2img] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch("/api/generate/status")
      .then((r) => r.json())
      .then((data: { referenceImg2img?: boolean }) => {
        setReferenceImg2img(!!data.referenceImg2img);
      })
      .catch(() => setReferenceImg2img(false));
  }, []);

  useLayoutEffect(() => {
    if (showSettings) setSettingsRendered(true);
  }, [showSettings]);

  useLayoutEffect(() => {
    const el = settingsRef.current;
    if (!el || !settingsRendered) return;

    if (showSettings) {
      gsap.set(el, { height: 0, overflow: "hidden", opacity: 0, y: 12 });
      return;
    }

    gsap.set(el, { height: el.offsetHeight, overflow: "hidden" });
  }, [showSettings, settingsRendered]);

  useGSAP(
    () => {
      const el = settingsRef.current;
      if (!el || !settingsRendered) return;

      const mm = gsap.matchMedia();

      const finishCollapse = () => {
        setSettingsRendered(false);
      };

      if (showSettings) {
        mm.add("(prefers-reduced-motion: reduce)", () => {
          gsap.set(el, { opacity: 1, y: 0, height: "auto", clearProps: "overflow" });
        });

        mm.add("(prefers-reduced-motion: no-preference)", () => {
          requestAnimationFrame(() => {
            gsap.to(el, {
              height: el.scrollHeight,
              opacity: 1,
              y: 0,
              duration: PROMPT_PANEL_EXPAND_DURATION,
              ease: PROMPT_PANEL_EXPAND_EASE,
              onComplete: () => {
                gsap.set(el, { clearProps: "height,overflow" });
              },
            });
          });
        });
      } else {
        mm.add("(prefers-reduced-motion: reduce)", finishCollapse);

        mm.add("(prefers-reduced-motion: no-preference)", () => {
          const tl = gsap.timeline({ onComplete: finishCollapse });

          tl.to(
            el,
            {
              opacity: 0,
              duration: PROMPT_PANEL_COLLAPSE_DURATION * PROMPT_PANEL_COLLAPSE_FADE_RATIO,
              ease: "power1.in",
            },
            0,
          );

          tl.to(
            el,
            {
              height: 0,
              paddingTop: 0,
              paddingBottom: 0,
              duration: PROMPT_PANEL_COLLAPSE_DURATION,
              ease: PROMPT_PANEL_COLLAPSE_EASE,
            },
            0,
          );
        });
      }

      return () => mm.revert();
    },
    { scope: shellRef, dependencies: [showSettings, settingsRendered] },
  );

  const { isDragging, dragHandlers, handleFileInput } = useImageDrop(setReferenceImage);

  const canSubmit = (prompt.trim().length > 0 || !!referenceImageDataUrl) && !isGenerating;

  const submit = () => {
    if (!canSubmit) return;
    if (!useAuthStore.getState().user) {
      useAuthStore.getState().continueAsGuest();
    }
    void imagine();
  };

  const isFlat = variant === "flat";

  return (
    <div
      className={`create-prompt-wrap${isFlat ? " create-prompt-wrap--flat" : ""}`}
      style={{
        ...(sticky ? { position: "sticky", top: 0, zIndex: 10 } : {}),
        ...(isFlat
          ? { padding: "0 20px 8px", width: "100%" }
          : {
              background: "var(--color-surface-panel)",
              borderBottom: "1px solid var(--color-border-subtle)",
              padding: "16px 24px",
              width: "100%",
            }),
      }}
    >
      <div className={`create-prompt-inner${wide ? " is-wide" : ""}${isFlat ? " is-full" : ""}`}>
        <div className="editor-imagine-root" style={promptBoxDialStyles(dials)}>
          <div
            ref={shellRef}
            {...dragHandlers}
            className={`editor-imagine-shell create-prompt-shell${isDragging ? " is-dragging" : ""}${isFlat ? " create-prompt-shell--flat" : ""}${isGenerating ? " is-generating" : ""}`}
          >
            <div className="create-prompt-input-row">
              {referenceImageDataUrl ? (
                <div className="create-prompt-ref-slot">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={referenceImageDataUrl} alt="Reference" className="create-prompt-ref-img" />
                  <span className="create-prompt-ref-badge">{referenceImg2img ? "IMG2IMG" : "NO KEY"}</span>
                  <button type="button" className="create-prompt-ref-remove" onClick={() => setReferenceImage(null)} title="Remove reference">
                    ×
                  </button>
                </div>
              ) : (
                <button type="button" className="create-prompt-ref-btn" onClick={() => fileInputRef.current?.click()} title="Add reference image">
                  🖼
                </button>
              )}

              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileInput} style={{ display: "none" }} />

              <textarea
                className="create-prompt-textarea editor-imagine-textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder={
                  isDragging
                    ? "Drop image here…"
                    : referenceImageDataUrl
                      ? mediaType === "video"
                        ? "Describe the motion or scene for your clip…"
                        : "Describe how to transform the reference…"
                      : mediaType === "video"
                        ? "Describe your short video…"
                        : "Describe what you want to create…"
                }
                rows={2}
              />

              <button type="button" className="editor-imagine-submit create-prompt-submit" onClick={submit} disabled={!canSubmit}>
                {isGenerating ? "…" : "↑"}
              </button>
            </div>

            <div className={`editor-imagine-chips create-prompt-styles${isFlat ? " create-prompt-styles--flat" : ""}`}>
              <StylePresetChips
                activeStyleId={activeStyleId}
                onToggle={toggleStyle}
                styles={ALL_STYLES}
                expanded={showSettings}
                collapseBehavior="hidden"
              />
            </div>

            {settingsRendered && (
              <div ref={settingsRef} className="editor-imagine-settings-dropdown is-gsap-animated">
                <GenerationSettingsFields
                  variant="card"
                  settings={settings}
                  mediaType={mediaType}
                  onChange={setSettings}
                />
              </div>
            )}

            <div className="editor-imagine-footer">
              <div className="create-media-toggle create-media-toggle--inline" role="group" aria-label="Media type">
                <button
                  type="button"
                  className={`create-media-toggle-btn${mediaType === "image" ? " is-active" : ""}`}
                  onClick={() => setMediaType("image")}
                >
                  Image
                </button>
                <button
                  type="button"
                  className={`create-media-toggle-btn${mediaType === "video" ? " is-active" : ""}`}
                  onClick={() => setMediaType("video")}
                >
                  Video
                </button>
              </div>
              <button
                type="button"
                className={`editor-imagine-see-more-btn${showSettings ? " is-active" : ""}`}
                onClick={() => setShowSettings((v) => !v)}
                aria-expanded={showSettings}
                aria-label={showSettings ? "Collapse styles and settings" : "Expand styles and settings"}
                title={showSettings ? "See less" : "See more"}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden className="editor-imagine-see-more-icon">
                  <path fill="currentColor" d="m7 10l5 5 5-5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {showHint && (
          <p className="create-prompt-hint">
            {mediaType === "video"
              ? referenceImageDataUrl
                ? "Pick a style · Optional start frame · Enter to generate"
                : "Pick a style · Short-form clips · Enter to generate"
              : referenceImageDataUrl && referenceImg2img
                ? "Your image is sent to the model · Describe changes · Enter to generate"
                : referenceImageDataUrl
                  ? "Reference needs POLLINATIONS_API_KEY in .env.local for img2img"
                  : "Drop an image · Pick a style · Enter to generate"}
          </p>
        )}
      </div>
    </div>
  );
}
