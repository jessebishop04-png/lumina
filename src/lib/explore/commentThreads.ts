import type { ExploreCommentThread, ExploreCommentView } from "@/lib/types/explore";

export function buildCommentThreads(comments: ExploreCommentView[]): ExploreCommentThread[] {
  const repliesByParent = new Map<string, ExploreCommentView[]>();

  for (const comment of comments) {
    if (!comment.parentId) continue;
    const list = repliesByParent.get(comment.parentId) ?? [];
    list.push(comment);
    repliesByParent.set(comment.parentId, list);
  }

  for (const replies of repliesByParent.values()) {
    replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  return comments
    .filter((c) => !c.parentId)
    .map((comment) => {
      const replies = repliesByParent.get(comment.id) ?? [];
      return {
        ...comment,
        replies,
        replyCount: replies.length,
      };
    });
}
