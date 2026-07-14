import { v4 as uuidv4 } from "uuid";
import { createLibraryPreview, ensureDataUrl } from "@/lib/image/imageProcessor";
import type { ExplorePost } from "@/lib/types/explore";
import { requireLocalProfile } from "@/lib/user/localProfile";
import { getExplorePostBySourceKey, saveExplorePost } from "@/lib/storage/exploreStorage";

export interface PublishToExploreInput {
  imageUrl: string;
  prompt: string;
  styleId?: string | null;
  mediaType?: "image" | "video";
  source: "generate" | "editor";
  sourceKey: string;
}

function isVideoUrl(url: string): boolean {
  return url.startsWith("data:video") || /\.mp4(\?|$)/i.test(url);
}

export async function publishToExplore(input: PublishToExploreInput): Promise<ExplorePost | null> {
  const existing = await getExplorePostBySourceKey(input.sourceKey);
  if (existing) return existing;

  const profile = requireLocalProfile();
  const isVideo = input.mediaType === "video" || isVideoUrl(input.imageUrl);
  let imageUrl = input.imageUrl;
  let thumbnailUrl = input.imageUrl;

  if (isVideo) {
    try {
      imageUrl = await ensureDataUrl(input.imageUrl);
    } catch {
      // Keep remote video URLs when conversion fails.
    }
    thumbnailUrl = imageUrl;
  } else {
    try {
      const dataUrl = await ensureDataUrl(input.imageUrl);
      imageUrl = dataUrl;
      thumbnailUrl = await createLibraryPreview(dataUrl);
    } catch {
      thumbnailUrl = input.imageUrl;
    }
  }

  const post: ExplorePost = {
    id: uuidv4(),
    imageUrl,
    thumbnailUrl,
    prompt: input.prompt.trim() || (isVideo ? "AI generated video" : "AI generated image"),
    styleId: input.styleId ?? null,
    mediaType: isVideo ? "video" : "image",
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
