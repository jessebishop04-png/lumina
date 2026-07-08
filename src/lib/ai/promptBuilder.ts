import { applyStyleToPrompt } from "@/lib/constants/generationStyles";
import type { GenerationSettings } from "@/lib/types/generation";

export function buildVideoPrompt(prompt: string, styleId?: string | null): string {
  const trimmed = applyStyleToPrompt(prompt, styleId ?? null);
  if (trimmed) return `${trimmed}, smooth camera motion, high quality video`;
  return "cinematic short video clip, smooth camera motion, high quality";
}

export function buildEnhancedPrompt(
  prompt: string,
  settings: GenerationSettings,
  variationIndex?: number,
  styleId?: string | null,
  hasReference = false,
  img2img = false
): string {
  let trimmed = applyStyleToPrompt(prompt, styleId ?? null);

  if (!trimmed && hasReference) {
    trimmed = img2img
      ? "keep the same subject, people, and composition from the input image, high quality"
      : "creative interpretation of the reference image, high quality, detailed";
  }
  if (!trimmed) return trimmed;

  const parts: string[] = [];

  if (img2img) {
    parts.push(trimmed);
  } else {
    parts.push(trimmed);
    if (hasReference) {
      parts.push("inspired by reference image composition and subject");
    }
  }

  if (settings.stylize >= 250) {
    parts.push("highly stylized, artistic, cinematic lighting");
  } else if (settings.stylize >= 150) {
    parts.push("detailed, professional quality");
  } else if (settings.stylize <= 50) {
    parts.push("natural, photorealistic");
  }

  if (settings.variety >= 50 && variationIndex !== undefined) {
    parts.push(`unique composition ${variationIndex + 1}`);
  }

  if (settings.draft) {
    parts.push("concept sketch");
  }

  return parts.join(", ");
}
