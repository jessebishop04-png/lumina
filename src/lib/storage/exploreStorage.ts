import type { ExplorePost, ExploreComment } from "@/lib/types/explore";
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

export function getCommentsForPost(postId: string): ExploreComment[] {
  const list = readAllComments()[postId] ?? [];
  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function saveExploreComment(comment: ExploreComment): void {
  const all = readAllComments();
  const list = all[comment.postId] ?? [];
  all[comment.postId] = [comment, ...list];
  writeAllComments(all);
}
