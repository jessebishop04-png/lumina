"use client";

import { useState } from "react";
import type { GenerationStyle } from "@/lib/constants/generationStyles";
import { PROMPT_BAR_STYLES } from "@/lib/constants/generationStyles";

interface StylePresetChipsProps {
  activeStyleId: string | null;
  onToggle: (styleId: string) => void;
  styles?: GenerationStyle[];
}

export function StylePresetChips({ activeStyleId, onToggle, styles = PROMPT_BAR_STYLES }: StylePresetChipsProps) {
  return (
    <div className="style-preset-chips">
      {styles.map((style) => {
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
  style: GenerationStyle;
  active: boolean;
  onToggle: (id: string) => void;
}) {
  const [failed, setFailed] = useState(false);
  const thumbSize = 24;

  return (
    <button
      type="button"
      onClick={() => onToggle(style.id)}
      title={style.suffix}
      className={`style-preset-chip${active ? " is-active" : ""}`}
    >
      {failed ? (
        <span className="style-preset-chip-fallback" aria-hidden>
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
          className="style-preset-chip-thumb"
        />
      )}
      {style.label}
    </button>
  );
}
