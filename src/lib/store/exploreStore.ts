import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { ExplorePost, ExplorePostView, ExploreComment } from "@/lib/types/explore";
import { buildSeedExplorePosts } from "@/lib/explore/exploreSeed";
import { getGenerationJobs } from "@/lib/storage/generationStorage";
import {
  getExplorePosts,
  getFollowedCreatorIds,
  getLikedPostIds,
  getCommentsForPost,
  saveExplorePost,
  saveExploreComment,
  setFollowedCreatorIds,
  setLikedPostIds,
  updateExplorePost,
} from "@/lib/storage/exploreStorage";
import { publishToExplore } from "@/lib/explore/publishToExplore";
import { requireLocalProfile } from "@/lib/user/localProfile";

import type { ExploreFilter } from "@/lib/types/explore";

interface ExploreState {
  posts: ExplorePostView[];
  allPosts: ExplorePostView[];
  filterTab: ExploreFilter;
  isLoading: boolean;
  selectedPostId: string | null;
  copiedPromptId: string | null;
  postComments: ExploreComment[];

  loadExplore: () => Promise<void>;
  syncFromGenerations: () => Promise<void>;
  setFilterTab: (tab: ExploreFilter) => void;
  toggleLike: (postId: string) => Promise<void>;
  toggleFollow: (creatorId: string) => Promise<void>;
  setSelectedPost: (postId: string | null) => void;
  loadPostComments: (postId: string) => void;
  addComment: (postId: string, text: string) => Promise<void>;
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

export const useExploreStore = create<ExploreState>((set, get) => ({
  posts: [],
  allPosts: [],
  filterTab: "popular",
  isLoading: false,
  selectedPostId: null,
  copiedPromptId: null,
  postComments: [],

  loadExplore: async () => {
    set({ isLoading: true });
    try {
      let posts = await getExplorePosts();
      if (posts.length === 0) {
        const seeds = buildSeedExplorePosts();
        try {
          await Promise.all(seeds.map((post) => saveExplorePost(post)));
          posts = seeds;
        } catch (persistErr) {
          console.warn("Could not persist explore seeds, showing in memory:", persistErr);
          posts = seeds;
        }
      }

      const enriched = enrichPosts(posts);
      set({ allPosts: enriched, posts: applyFilter(enriched, get().filterTab) });
    } catch (err) {
      console.error("Failed to load explore:", err);
      const seeds = buildSeedExplorePosts();
      const enriched = enrichPosts(seeds);
      set({ allPosts: enriched, posts: applyFilter(enriched, get().filterTab) });
    } finally {
      set({ isLoading: false });
    }

    void get()
      .syncFromGenerations()
      .then(async () => {
        const posts = await getExplorePosts();
        if (posts.length === 0) return;
        const enriched = enrichPosts(posts);
        set({ allPosts: enriched, posts: applyFilter(enriched, get().filterTab) });
      })
      .catch((err) => console.warn("Explore generation sync skipped:", err));
  },

  setFilterTab: (tab) => {
    set((state) => ({
      filterTab: tab,
      posts: applyFilter(state.allPosts, tab),
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
            source: "generate",
            sourceKey: `gen:${job.id}:${image.id}`,
          });
        } catch (err) {
          console.warn("Skipped explore publish for generation image:", err);
        }
      }
    }
  },

  toggleLike: async (postId) => {
    const liked = getLikedPostIds();
    const post = get().posts.find((p) => p.id === postId);
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
        posts: applyFilter(allPosts, state.filterTab),
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

  addComment: async (postId, text) => {
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
    };

    saveExploreComment(comment);
    set((state) => ({
      postComments: [comment, ...state.postComments.filter((c) => c.id !== comment.id)],
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
      posts: applyFilter(allPosts, state.filterTab),
    };
  });
}
