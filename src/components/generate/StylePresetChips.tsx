"use client";

import { useState } from "react";
import { GENERATION_STYLES } from "@/lib/constants/generationStyles";

interface StylePresetChipsProps {
  activeStyleId: string | null;
  onToggle: (styleId: string) => void;
}

export function StylePresetChips({ activeStyleId, onToggle }: StylePresetChipsProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        overflowX: "auto",
        scrollbarWidth: "thin",
        paddingBottom: 2,
      }}
    >
      {GENERATION_STYLES.map((style) => {
        const active = activeStyleId === style.id;
        return (
          <StyleChip key={style.id} style={style} active={active} onToggle={onToggle} />
        );
      })}
    </div>
  );
}

function StyleChip({
  style,
  active,
  onToggle,
}: {
  style: (typeof GENERATION_STYLES)[number];
  active: boolean;
  onToggle: (id: string) => void;
}) {
  const [failed, setFailed] = useState(false);
  const thumbSize = 36;

  return (
    <button
      type="button"
      onClick={() => onToggle(style.id)}
      title={style.suffix}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px 6px 6px",
        borderRadius: 999,
        border: active ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
        background: active ? "var(--color-accent-soft)" : "var(--color-surface-panel)",
        color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: "nowrap",
        flexShrink: 0,
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      {failed ? (
        <span style={{ width: thumbSize, textAlign: "center", fontSize: 14 }} aria-hidden>
          {style.icon}
        </span>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={style.previewUrl}
          alt=""
          width={thumbSize}
          height={thumbSize}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          style={{
            width: thumbSize,
            height: thumbSize,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
            border: active ? "1.5px solid var(--color-accent)" : "1px solid var(--color-border)",
            boxSizing: "border-box",
            background: "var(--color-surface-input)",
          }}
        />
      )}
      {style.label}
    </button>
  );
}
