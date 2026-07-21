"use client";

import { useEffect, useState } from "react";
import { GenerationSettingsFields } from "@/components/generate/GenerationSettingsFields";
import { StylePresetChips } from "@/components/generate/StylePresetChips";
import { PromptGeneratingBanner } from "@/components/editor/ImagineGeneratingIndicator";
import { promptBoxDialStyles } from "@/lib/dials/promptBoxDialStyles";
import { usePromptBoxDials } from "@/lib/dials/usePromptBoxDials";
import { DEFAULT_IMAGINE_STATE } from "@/lib/types/generation";
import { useActiveImage, useEditorStore } from "@/lib/store/editorStore";

interface EditorImaginePromptProps {
  compact?: boolean;
  generateCount?: number;
}

export function EditorImaginePrompt({ compact = false, generateCount = compact ? 1 : 4 }: EditorImaginePromptProps) {
  const dials = usePromptBoxDials();
  const activeImage = useActiveImage();
  const imagineGenerating = useEditorStore((s) => s.imagineGenerating);
  const imagineSourceImageId = useEditorStore((s) => s.imagineSourceImageId);
  const imagineError = useEditorStore((s) => s.imagineError);
  const updateImagineState = useEditorStore((s) => s.updateImagineState);
  const toggleImagineStyle = useEditorStore((s) => s.toggleImagineStyle);
  const submitImagineVersions = useEditorStore((s) => s.submitImagineVersions);
  const [referenceImg2img, setReferenceImg2img] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    void fetch("/api/generate/status")
      .then((r) => r.json())
      .then((data: { referenceImg2img?: boolean }) => {
        setReferenceImg2img(!!data.referenceImg2img);
      })
      .catch(() => setReferenceImg2img(false));
  }, []);

  if (!activeImage) return null;

  const imagine = activeImage.imagine ?? {
    ...DEFAULT_IMAGINE_STATE,
    settings: { ...DEFAULT_IMAGINE_STATE.settings },
  };
  const canSubmit = imagine.prompt.trim().length > 0 && !imagineGenerating && referenceImg2img;
  const isGeneratingSource = imagineGenerating && activeImage.id === imagineSourceImageId;

  const runGenerate = () => {
    void submitImagineVersions(generateCount);
  };

  return (
    <div className="editor-imagine-root" style={promptBoxDialStyles(dials)}>
      {!compact && (
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage.thumbnailDataUrl}
              alt="Current photo"
              style={{
                width: 56,
                height: 56,
                objectFit: "cover",
                borderRadius: 10,
                border: "1px solid var(--color-border)",
              }}
            />
            <span
              style={{
                position: "absolute",
                bottom: -4,
                left: 0,
                right: 0,
                textAlign: "center",
                fontSize: 9,
                fontWeight: 600,
                color: referenceImg2img ? "var(--color-accent)" : "var(--color-text-muted)",
                background: "var(--color-surface-panel)",
                borderRadius: 4,
                padding: "1px 4px",
              }}
            >
              {referenceImg2img ? "IMG2IMG" : "NO KEY"}
            </span>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
              Using current photo
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--color-text-muted)" }}>
              {referenceImg2img
                ? "New versions appear in the filmstrip below"
                : "Add POLLINATIONS_API_KEY for img2img"}
            </p>
          </div>
        </div>
      )}

      {!compact && (
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--color-text-secondary)",
            margin: "0 0 8px",
          }}
        >
          Prompt
        </p>
      )}

      <div className={`editor-imagine-shell${isGeneratingSource ? " is-generating" : ""}`}>
        <div className="editor-imagine-input-row">
          <textarea
            className="editor-imagine-textarea"
            value={imagine.prompt}
            onChange={(e) => updateImagineState({ prompt: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSubmit) runGenerate();
              }
            }}
            placeholder={
              imagine.mediaType === "video"
                ? "Describe the motion for your clip…"
                : "Describe a new version…"
            }
            rows={compact ? 2 : 3}
          />
          <button
            type="button"
            className="editor-imagine-submit"
            onClick={runGenerate}
            disabled={!canSubmit}
            title={generateCount === 1 ? "Generate version" : `Generate ${generateCount} versions`}
          >
            {isGeneratingSource ? (
              <div
                className="spinner"
                style={{
                  width: 16,
                  height: 16,
                  borderWidth: 2,
                  borderColor: "rgba(255,255,255,0.35)",
                  borderTopColor: "#fff",
                }}
              />
            ) : (
              "↑"
            )}
          </button>
        </div>

        <div className="editor-imagine-chips">
          <StylePresetChips activeStyleId={imagine.activeStyleId} onToggle={toggleImagineStyle} />
        </div>

        {showSettings && (
          <div className="editor-imagine-settings-dropdown">
            <GenerationSettingsFields
              variant="card"
              compact={compact}
              settings={imagine.settings}
              mediaType={imagine.mediaType}
              onChange={(partial) => updateImagineState({ settings: partial })}
            />
          </div>
        )}

        <div className="editor-imagine-footer">
          <div className="create-media-toggle create-media-toggle--inline create-media-toggle--editor" role="group" aria-label="Media type">
            <button
              type="button"
              className={`create-media-toggle-btn${imagine.mediaType === "image" ? " is-active" : ""}`}
              onClick={() => updateImagineState({ mediaType: "image" })}
            >
              Image
            </button>
            <button
              type="button"
              className={`create-media-toggle-btn${imagine.mediaType === "video" ? " is-active" : ""}`}
              onClick={() => updateImagineState({ mediaType: "video" })}
            >
              Video
            </button>
          </div>
          <button
            type="button"
            className={`editor-imagine-settings-btn${showSettings ? " is-active" : ""}`}
            onClick={() => setShowSettings((v) => !v)}
            title="Generation settings"
            aria-expanded={showSettings}
            aria-label="Generation settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.03 1.41 1.1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <PromptGeneratingBanner compact={compact} />

      {compact && !referenceImg2img && (
        <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--color-text-muted)" }}>
          Add POLLINATIONS_API_KEY in .env.local to generate from the current photo.
        </p>
      )}

      {compact && referenceImg2img && !imagineError && !imagineGenerating && (
        <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--color-text-muted)" }}>
          {imagine.mediaType === "video"
            ? "Adds a new clip after this one in the filmstrip."
            : "Adds a new photo after this one in the filmstrip."}
        </p>
      )}

      {imagineError && (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#e74c3c", lineHeight: 1.4 }}>{imagineError}</p>
      )}
    </div>
  );
}
