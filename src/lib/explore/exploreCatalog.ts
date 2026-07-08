import { GENERATION_STYLES } from "@/lib/constants/generationStyles";

/** Bundled Lumina showcase posts — real AI images in /public/explore/ */
export const EXPLORE_CATALOG_VERSION = "lumina-catalog-v2";

export interface ExploreCatalogEntry {
  slug: string;
  prompt: string;
  styleId: string;
  creatorId: string;
  creatorUsername: string;
  creatorDisplayName: string;
  creatorAvatarUrl: string;
  likeCount: number;
}

const CREATORS = [
  { id: "lumina-maya", username: "maya_lens", displayName: "Maya Chen", avatarUrl: "/style-previews/photorealistic.jpg" },
  { id: "lumina-alex", username: "alex_frames", displayName: "Alex Rivera", avatarUrl: "/style-previews/cinematic.jpg" },
  { id: "lumina-sam", username: "sam_glow", displayName: "Sam Okonkwo", avatarUrl: "/style-previews/anime.jpg" },
  { id: "lumina-jade", username: "jade_pixel", displayName: "Jade Park", avatarUrl: "/style-previews/fantasy.jpg" },
];

export const EXPLORE_CATALOG: ExploreCatalogEntry[] = GENERATION_STYLES.map((style, index) => {
  const creator = CREATORS[index % CREATORS.length];
  const prompts: Record<string, string> = {
    photorealistic: "portrait in golden hour light, shallow depth of field, natural skin tones, 85mm lens",
    cinematic: "lonely figure on a rain-soaked city street, neon reflections, anamorphic bokeh",
    anime: "anime character in a cherry blossom garden, soft pastel sky, detailed eyes",
    "oil-painting": "still life of fruit and flowers, classical oil painting, rich brushwork",
    watercolor: "misty mountain valley at sunrise, soft watercolor washes, paper texture",
    "3d-render": "cute robot explorer on an alien planet, octane render, vivid colors",
    cyberpunk: "cyberpunk alley with holographic signs, rain and neon, moody atmosphere",
    fantasy: "floating castle above cloud sea, magical aurora, epic fantasy landscape",
    minimalist: "minimal interior with single chair by window, clean lines, soft daylight",
    vintage: "1970s road trip portrait, warm faded film tones, open highway",
    sketch: "expressive pencil portrait, crosshatching, graphite on textured paper",
    "pop-art": "pop art portrait, bold primary colors, halftone dots, comic style",
  };

  return {
    slug: style.id,
    prompt: prompts[style.id] ?? `${style.label} scene, highly detailed, ${style.suffix}`,
    styleId: style.id,
    creatorId: creator.id,
    creatorUsername: creator.username,
    creatorDisplayName: creator.displayName,
    creatorAvatarUrl: creator.avatarUrl,
    likeCount: Math.max(3, 52 - index * 4),
  };
});

export function catalogImageUrl(slug: string): string {
  return `/explore/${slug}.jpg`;
}
