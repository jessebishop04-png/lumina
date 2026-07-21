"use client";

import { ASPECT_RATIO_OPTIONS } from "@/lib/types/generation";
import type { GenerationSettings, GenerationMediaType } from "@/lib/types/generation";

interface GenerationSettingsFieldsProps {
  settings: GenerationSettings;
  mediaType: GenerationMediaType;
  onChange: (partial: Partial<GenerationSettings>) => void;
  variant?: "default" | "modern" | "card";
  compact?: boolean;
}

function GenSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="gen-settings-field gen-settings-field--slider">
      <div className="gen-settings-label-row">
        <span className="gen-settings-label">{label}</span>
        <span className="gen-settings-value">{value}</span>
      </div>
      <div className="gen-settings-slider">
        <div className="gen-settings-slider-track">
          <div className="gen-settings-slider-fill" style={{ width: `${pct}%` }} />
        </div>
        <input
          type="range"
          className="gen-settings-range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}

function GenToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="gen-settings-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="gen-settings-toggle-track" aria-hidden />
      <span className="gen-settings-toggle-label">{label}</span>
    </label>
  );
}

const VIDEO_DURATION_OPTIONS: { value: GenerationSettings["videoDuration"]; label: string }[] = [
  { value: 4, label: "4s" },
  { value: 6, label: "6s" },
  { value: 8, label: "8s" },
];

function GenChips<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="gen-settings-field">
      <span className="gen-settings-label">{label}</span>
      <div className="gen-settings-chips" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            className={`gen-settings-chip${value === o.value ? " is-active" : ""}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CardImageSettings({
  settings,
  onChange,
  compact,
}: {
  settings: GenerationSettings;
  onChange: (partial: Partial<GenerationSettings>) => void;
  compact?: boolean;
}) {
  const ratioSource = compact
    ? ASPECT_RATIO_OPTIONS.filter((o) => ["1:1", "16:9", "9:16", "4:5"].includes(o.id))
    : ASPECT_RATIO_OPTIONS;
  const aspectOptions = ratioSource.map((o) => ({ value: o.id, label: o.id }));

  return (
    <div className={`gen-settings-card${compact ? " gen-settings-card--compact" : ""}`}>
      <div className="gen-settings-card-col">
        <GenChips
          label="Aspect ratio"
          options={aspectOptions}
          value={settings.aspectRatio}
          onChange={(aspectRatio) => onChange({ aspectRatio })}
        />
      </div>
      <div className="gen-settings-card-col gen-settings-card-col--model">
        <div className="gen-settings-field">
          <span className="gen-settings-label">Model</span>
          <div className="gen-settings-segmented gen-settings-segmented--card" role="group" aria-label="Model">
            <button
              type="button"
              className={`gen-settings-segment${settings.model === "flux" ? " is-active" : ""}`}
              onClick={() => onChange({ model: "flux" })}
            >
              Flux
            </button>
            <button
              type="button"
              className={`gen-settings-segment${settings.model === "turbo" ? " is-active" : ""}`}
              onClick={() => onChange({ model: "turbo" })}
            >
              Turbo
            </button>
          </div>
        </div>
        <div className="gen-settings-field gen-settings-field--toggle gen-settings-field--inline-toggle">
          <GenToggle checked={settings.draft} label="Draft mode" onChange={(draft) => onChange({ draft })} />
        </div>
      </div>
      <div className={`gen-settings-card-col${compact ? " gen-settings-card-col--sliders" : ""}`}>
        <GenSlider
          label="Stylize"
          value={settings.stylize}
          min={0}
          max={300}
          onChange={(stylize) => onChange({ stylize })}
        />
        <GenSlider
          label="Variety"
          value={settings.variety}
          min={0}
          max={100}
          onChange={(variety) => onChange({ variety })}
        />
      </div>
    </div>
  );
}

function CardVideoSettings({
  settings,
  onChange,
  compact,
}: {
  settings: GenerationSettings;
  onChange: (partial: Partial<GenerationSettings>) => void;
  compact?: boolean;
}) {
  const aspectOptions = ASPECT_RATIO_OPTIONS.filter((o) => o.id === "9:16" || o.id === "16:9").map((o) => ({
    value: o.id,
    label: o.id,
  }));

  return (
    <div className={`gen-settings-card gen-settings-card--video${compact ? " gen-settings-card--compact" : ""}`}>
      <div className="gen-settings-card-col">
        <GenChips
          label="Aspect ratio"
          options={aspectOptions}
          value={settings.aspectRatio}
          onChange={(aspectRatio) => onChange({ aspectRatio: aspectRatio as GenerationSettings["aspectRatio"] })}
        />
      </div>
      <div className="gen-settings-card-col">
        <GenChips
          label="Duration"
          options={VIDEO_DURATION_OPTIONS}
          value={settings.videoDuration}
          onChange={(videoDuration) => onChange({ videoDuration })}
        />
      </div>
      <div className="gen-settings-card-col gen-settings-card-col--toggle">
        <div className="gen-settings-field gen-settings-field--toggle">
          <GenToggle
            checked={settings.videoAudio}
            label="Generate audio"
            onChange={(videoAudio) => onChange({ videoAudio })}
          />
        </div>
      </div>
    </div>
  );
}

function CardSettingsFields({
  settings,
  mediaType,
  onChange,
  compact,
}: Omit<GenerationSettingsFieldsProps, "variant">) {
  if (mediaType === "video") {
    return <CardVideoSettings settings={settings} onChange={onChange} compact={compact} />;
  }
  return <CardImageSettings settings={settings} onChange={onChange} compact={compact} />;
}

function ModernSettingsFields({
  settings,
  mediaType,
  onChange,
}: Omit<GenerationSettingsFieldsProps, "variant" | "compact">) {
  const aspectOptions =
    mediaType === "video"
      ? ASPECT_RATIO_OPTIONS.filter((o) => o.id === "9:16" || o.id === "16:9")
      : ASPECT_RATIO_OPTIONS;

  return (
    <div className="gen-settings-modern">
      <div className="gen-settings-field">
        <span className="gen-settings-label">Aspect ratio</span>
        <div className="gen-settings-select-wrap">
          <select
            className="gen-settings-select"
            value={settings.aspectRatio}
            onChange={(e) => onChange({ aspectRatio: e.target.value as GenerationSettings["aspectRatio"] })}
          >
            {aspectOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label} ({o.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {mediaType === "video" ? (
        <>
          <div className="gen-settings-field">
            <span className="gen-settings-label">Duration</span>
            <div className="gen-settings-select-wrap">
              <select
                className="gen-settings-select"
                value={settings.videoDuration}
                onChange={(e) =>
                  onChange({ videoDuration: Number(e.target.value) as GenerationSettings["videoDuration"] })
                }
              >
                <option value={4}>4 seconds</option>
                <option value={6}>6 seconds</option>
                <option value={8}>8 seconds</option>
              </select>
            </div>
          </div>
          <div className="gen-settings-field gen-settings-field--toggle">
            <GenToggle
              checked={settings.videoAudio}
              label="Generate audio"
              onChange={(videoAudio) => onChange({ videoAudio })}
            />
          </div>
        </>
      ) : (
        <>
          <GenSlider
            label="Stylize"
            value={settings.stylize}
            min={0}
            max={300}
            onChange={(stylize) => onChange({ stylize })}
          />
          <GenSlider
            label="Variety"
            value={settings.variety}
            min={0}
            max={100}
            onChange={(variety) => onChange({ variety })}
          />
          <div className="gen-settings-field">
            <span className="gen-settings-label">Model</span>
            <div className="gen-settings-segmented" role="group" aria-label="Model">
              <button
                type="button"
                className={`gen-settings-segment${settings.model === "flux" ? " is-active" : ""}`}
                onClick={() => onChange({ model: "flux" })}
              >
                Flux
              </button>
              <button
                type="button"
                className={`gen-settings-segment${settings.model === "turbo" ? " is-active" : ""}`}
                onClick={() => onChange({ model: "turbo" })}
              >
                Turbo
              </button>
            </div>
          </div>
          <div className="gen-settings-field gen-settings-field--toggle">
            <GenToggle
              checked={settings.draft}
              label="Draft mode"
              onChange={(draft) => onChange({ draft })}
            />
          </div>
        </>
      )}
    </div>
  );
}

export function GenerationSettingsFields({
  settings,
  mediaType,
  onChange,
  variant = "default",
  compact = false,
}: GenerationSettingsFieldsProps) {
  if (variant === "card") {
    return <CardSettingsFields settings={settings} mediaType={mediaType} onChange={onChange} compact={compact} />;
  }
  if (variant === "modern") {
    return <ModernSettingsFields settings={settings} mediaType={mediaType} onChange={onChange} />;
  }

  const aspectOptions =
    mediaType === "video"
      ? ASPECT_RATIO_OPTIONS.filter((o) => o.id === "9:16" || o.id === "16:9")
      : ASPECT_RATIO_OPTIONS;

  return (
    <>
      <div>
        <label className="create-prompt-label">Aspect ratio</label>
        <select
          className="create-prompt-select"
          value={settings.aspectRatio}
          onChange={(e) => onChange({ aspectRatio: e.target.value as GenerationSettings["aspectRatio"] })}
        >
          {aspectOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label} ({o.id})
            </option>
          ))}
        </select>
      </div>
      {mediaType === "video" ? (
        <>
          <div>
            <label className="create-prompt-label">Duration</label>
            <select
              className="create-prompt-select"
              value={settings.videoDuration}
              onChange={(e) => onChange({ videoDuration: Number(e.target.value) as GenerationSettings["videoDuration"] })}
            >
              <option value={4}>4 seconds</option>
              <option value={6}>6 seconds</option>
              <option value={8}>8 seconds</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--color-text-primary)" }}>
              <input
                type="checkbox"
                checked={settings.videoAudio}
                onChange={(e) => onChange({ videoAudio: e.target.checked })}
                style={{ accentColor: "var(--color-accent)" }}
              />
              Generate audio
            </label>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="create-prompt-label">Stylize · {settings.stylize}</label>
            <input
              type="range"
              min={0}
              max={300}
              value={settings.stylize}
              onChange={(e) => onChange({ stylize: Number(e.target.value) })}
              style={{ width: "100%", marginTop: 8 }}
            />
          </div>
          <div>
            <label className="create-prompt-label">Variety · {settings.variety}</label>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.variety}
              onChange={(e) => onChange({ variety: Number(e.target.value) })}
              style={{ width: "100%", marginTop: 8 }}
            />
          </div>
          <div>
            <label className="create-prompt-label">Model</label>
            <select
              className="create-prompt-select"
              value={settings.model}
              onChange={(e) => onChange({ model: e.target.value as GenerationSettings["model"] })}
            >
              <option value="flux">Flux (quality)</option>
              <option value="turbo">Turbo (fast)</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--color-text-primary)" }}>
              <input
                type="checkbox"
                checked={settings.draft}
                onChange={(e) => onChange({ draft: e.target.checked })}
                style={{ accentColor: "var(--color-accent)" }}
              />
              Draft mode (faster)
            </label>
          </div>
        </>
      )}
    </>
  );
}
