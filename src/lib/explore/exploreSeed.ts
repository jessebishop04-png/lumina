import { v4 as uuidv4 } from "uuid";
import type { ExplorePost } from "@/lib/types/explore";
import { catalogImageUrl, EXPLORE_CATALOG } from "@/lib/explore/exploreCatalog";

export function buildCatalogExplorePosts(): ExplorePost[] {
  const now = Date.now();

  return EXPLORE_CATALOG.map((entry, index) => {
    const imageUrl = catalogImageUrl(entry.slug);
    return {
      id: uuidv4(),
      imageUrl,
      thumbnailUrl: imageUrl,
      prompt: entry.prompt,
      styleId: entry.styleId,
      creatorId: entry.creatorId,
      creatorUsername: entry.creatorUsername,
      creatorDisplayName: entry.creatorDisplayName,
      creatorAvatarUrl: entry.creatorAvatarUrl,
      likeCount: entry.likeCount,
      sourceKey: `catalog:${entry.slug}`,
      source: "seed" as const,
      createdAt: new Date(now - index * 3600_000 * 4).toISOString(),
    };
  });
}

/** @deprecated Use buildCatalogExplorePosts */
export function buildSeedExplorePosts(): ExplorePost[] {
  return buildCatalogExplorePosts();
}
