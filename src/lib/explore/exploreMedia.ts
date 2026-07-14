import type { ExplorePost } from "@/lib/types/explore";

export function isExploreVideo(post: Pick<ExplorePost, "mediaType" | "imageUrl">): boolean {
  if (post.mediaType === "video") return true;
  return post.imageUrl.startsWith("data:video") || /\.mp4(\?|$)/i.test(post.imageUrl);
}
