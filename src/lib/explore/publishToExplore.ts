import { v4 as uuidv4 } from "uuid";
import { createLibraryPreview, ensureDataUrl } from "@/lib/image/imageProcessor";
import type { ExplorePost } from "@/lib/types/explore";
import { requireLocalProfile } from "@/lib/user/localProfile";
import { getExplorePostBySourceKey, saveExplorePost } from "@/lib/storage/exploreStorage";

export interface PublishToExploreInput {
  imageUrl: string;
  prompt: string;
  styleId?: string | null;
  source: "generate" | "editor";
  sourceKey: string;
}

export async function publishToExplore(input: PublishToExploreInput): Promise<ExplorePost | null> {
  const existing = await getExplorePostBySourceKey(input.sourceKey);
  if (existing) return existing;

  const profile = requireLocalProfile();
  let imageUrl = input.imageUrl;
  let thumbnailUrl = input.imageUrl;

  try {
    const dataUrl = await ensureDataUrl(input.imageUrl);
    imageUrl = dataUrl;
    thumbnailUrl = await createLibraryPreview(dataUrl);
  } catch {
    // Keep remote URLs for thumbnails when conversion fails (e.g. CORS on seed images).
    thumbnailUrl = input.imageUrl;
  }

  const post: ExplorePost = {
    id: uuidv4(),
    imageUrl,
    thumbnailUrl,
    prompt: input.prompt.trim() || "AI generated image",
    styleId: input.styleId ?? null,
    creatorId: profile.id,
    creatorUsername: profile.username,
    creatorDisplayName: profile.displayName,
    creatorAvatarUrl: profile.avatarUrl,
    likeCount: 0,
    sourceKey: input.sourceKey,
    source: input.source,
    createdAt: new Date().toISOString(),
  };

  await saveExplorePost(post);
  return post;
}
