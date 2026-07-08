export interface ExplorePost {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  prompt: string;
  styleId?: string | null;
  creatorId: string;
  creatorUsername: string;
  creatorDisplayName: string;
  creatorAvatarUrl: string;
  likeCount: number;
  /** Unique key to avoid duplicate publishes from the same source image. */
  sourceKey: string;
  source: "generate" | "editor" | "seed";
  createdAt: string;
}

export interface ExplorePostView extends ExplorePost {
  likedByMe: boolean;
  isFollowing: boolean;
}

export interface ExploreComment {
  id: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatarUrl: string;
  text: string;
  createdAt: string;
}

export type ExploreFilter = "popular" | "liked";

export interface LocalUserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}
