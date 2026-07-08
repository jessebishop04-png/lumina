"use client";

import { useEffect, useState } from "react";
import { StylePresetChips } from "@/components/generate/StylePresetChips";
import { PromptGeneratingBanner } from "@/components/editor/ImagineGeneratingIndicator";
import { ASPECT_RATIO_OPTIONS, DEFAULT_IMAGINE_STATE } from "@/lib/types/generation";
import { useActiveImage, useEditorStore } from "@/lib/store/editorStore";

interface EditorImaginePromptProps {
  compact?: boolean;
  generateCount?: number;
}

export function EditorImaginePrompt({ compact = false, generateCount = compact ? 1 : 4 }: EditorImaginePromptProps) {
  const activeImage = useActiveImage();
  const imagineGenerating = useEditorStore((s) => s.imagineGenerating);
  const imagineSourceImageId = useEditorStore((s) => s.imagineSourceImageId);
  const imagineError = useEditorStore((s) => s.imagineError);
  const updateImagineState = useEditorStore((s) => s.updateImagineState);
  const toggleImagineStyle = useEditorStore((s) => s.toggleImagineStyle);
  const submitImagineVersions = useEditorStore((s) => s.submitImagineVersions);
  const [showSettings, setShowSettings] = useState(false);
  const [referenceImg2img, setReferenceImg2img] = useState(true);

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
    <div>
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

      <div
        style={{
          borderRadius: 12,
          border: isGeneratingSource ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
          background: "var(--color-surface-input)",
          overflow: "hidden",
          opacity: isGeneratingSource ? 0.72 : 1,
          transition: "opacity 0.2s, border-color 0.2s",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: compact ? "8px 10px" : "10px 12px" }}>
          <textarea
            value={imagine.prompt}
            onChange={(e) => updateImagineState({ prompt: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSubmit) runGenerate();
              }
            }}
            placeholder="Describe a new version…"
            rows={compact ? 2 : 3}
            style={{
              flex: 1,
              resize: "none",
              border: "none",
              background: "transparent",
              color: "var(--color-text-primary)",
              fontSize: 13,
              lineHeight: 1.45,
              outline: "none",
              fontFamily: "inherit",
              minWidth: 0,
            }}
          />
          <button
            type="button"
            onClick={runGenerate}
            disabled={!canSubmit}
            title={generateCount === 1 ? "Generate version" : `Generate ${generateCount} versions`}
            style={{
              width: compact ? 36 : 40,
              height: compact ? 36 : 40,
              borderRadius: 10,
              background: "var(--color-accent)",
              color: "#fff",
              fontSize: compact ? 16 : 18,
              fontWeight: 600,
              opacity: !canSubmit ? 0.45 : 1,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isGeneratingSource ? (
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: "rgba(255,255,255,0.35)", borderTopColor: "#fff" }} />
            ) : (
              "↑"
            )}
          </button>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--color-border-subtle)",
            padding: compact ? "6px 8px 8px" : "8px 10px 10px",
          }}
        >
          <StylePresetChips activeStyleId={imagine.activeStyleId} onToggle={toggleImagineStyle} />
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
          Adds a new photo after this one in the filmstrip.
        </p>
      )}

      {imagineError && (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#e74c3c", lineHeight: 1.4 }}>{imagineError}</p>
      )}

      {!compact && (
        <>
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            style={{
              width: "100%",
              padding: "8px 0",
              fontSize: 12,
              color: "var(--color-text-secondary)",
              marginTop: 12,
              marginBottom: showSettings ? 12 : 0,
            }}
          >
            {showSettings ? "Hide settings ▲" : "Generation settings ▼"}
          </button>

          {showSettings && (
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                display: "grid",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Aspect ratio
                </label>
                <select
                  value={imagine.settings.aspectRatio}
                  onChange={(e) =>
                    updateImagineState({
                      settings: { aspectRatio: e.target.value as typeof imagine.settings.aspectRatio },
                    })
                  }
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface-panel)",
                    color: "var(--color-text-primary)",
                    fontSize: 12,
                  }}
                >
                  {ASPECT_RATIO_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label} ({o.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  Stylize · {imagine.settings.stylize}
                </label>
                <input
                  type="range"
                  min={0}
                  max={300}
                  value={imagine.settings.stylize}
                  onChange={(e) => updateImagineState({ settings: { stylize: Number(e.target.value) } })}
                  style={{ width: "100%", marginTop: 6 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  Variety · {imagine.settings.variety}
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={imagine.settings.variety}
                  onChange={(e) => updateImagineState({ settings: { variety: Number(e.target.value) } })}
                  style={{ width: "100%", marginTop: 6 }}
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={imagine.settings.draft}
                  onChange={(e) => updateImagineState({ settings: { draft: e.target.checked } })}
                  style={{ accentColor: "var(--color-accent)" }}
                />
                Draft mode (faster)
              </label>
            </div>
          )}
        </>
      )}
    </div>
  );
}
