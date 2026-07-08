export interface GenerationStyle {

  id: string;

  label: string;

  /** @deprecated Use previewUrl in UI chips */

  icon: string;

  previewUrl: string;

  suffix: string;

}



function localStylePreview(id: string): string {

  return `/style-previews/${id}.jpg`;

}



export const GENERATION_STYLES: GenerationStyle[] = [

  { id: "photorealistic", label: "Photo", icon: "📷", previewUrl: localStylePreview("photorealistic"), suffix: "photorealistic, ultra detailed, natural lighting, 8k" },

  { id: "cinematic", label: "Cinematic", icon: "🎬", previewUrl: localStylePreview("cinematic"), suffix: "cinematic lighting, film still, dramatic atmosphere, wide angle" },

  { id: "anime", label: "Anime", icon: "🎌", previewUrl: localStylePreview("anime"), suffix: "anime style, vibrant colors, detailed illustration" },

  { id: "oil-painting", label: "Oil Paint", icon: "🖼️", previewUrl: localStylePreview("oil-painting"), suffix: "oil painting, textured brushstrokes, classical art" },

  { id: "watercolor", label: "Watercolor", icon: "💧", previewUrl: localStylePreview("watercolor"), suffix: "watercolor painting, soft edges, flowing pigments" },

  { id: "3d-render", label: "3D", icon: "🧊", previewUrl: localStylePreview("3d-render"), suffix: "3d render, octane render, ray tracing, highly detailed" },

  { id: "cyberpunk", label: "Cyberpunk", icon: "🌃", previewUrl: localStylePreview("cyberpunk"), suffix: "cyberpunk, neon lights, futuristic city, moody" },

  { id: "fantasy", label: "Fantasy", icon: "🐉", previewUrl: localStylePreview("fantasy"), suffix: "fantasy art, epic, magical atmosphere, detailed" },

  { id: "minimalist", label: "Minimal", icon: "◻️", previewUrl: localStylePreview("minimalist"), suffix: "minimalist, clean composition, simple shapes, modern" },

  { id: "vintage", label: "Vintage", icon: "📻", previewUrl: localStylePreview("vintage"), suffix: "vintage photograph, faded tones, film grain, retro" },

  { id: "sketch", label: "Sketch", icon: "✏️", previewUrl: localStylePreview("sketch"), suffix: "pencil sketch, hand drawn, artistic linework" },

  { id: "pop-art", label: "Pop Art", icon: "💥", previewUrl: localStylePreview("pop-art"), suffix: "pop art, bold colors, halftone dots, graphic style" },

];



export function getStyleById(id: string | null): GenerationStyle | undefined {

  if (!id) return undefined;

  return GENERATION_STYLES.find((s) => s.id === id);

}



export function applyStyleToPrompt(prompt: string, styleId: string | null): string {

  const style = getStyleById(styleId);

  const trimmed = prompt.trim();

  if (!style) return trimmed;

  if (!trimmed) return style.suffix;

  return `${trimmed}, ${style.suffix}`;

}

