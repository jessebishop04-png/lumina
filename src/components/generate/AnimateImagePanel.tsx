"use client";

import { useState } from "react";
import type { AnimateImageOptions, VideoDuration } from "@/lib/types/generation";
import type { GenerationStyle } from "@/lib/constants/generationStyles";
import { ALL_STYLES } from "@/lib/constants/generationStyles";
import { StylePresetChips } from "@/components/generate/StylePresetChips";

interface AnimateImagePanelProps {
  defaultPrompt?: string;
  defaultStyleId?: string | null;
  disabled?: boolean;
  compact?: boolean;
  hint?: string;
  styleOptions?: GenerationStyle[];
  onCancel?: () => void;
  onGenerate: (options: AnimateImageOptions) => void;
}

export function AnimateImagePanel({
  defaultPrompt = "",
  defaultStyleId = null,
  disabled = false,
  compact = false,
  hint = "Video appears below this image in your creation.",
  styleOptions = ALL_STYLES,
  onCancel,
  onGenerate,
}: AnimateImagePanelProps) {
  const [motionPrompt, setMotionPrompt] = useState(defaultPrompt);
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16");
  const [videoDuration, setVideoDuration] = useState<VideoDuration>(4);
  const [videoAudio, setVideoAudio] = useState(false);
  const [styleId, setStyleId] = useState<string | null>(defaultStyleId);

  const toggleStyle = (id: string) => {
    setStyleId((prev) => (prev === id ? null : id));
  };

  const submit = () => {
    onGenerate({
      motionPrompt,
      aspectRatio,
      videoDuration,
      videoAudio,
      styleId,
    });
  };

  return (
    <div className={`animate-image-panel${compact ? " animate-image-panel--compact" : ""}`}>
      <div>
        <p className="animate-image-panel-title">Animate image</p>
        <p className="animate-image-panel-hint">{hint}</p>
      </div>

      <div>
        <label className="create-prompt-label">Motion prompt</label>
        <textarea
          className="create-prompt-textarea"
          value={motionPrompt}
          onChange={(e) => setMotionPrompt(e.target.value)}
          placeholder="Describe how the image should move…"
          rows={2}
          style={{ marginTop: 6, minHeight: 56, resize: "vertical", width: "100%" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="create-prompt-label">Size</label>
          <select
            className="create-prompt-select"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as "9:16" | "16:9")}
            style={{ marginTop: 6, width: "100%" }}
          >
            <option value="9:16">Portrait (9:16)</option>
            <option value="16:9">Landscape (16:9)</option>
          </select>
        </div>
        <div>
          <label className="create-prompt-label">Length</label>
          <select
            className="create-prompt-select"
            value={videoDuration}
            onChange={(e) => setVideoDuration(Number(e.target.value) as VideoDuration)}
            style={{ marginTop: 6, width: "100%" }}
          >
            <option value={4}>4 seconds</option>
            <option value={6}>6 seconds</option>
            <option value={8}>8 seconds</option>
          </select>
        </div>
      </div>

      <div>
        <label className="create-prompt-label" style={{ display: "block", marginBottom: 8 }}>
          Style
        </label>
        <StylePresetChips activeStyleId={styleId} onToggle={toggleStyle} styles={styleOptions} />
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--animate-modal-label-color, var(--color-text-primary))" }}>
        <input
          type="checkbox"
          checked={videoAudio}
          onChange={(e) => setVideoAudio(e.target.checked)}
          style={{ accentColor: "var(--animate-modal-generate-bg, var(--color-accent))" }}
        />
        Generate audio
      </label>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
        {onCancel && (
          <button type="button" className="animate-image-panel-cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="button" className="animate-image-panel-generate" disabled={disabled} onClick={submit}>
          Generate video
        </button>
      </div>
    </div>
  );
}
