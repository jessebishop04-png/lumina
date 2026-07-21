import type { ExplorePost, ExploreComment, ExploreCommentView } from "@/lib/types/explore";
import { openDB, STORES } from "./db";

export async function saveExplorePost(post: ExplorePost): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORES.explorePosts, "readwrite");
    tx.objectStore(STORES.explorePosts).put(post);
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
  });
}

export async function getExplorePosts(): Promise<ExplorePost[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.explorePosts, "readonly");
    const request = tx.objectStore(STORES.explorePosts).getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve((request.result as ExplorePost[]) ?? []);
    tx.oncomplete = () => db.close();
  });
}

export async function getExplorePostBySourceKey(sourceKey: string): Promise<ExplorePost | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.explorePosts, "readonly");
    const store = tx.objectStore(STORES.explorePosts);

    const finish = (post: ExplorePost | null) => {
      tx.oncomplete = () => db.close();
      resolve(post);
    };

    try {
      const request = store.index("sourceKey").get(sourceKey);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => finish((request.result as ExplorePost) ?? null);
    } catch {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const posts = (request.result as ExplorePost[]) ?? [];
        finish(posts.find((p) => p.sourceKey === sourceKey) ?? null);
      };
    }
  });
}

export async function updateExplorePost(post: ExplorePost): Promise<void> {
  await saveExplorePost(post);
}

export async function deleteExplorePost(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORES.explorePosts, "readwrite");
    tx.objectStore(STORES.explorePosts).delete(id);
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
  });
}

export async function replaceCatalogExplorePosts(posts: ExplorePost[]): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORES.explorePosts, "readwrite");
    const store = tx.objectStore(STORES.explorePosts);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const existing = (request.result as ExplorePost[]) ?? [];
      for (const post of existing) {
        if (post.source === "seed" || post.imageUrl.includes("picsum.photos")) {
          store.delete(post.id);
        }
      }
      for (const post of posts) {
        store.put(post);
      }
    };
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
  });
}

const LIKES_KEY = "lumina-explore-likes";
const FOLLOWS_KEY = "lumina-explore-follows";

export function getLikedPostIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function setLikedPostIds(ids: Set<string>): void {
  localStorage.setItem(LIKES_KEY, JSON.stringify([...ids]));
}

export function getFollowedCreatorIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(FOLLOWS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function setFollowedCreatorIds(ids: Set<string>): void {
  localStorage.setItem(FOLLOWS_KEY, JSON.stringify([...ids]));
}

const COMMENTS_KEY = "lumina-explore-comments";
const COMMENT_LIKES_KEY = "lumina-explore-comment-likes";

function readAllComments(): Record<string, ExploreComment[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(COMMENTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ExploreComment[]>) : {};
  } catch {
    return {};
  }
}

function writeAllComments(all: Record<string, ExploreComment[]>): void {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
}

export function getLikedCommentIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(COMMENT_LIKES_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function setLikedCommentIds(ids: Set<string>): void {
  localStorage.setItem(COMMENT_LIKES_KEY, JSON.stringify([...ids]));
}

function enrichComment(comment: ExploreComment): ExploreCommentView {
  const liked = getLikedCommentIds();
  return {
    ...comment,
    parentId: comment.parentId ?? null,
    likeCount: comment.likeCount ?? 0,
    likedByMe: liked.has(comment.id),
  };
}

export function getCommentsForPost(postId: string): ExploreCommentView[] {
  const list = readAllComments()[postId] ?? [];
  return [...list]
    .map(enrichComment)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function saveExploreComment(comment: ExploreComment): void {
  const all = readAllComments();
  const list = all[comment.postId] ?? [];
  all[comment.postId] = [comment, ...list];
  writeAllComments(all);
}

export function updateExploreComment(
  postId: string,
  commentId: string,
  updates: Partial<ExploreComment>
): void {
  const all = readAllComments();
  const list = all[postId] ?? [];
  all[postId] = list.map((c) => (c.id === commentId ? { ...c, ...updates } : c));
  writeAllComments(all);
}

export function toggleCommentLikeInStorage(
  commentId: string,
  postId: string
): { likeCount: number; likedByMe: boolean } | null {
  const all = readAllComments();
  const list = all[postId] ?? [];
  const comment = list.find((c) => c.id === commentId);
  if (!comment) return null;

  const liked = getLikedCommentIds();
  const nextLiked = new Set(liked);
  let likeCount = comment.likeCount ?? 0;

  if (nextLiked.has(commentId)) {
    nextLiked.delete(commentId);
    likeCount = Math.max(0, likeCount - 1);
  } else {
    nextLiked.add(commentId);
    likeCount += 1;
  }

  setLikedCommentIds(nextLiked);
  updateExploreComment(postId, commentId, { likeCount });
  return { likeCount, likedByMe: nextLiked.has(commentId) };
}
