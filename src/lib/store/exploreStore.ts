import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { ExplorePost, ExplorePostView, ExploreComment, ExploreCommentView } from "@/lib/types/explore";
import { EXPLORE_CATALOG_VERSION } from "@/lib/explore/exploreCatalog";
import { buildCatalogExplorePosts } from "@/lib/explore/exploreSeed";
import { getGenerationJobs } from "@/lib/storage/generationStorage";
import {
  getExplorePosts,
  getFollowedCreatorIds,
  getLikedPostIds,
  getCommentsForPost,
  replaceCatalogExplorePosts,
  saveExploreComment,
  deleteExploreComment,
  setFollowedCreatorIds,
  setLikedPostIds,
  toggleCommentLikeInStorage,
  updateExplorePost,
} from "@/lib/storage/exploreStorage";
import { publishToExplore } from "@/lib/explore/publishToExplore";
import { requireLocalProfile } from "@/lib/user/localProfile";

import type { ExploreFilter } from "@/lib/types/explore";
import type { LibraryMediaFilter } from "@/lib/library/libraryFilters";
import { isExploreVideo } from "@/lib/explore/exploreMedia";

const CATALOG_STORAGE_KEY = "lumina-explore-catalog-version";

interface ExploreState {
  posts: ExplorePostView[];
  allPosts: ExplorePostView[];
  filterTab: ExploreFilter;
  mediaFilter: LibraryMediaFilter;
  isLoading: boolean;
  selectedPostId: string | null;
  copiedPromptId: string | null;
  postComments: ExploreCommentView[];

  loadExplore: () => Promise<void>;
  syncFromGenerations: () => Promise<void>;
  setFilterTab: (tab: ExploreFilter) => void;
  setMediaFilter: (filter: LibraryMediaFilter) => void;
  toggleLike: (postId: string) => Promise<void>;
  toggleFollow: (creatorId: string) => Promise<void>;
  setSelectedPost: (postId: string | null) => void;
  loadPostComments: (postId: string) => void;
  addComment: (postId: string, text: string, parentId?: string | null) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  toggleCommentLike: (postId: string, commentId: string) => Promise<void>;
  markPromptCopied: (postId: string) => void;
}

function sortPosts(posts: ExplorePostView[]): ExplorePostView[] {
  return [...posts].sort((a, b) => {
    if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function enrichPosts(posts: ExplorePost[]): ExplorePostView[] {
  const liked = getLikedPostIds();
  const following = getFollowedCreatorIds();
  return posts.map((post) => ({
    ...post,
    likedByMe: liked.has(post.id),
    isFollowing: following.has(post.creatorId),
  }));
}

function applyFilter(posts: ExplorePostView[], filterTab: ExploreFilter): ExplorePostView[] {
  if (filterTab === "liked") {
    return [...posts]
      .filter((p) => p.likedByMe)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return sortPosts(posts);
}

async function ensureCatalogPosts(): Promise<ExplorePost[]> {
  const catalogVersion = typeof window !== "undefined" ? localStorage.getItem(CATALOG_STORAGE_KEY) : null;
  let posts = await getExplorePosts();

  const hasLegacyPlaceholders = posts.some(
    (p) => p.source === "seed" && (p.imageUrl.includes("picsum.photos") || !p.sourceKey.startsWith("catalog:"))
  );
  const needsCatalog = posts.length === 0 || catalogVersion !== EXPLORE_CATALOG_VERSION || hasLegacyPlaceholders;

  if (needsCatalog) {
    const catalog = buildCatalogExplorePosts();
    try {
      await replaceCatalogExplorePosts(catalog);
      posts = await getExplorePosts();
      if (typeof window !== "undefined") {
        localStorage.setItem(CATALOG_STORAGE_KEY, EXPLORE_CATALOG_VERSION);
      }
    } catch (err) {
      console.warn("Could not persist explore catalog, showing in memory:", err);
      const userPosts = posts.filter((p) => p.source !== "seed" && !p.imageUrl.includes("picsum.photos"));
      posts = [...catalog, ...userPosts];
    }
  }

  return posts;
}

function applyExploreFilters(
  posts: ExplorePostView[],
  filterTab: ExploreFilter,
  mediaFilter: LibraryMediaFilter,
): ExplorePostView[] {
  let filtered = posts;
  if (mediaFilter === "photos") {
    filtered = filtered.filter((p) => !isExploreVideo(p));
  } else if (mediaFilter === "videos") {
    filtered = filtered.filter((p) => isExploreVideo(p));
  }
  return applyFilter(filtered, filterTab);
}

export const useExploreStore = create<ExploreState>((set, get) => ({
  posts: [],
  allPosts: [],
  filterTab: "popular",
  mediaFilter: "all",
  isLoading: false,
  selectedPostId: null,
  copiedPromptId: null,
  postComments: [],

  loadExplore: async () => {
    set({ isLoading: true });
    try {
      const posts = await ensureCatalogPosts();
      const enriched = enrichPosts(posts);
      set({ allPosts: enriched, posts: applyExploreFilters(enriched, get().filterTab, get().mediaFilter) });
    } catch (err) {
      console.error("Failed to load explore:", err);
      const catalog = buildCatalogExplorePosts();
      const enriched = enrichPosts(catalog);
      set({ allPosts: enriched, posts: applyExploreFilters(enriched, get().filterTab, get().mediaFilter) });
    } finally {
      set({ isLoading: false });
    }

    void get()
      .syncFromGenerations()
      .then(async () => {
        const posts = await getExplorePosts();
        if (posts.length === 0) return;
        const enriched = enrichPosts(posts);
        set({ allPosts: enriched, posts: applyExploreFilters(enriched, get().filterTab, get().mediaFilter) });
      })
      .catch((err) => console.warn("Explore generation sync skipped:", err));
  },

  setFilterTab: (tab) => {
    set((state) => ({
      filterTab: tab,
      posts: applyExploreFilters(state.allPosts, tab, state.mediaFilter),
    }));
  },

  setMediaFilter: (filter) => {
    set((state) => ({
      mediaFilter: filter,
      posts: applyExploreFilters(state.allPosts, state.filterTab, filter),
    }));
  },

  syncFromGenerations: async () => {
    const jobs = await getGenerationJobs();
    for (const job of jobs) {
      if (job.status !== "complete") continue;
      for (const image of job.images) {
        try {
          await publishToExplore({
            imageUrl: image.url,
            prompt: job.prompt,
            styleId: job.styleId,
            mediaType: image.mediaType ?? "image",
            source: "generate",
            sourceKey: `gen:${job.id}:${image.id}`,
          });
        } catch (err) {
          console.warn("Skipped explore publish for generation image:", err);
        }
      }
      for (const animation of job.animations ?? []) {
        if (animation.status !== "complete" || !animation.video) continue;
        try {
          await publishToExplore({
            imageUrl: animation.video.url,
            prompt: animation.prompt,
            styleId: animation.styleId ?? job.styleId,
            mediaType: "video",
            source: "generate",
            sourceKey: `gen:${job.id}:anim:${animation.id}`,
          });
        } catch (err) {
          console.warn("Skipped explore publish for animation video:", err);
        }
      }
    }
  },

  toggleLike: async (postId) => {
    const liked = getLikedPostIds();
    const post = get().posts.find((p) => p.id === postId) ?? get().allPosts.find((p) => p.id === postId);
    if (!post) return;

    const nextLiked = new Set(liked);
    let likeCount = post.likeCount;

    if (nextLiked.has(postId)) {
      nextLiked.delete(postId);
      likeCount = Math.max(0, likeCount - 1);
    } else {
      nextLiked.add(postId);
      likeCount += 1;
    }

    setLikedPostIds(nextLiked);

    const updated: ExplorePost = { ...post, likeCount };
    await updateExplorePost(updated);

    set((state) => {
      const allPosts = sortPosts(
        state.allPosts.map((p) =>
          p.id === postId ? { ...p, likeCount, likedByMe: nextLiked.has(postId) } : p
        )
      );
      return {
        allPosts,
        posts: applyExploreFilters(allPosts, state.filterTab, state.mediaFilter),
      };
    });
  },

  toggleFollow: async (creatorId) => {
    const following = getFollowedCreatorIds();
    const nextFollowing = new Set(following);

    if (nextFollowing.has(creatorId)) {
      nextFollowing.delete(creatorId);
    } else {
      nextFollowing.add(creatorId);
    }

    setFollowedCreatorIds(nextFollowing);

    set((state) => ({
      allPosts: state.allPosts.map((p) =>
        p.creatorId === creatorId ? { ...p, isFollowing: nextFollowing.has(creatorId) } : p
      ),
      posts: state.posts.map((p) =>
        p.creatorId === creatorId ? { ...p, isFollowing: nextFollowing.has(creatorId) } : p
      ),
    }));
  },

  setSelectedPost: (postId) => {
    set({ selectedPostId: postId, postComments: postId ? getCommentsForPost(postId) : [] });
  },

  loadPostComments: (postId) => {
    set({ postComments: getCommentsForPost(postId) });
  },

  addComment: async (postId, text, parentId = null) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const profile = requireLocalProfile();
    const comment: ExploreComment = {
      id: uuidv4(),
      postId,
      authorId: profile.id,
      authorUsername: profile.username,
      authorDisplayName: profile.displayName,
      authorAvatarUrl: profile.avatarUrl,
      text: trimmed,
      createdAt: new Date().toISOString(),
      parentId: parentId ?? null,
      likeCount: 0,
    };

    saveExploreComment(comment);
    const view: ExploreCommentView = {
      ...comment,
      parentId: comment.parentId ?? null,
      likeCount: 0,
      likedByMe: false,
    };
    set((state) => ({
      postComments: [view, ...state.postComments.filter((c) => c.id !== comment.id)],
    }));
  },

  deleteComment: async (postId, commentId) => {
    const profile = requireLocalProfile();
    const deleted = deleteExploreComment(postId, commentId, profile.id);
    if (!deleted) return;

    set({ postComments: getCommentsForPost(postId) });
  },

  toggleCommentLike: async (postId, commentId) => {
    const result = toggleCommentLikeInStorage(commentId, postId);
    if (!result) return;

    set((state) => ({
      postComments: state.postComments.map((c) =>
        c.id === commentId ? { ...c, likeCount: result.likeCount, likedByMe: result.likedByMe } : c
      ),
    }));
  },

  markPromptCopied: (postId) => {
    set({ copiedPromptId: postId });
    setTimeout(() => {
      if (get().copiedPromptId === postId) set({ copiedPromptId: null });
    }, 2000);
  },
}));

/** Call after a new image is generated to refresh explore if the page is open. */
export function notifyExploreNewPost(post: ExplorePost): void {
  const liked = getLikedPostIds();
  const following = getFollowedCreatorIds();
  const view: ExplorePostView = {
    ...post,
    likedByMe: liked.has(post.id),
    isFollowing: following.has(post.creatorId),
  };

  useExploreStore.setState((state) => {
    if (state.allPosts.some((p) => p.id === post.id || p.sourceKey === post.sourceKey)) {
      return state;
    }
    const allPosts = sortPosts([view, ...state.allPosts]);
    return {
      allPosts,
      posts: applyExploreFilters(allPosts, state.filterTab, state.mediaFilter),
    };
  });
}
