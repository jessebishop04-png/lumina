import type { GenerationStyle } from "./generationStyles";

const PREVIEW_SUBJECTS = [
  "portrait of a person, expressive face, studio lighting",
  "landscape scenery with depth and atmosphere",
  "still life with rich detail and composition",
];

function previewSeed(styleId: string, index: number): number {
  let hash = 0;
  for (const ch of styleId) hash = (hash * 31 + ch.charCodeAt(0)) % 100000;
  return hash + index * 41;
}

function pollinationsPreviewUrl(prompt: string, seed: number): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=400&height=520&seed=${seed}&model=turbo&nologo=true`;
}

export function getStylePreviewImageSources(style: GenerationStyle): { local: string; remote: string }[] {
  return PREVIEW_SUBJECTS.map((subject, index) => ({
    local: `/style-previews/${style.id}-${index}.jpg`,
    remote: pollinationsPreviewUrl(`${subject}, ${style.suffix}`, previewSeed(style.id, index)),
  }));
}
