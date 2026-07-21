import type { GenerationStyle } from "./generationStyles";

const BASE_STYLE_IDS = new Set([
  "photorealistic",
  "cinematic",
  "anime",
  "oil-painting",
  "watercolor",
  "3d-render",
  "cyberpunk",
  "fantasy",
  "minimalist",
  "vintage",
  "sketch",
  "pop-art",
]);

export function styleHasLocalPreview(styleId: string): boolean {
  return BASE_STYLE_IDS.has(styleId);
}

export function getStyleChipThumbnail(style: GenerationStyle): string {
  if (styleHasLocalPreview(style.id)) return style.previewUrl;
  return buildStylePlaceholderDataUrl(style);
}

export function getStyleChipPlaceholder(style: GenerationStyle): string {
  return buildStylePlaceholderDataUrl(style);
}

function buildStylePlaceholderDataUrl(style: GenerationStyle): string {
  const [c1, c2, c3] = style.previewColors ?? ["#525252", "#737373", "#a3a3a3"];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="55%" stop-color="${c2}"/><stop offset="100%" stop-color="${c3}"/></linearGradient></defs><rect width="48" height="48" rx="24" fill="url(#g)"/><circle cx="24" cy="20" r="7" fill="rgba(255,255,255,0.22)"/><path d="M12 36c4-6 10-9 12-9s8 3 12 9" fill="rgba(255,255,255,0.18)"/></svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
