import { v4 as uuidv4 } from "uuid";
import type { ExplorePost } from "@/lib/types/explore";
import { GENERATION_STYLES } from "@/lib/constants/generationStyles";

const DEMO_CREATORS = [
  { id: "creator-maya", username: "maya_lens", displayName: "Maya Chen", avatarUrl: "https://picsum.photos/seed/maya-lens/64/64" },
  { id: "creator-alex", username: "alex_frames", displayName: "Alex Rivera", avatarUrl: "https://picsum.photos/seed/alex-frames/64/64" },
  { id: "creator-sam", username: "sam_glow", displayName: "Sam Okonkwo", avatarUrl: "https://picsum.photos/seed/sam-glow/64/64" },
  { id: "creator-jade", username: "jade_pixel", displayName: "Jade Park", avatarUrl: "https://picsum.photos/seed/jade-pixel/64/64" },
];

const DEMO_PROMPTS = [
  "misty forest at dawn, cinematic light rays through tall pines",
  "portrait of a fox in wildflowers, soft golden hour glow",
  "futuristic city skyline reflected in rain puddles, neon accents",
  "cozy cabin interior, warm fireplace, snow outside the window",
  "underwater coral reef teeming with tropical fish, vivid colors",
  "minimalist product shot of ceramic vase, studio lighting",
  "astronaut walking on Mars, dust storm on the horizon",
  "vintage motorcycle on a desert highway, film grain",
  "bioluminescent mushrooms in a dark enchanted forest",
  "abstract fluid art, iridescent purple and teal waves",
  "street market at night, lanterns and steam rising from food stalls",
  "snow leopard on a rocky cliff, dramatic mountain backdrop",
];

export function buildSeedExplorePosts(): ExplorePost[] {
  const now = Date.now();

  return DEMO_PROMPTS.map((prompt, index) => {
    const creator = DEMO_CREATORS[index % DEMO_CREATORS.length];
    const style = GENERATION_STYLES[index % GENERATION_STYLES.length];
    const seed = `explore-seed-${index + 1}`;
    const imageUrl = `https://picsum.photos/seed/${seed}/800/800`;

    return {
      id: uuidv4(),
      imageUrl,
      thumbnailUrl: `https://picsum.photos/seed/${seed}/400/400`,
      prompt,
      styleId: style.id,
      creatorId: creator.id,
      creatorUsername: creator.username,
      creatorDisplayName: creator.displayName,
      creatorAvatarUrl: creator.avatarUrl,
      likeCount: Math.max(1, 48 - index * 3 + (index % 4) * 7),
      sourceKey: `seed:${seed}`,
      source: "seed",
      createdAt: new Date(now - index * 3600_000 * 6).toISOString(),
    };
  });
}
