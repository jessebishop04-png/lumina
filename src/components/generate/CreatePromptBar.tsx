"use client";

import { useEffect, useRef, useState } from "react";
import { ASPECT_RATIO_OPTIONS } from "@/lib/types/generation";
import { StylePresetChips } from "@/components/generate/StylePresetChips";
import { useImageDrop } from "@/lib/hooks/useImageDrop";
import { useGenerationStore } from "@/lib/store/generationStore";
import { useAuthStore } from "@/lib/store/authStore";

interface CreatePromptBarProps {
  sticky?: boolean;
  showHint?: boolean;
  wide?: boolean;
  variant?: "default" | "flat";
}

export function CreatePromptBar({ sticky = true, showHint = true, wide = false, variant = "default" }: CreatePromptBarProps) {
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
  const [referenceImg2img, setReferenceImg2img] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetch("/api/generate/status")
      .then((r) => r.json())
      .then((data: { referenceImg2img?: boolean }) => {
        setReferenceImg2img(!!data.referenceImg2img);
      })
      .catch(() => setReferenceImg2img(false));
  }, []);

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
        <div className="create-media-toggle">
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
        <div
          {...dragHandlers}
          className={`create-prompt-shell${isDragging ? " is-dragging" : ""}${isFlat ? " create-prompt-shell--flat" : ""}`}
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
              className="create-prompt-textarea"
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

            <button type="button" className={`create-prompt-icon-btn${showSettings ? " is-active" : ""}`} onClick={() => setShowSettings((v) => !v)} title="Settings">
              ⚙
            </button>

            <button type="button" className="create-prompt-submit" onClick={submit} disabled={!canSubmit}>
              {isGenerating ? "…" : "↑"}
            </button>
          </div>

          <div className={`create-prompt-styles${isFlat ? " create-prompt-styles--flat" : ""}`}>
            <StylePresetChips activeStyleId={activeStyleId} onToggle={toggleStyle} />
          </div>
        </div>

        {showSettings && (
          <div className="create-prompt-settings">
            <SettingsFields settings={settings} setSettings={setSettings} mediaType={mediaType} />
          </div>
        )}

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

function SettingsFields({
  settings,
  setSettings,
  mediaType,
}: {
  settings: ReturnType<typeof useGenerationStore.getState>["settings"];
  setSettings: ReturnType<typeof useGenerationStore.getState>["setSettings"];
  mediaType: "image" | "video";
}) {
  const aspectOptions =
    mediaType === "video"
      ? ASPECT_RATIO_OPTIONS.filter((o) => o.id === "9:16" || o.id === "16:9")
      : ASPECT_RATIO_OPTIONS;

  return (
    <>
      <div>
        <label className="create-prompt-label">Aspect ratio</label>
        <select className="create-prompt-select" value={settings.aspectRatio} onChange={(e) => setSettings({ aspectRatio: e.target.value as typeof settings.aspectRatio })}>
          {aspectOptions.map((o) => (
            <option key={o.id} value={o.id}>{o.label} ({o.id})</option>
          ))}
        </select>
      </div>
      {mediaType === "video" ? (
        <>
          <div>
            <label className="create-prompt-label">Duration</label>
            <select className="create-prompt-select" value={settings.videoDuration} onChange={(e) => setSettings({ videoDuration: Number(e.target.value) as typeof settings.videoDuration })}>
              <option value={4}>4 seconds</option>
              <option value={6}>6 seconds</option>
              <option value={8}>8 seconds</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--color-text-primary)" }}>
              <input type="checkbox" checked={settings.videoAudio} onChange={(e) => setSettings({ videoAudio: e.target.checked })} style={{ accentColor: "var(--color-accent)" }} />
              Generate audio
            </label>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="create-prompt-label">Stylize · {settings.stylize}</label>
            <input type="range" min={0} max={300} value={settings.stylize} onChange={(e) => setSettings({ stylize: Number(e.target.value) })} style={{ width: "100%", marginTop: 8 }} />
          </div>
          <div>
            <label className="create-prompt-label">Variety · {settings.variety}</label>
            <input type="range" min={0} max={100} value={settings.variety} onChange={(e) => setSettings({ variety: Number(e.target.value) })} style={{ width: "100%", marginTop: 8 }} />
          </div>
          <div>
            <label className="create-prompt-label">Model</label>
            <select className="create-prompt-select" value={settings.model} onChange={(e) => setSettings({ model: e.target.value as "flux" | "turbo" })}>
              <option value="flux">Flux (quality)</option>
              <option value="turbo">Turbo (fast)</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--color-text-primary)" }}>
              <input type="checkbox" checked={settings.draft} onChange={(e) => setSettings({ draft: e.target.checked })} style={{ accentColor: "var(--color-accent)" }} />
              Draft mode (faster)
            </label>
          </div>
        </>
      )}
    </>
  );
}
