export interface GenerationStyle {
  id: string;
  label: string;
  /** @deprecated Use previewUrl in UI chips */
  icon: string;
  previewUrl: string;
  suffix: string;
  /** Shown in Create prompt bar chips. Defaults to true. */
  promptBar?: boolean;
  /** Fallback collage strips when preview image is missing */
  previewColors?: [string, string, string];
}

function localStylePreview(id: string): string {
  return `/style-previews/${id}.jpg`;
}

export const GENERATION_STYLES: GenerationStyle[] = [
  { id: "photorealistic", label: "Photo", icon: "📷", previewUrl: localStylePreview("photorealistic"), suffix: "photorealistic, ultra detailed, natural lighting, 8k", previewColors: ["#c4a882", "#8b9da8", "#6b5344"] },
  { id: "cinematic", label: "Cinematic", icon: "🎬", previewUrl: localStylePreview("cinematic"), suffix: "cinematic lighting, film still, dramatic atmosphere, wide angle", previewColors: ["#e8a04a", "#c45c3e", "#4a3728"] },
  { id: "anime", label: "Anime", icon: "🎌", previewUrl: localStylePreview("anime"), suffix: "anime style, vibrant colors, detailed illustration", previewColors: ["#ff8ec8", "#6eb5ff", "#ffe566"] },
  { id: "oil-painting", label: "Oil Paint", icon: "🖼️", previewUrl: localStylePreview("oil-painting"), suffix: "oil painting, textured brushstrokes, classical art", previewColors: ["#8b6914", "#3d5a3a", "#5c4033"] },
  { id: "watercolor", label: "Watercolor", icon: "💧", previewUrl: localStylePreview("watercolor"), suffix: "watercolor painting, soft edges, flowing pigments", previewColors: ["#a8d8ea", "#f9c5d1", "#88b04b"] },
  { id: "3d-render", label: "3D", icon: "🧊", previewUrl: localStylePreview("3d-render"), suffix: "3d render, octane render, ray tracing, highly detailed", previewColors: ["#7ec8e3", "#b8e0d2", "#d4a5d9"] },
  { id: "cyberpunk", label: "Cyberpunk", icon: "🌃", previewUrl: localStylePreview("cyberpunk"), suffix: "cyberpunk, neon lights, futuristic city, moody", previewColors: ["#ff00aa", "#00ffff", "#1a0a2e"] },
  { id: "fantasy", label: "Fantasy", icon: "🐉", previewUrl: localStylePreview("fantasy"), suffix: "fantasy art, epic, magical atmosphere, detailed", previewColors: ["#6b4c9a", "#c9a227", "#2d5a27"] },
  { id: "minimalist", label: "Minimal", icon: "◻️", previewUrl: localStylePreview("minimalist"), suffix: "minimalist, clean composition, simple shapes, modern", previewColors: ["#f0f0f0", "#d4d4d4", "#a0a0a0"] },
  { id: "vintage", label: "Vintage", icon: "📻", previewUrl: localStylePreview("vintage"), suffix: "vintage photograph, faded tones, film grain, retro", previewColors: ["#d4a574", "#8b7355", "#c9b896"] },
  { id: "sketch", label: "Sketch", icon: "✏️", previewUrl: localStylePreview("sketch"), suffix: "pencil sketch, hand drawn, artistic linework", previewColors: ["#e8e4df", "#b8b4af", "#787470"] },
  { id: "pop-art", label: "Pop Art", icon: "💥", previewUrl: localStylePreview("pop-art"), suffix: "pop art, bold colors, halftone dots, graphic style", previewColors: ["#ff3366", "#ffcc00", "#3366ff"] },
];

/** Styles page only — inspired by Midjourney SREF / aesthetic presets */
export const EXTENDED_STYLES: GenerationStyle[] = [
  { id: "fisheye", label: "Fisheye", icon: "🐟", previewUrl: localStylePreview("fisheye"), suffix: "extreme fisheye lens, distorted wide angle, lo-fi digicam, lens flare, candid snapshot", promptBar: false, previewColors: ["#ff6b4a", "#4a90d9", "#f0e6d3"] },
  { id: "line-doodle", label: "Doodle", icon: "✍️", previewUrl: localStylePreview("line-doodle"), suffix: "hand drawn line art, doodle style, sketchy ink lines, whimsical illustration, notebook drawing", promptBar: false, previewColors: ["#f5f0e8", "#2a2a2a", "#e8dcc8"] },
  { id: "glittercore", label: "Glitter", icon: "✨", previewUrl: localStylePreview("glittercore"), suffix: "glittercore aesthetic, sparkle filter, dreamy pink tones, star lens flare, ethereal glow", promptBar: false, previewColors: ["#ffb6d9", "#ff69b4", "#ffc0e8"] },
  { id: "moody-film", label: "Moody Film", icon: "🎞️", previewUrl: localStylePreview("moody-film"), suffix: "moody film photography, soft focus, natural light, analog film grain, contemplative atmosphere", promptBar: false, previewColors: ["#8b9da8", "#c4b8a8", "#5a6b5a"] },
  { id: "baroque", label: "Baroque", icon: "👑", previewUrl: localStylePreview("baroque"), suffix: "baroque oil painting, renaissance portrait, chiaroscuro lighting, classical composition, old masters", promptBar: false, previewColors: ["#3d2914", "#8b6914", "#1a1a2e"] },
  { id: "film-noir", label: "Film Noir", icon: "🕵️", previewUrl: localStylePreview("film-noir"), suffix: "film noir, high contrast black and white, dramatic shadows, 1940s detective cinema", promptBar: false, previewColors: ["#1a1a1a", "#4a4a4a", "#8a8a8a"] },
  { id: "polaroid", label: "Polaroid", icon: "📸", previewUrl: localStylePreview("polaroid"), suffix: "polaroid instant photo, faded colors, white border frame, nostalgic snapshot, light leak", promptBar: false, previewColors: ["#e8d4b8", "#a8c8d8", "#d8c8a8"] },
  { id: "claymation", label: "Clay", icon: "🧱", previewUrl: localStylePreview("claymation"), suffix: "claymation stop motion style, sculpted clay figures, tactile textures, whimsical 3d", promptBar: false, previewColors: ["#e8a87c", "#c9d45c", "#7eb8c9"] },
  { id: "pixel-art", label: "Pixel", icon: "👾", previewUrl: localStylePreview("pixel-art"), suffix: "pixel art, 16-bit retro game aesthetic, limited color palette, crisp pixels", promptBar: false, previewColors: ["#4a90d9", "#e74c3c", "#2ecc71"] },
  { id: "surreal", label: "Surreal", icon: "🌙", previewUrl: localStylePreview("surreal"), suffix: "surrealist art, dreamlike scene, impossible geometry, salvador dali inspired, ethereal", promptBar: false, previewColors: ["#f4d03f", "#5dade2", "#8e44ad"] },
  { id: "art-nouveau", label: "Art Nouveau", icon: "🌸", previewUrl: localStylePreview("art-nouveau"), suffix: "art nouveau style, organic flowing lines, floral motifs, alphonse mucha inspired, decorative", promptBar: false, previewColors: ["#d4a574", "#7eb8a0", "#c9a0dc"] },
  { id: "infrared", label: "Infrared", icon: "🔴", previewUrl: localStylePreview("infrared"), suffix: "infrared photography, false color, white foliage, deep blue sky, otherworldly landscape", promptBar: false, previewColors: ["#ff6b8a", "#ffffff", "#4a0080"] },
  { id: "isometric", label: "Isometric", icon: "📐", previewUrl: localStylePreview("isometric"), suffix: "isometric illustration, clean vector style, miniature diorama, soft shadows, game art", promptBar: false, previewColors: ["#7ec8e3", "#f9c5d1", "#b8e0d2"] },
  { id: "brutalist", label: "Brutalist", icon: "🏗️", previewUrl: localStylePreview("brutalist"), suffix: "brutalist architecture photography, raw concrete, geometric forms, overcast sky, monumental", promptBar: false, previewColors: ["#8a8a8a", "#c4c4c4", "#5a5a5a"] },
  { id: "studio-ghibli", label: "Ghibli", icon: "🏔️", previewUrl: localStylePreview("studio-ghibli"), suffix: "studio ghibli style, soft watercolor backgrounds, warm pastoral scenery, hand painted animation", promptBar: false, previewColors: ["#7eb8a0", "#f4d03f", "#87ceeb"] },
  { id: "dark-academia", label: "Dark Academia", icon: "📚", previewUrl: localStylePreview("dark-academia"), suffix: "dark academia aesthetic, moody library, warm candlelight, vintage scholarly atmosphere", promptBar: false, previewColors: ["#3d2914", "#8b4513", "#1a1a1a"] },
];

export const ALL_STYLES: GenerationStyle[] = [...GENERATION_STYLES, ...EXTENDED_STYLES];

export const PROMPT_BAR_STYLES = GENERATION_STYLES.filter((s) => s.promptBar !== false);

export function getStyleById(id: string | null): GenerationStyle | undefined {
  if (!id) return undefined;
  return ALL_STYLES.find((s) => s.id === id);
}

export function applyStyleToPrompt(prompt: string, styleId: string | null): string {
  const style = getStyleById(styleId);
  const trimmed = prompt.trim();
  if (!style) return trimmed;
  if (!trimmed) return style.suffix;
  return `${trimmed}, ${style.suffix}`;
}
