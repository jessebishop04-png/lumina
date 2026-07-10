"use client";

import { useState } from "react";
import type { GenerationStyle } from "@/lib/constants/generationStyles";
import { getStylePreviewImageSources } from "@/lib/constants/stylePreviewImages";

function PreviewImage({ local, remote, alt }: { local: string; remote: string; alt: string }) {
  const [src, setSrc] = useState(local);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (src !== remote) setSrc(remote);
      }}
    />
  );
}

function StylePreviewCollage({ style }: { style: GenerationStyle }) {
  const sources = getStylePreviewImageSources(style);

  return (
    <div className="styles-page-card-preview styles-page-card-preview--collage">
      {sources.map((source, i) => (
        <div key={i} className="styles-page-collage-cell">
          <PreviewImage local={source.local} remote={source.remote} alt={`${style.label} sample ${i + 1}`} />
        </div>
      ))}
    </div>
  );
}

function StyleCard({
  style,
  active,
  liked,
  onSelect,
  onToggleLike,
}: {
  style: GenerationStyle;
  active: boolean;
  liked: boolean;
  onSelect: () => void;
  onToggleLike: () => void;
}) {
  return (
    <article className={`styles-page-card${active ? " is-active" : ""}`}>
      <div className="styles-page-card-inner">
        <div className="styles-page-card-head">
          <button type="button" className="styles-page-card-select" onClick={onSelect} title={style.suffix}>
            <p className="styles-page-card-label">{style.label}</p>
            <p className="styles-page-card-suffix">{style.suffix}</p>
          </button>
          <button
            type="button"
            className={`styles-page-like-btn${liked ? " is-liked" : ""}`}
            aria-label={liked ? "Unlike style" : "Like style"}
            onClick={onToggleLike}
          >
            {liked ? "♥" : "♡"}
          </button>
        </div>
        <button type="button" className="styles-page-card-preview-btn" onClick={onSelect} title={`Select ${style.label}`}>
          <StylePreviewCollage style={style} />
        </button>
      </div>
    </article>
  );
}

export { StyleCard, StylePreviewCollage };
