"use client";

import { useRouter } from "next/navigation";
import type { ExplorePostView } from "@/lib/types/explore";
import { isExploreVideo } from "@/lib/explore/exploreMedia";
import { getLocalProfile } from "@/lib/user/localProfile";
import { useEditorStore } from "@/lib/store/editorStore";
import { useExploreStore } from "@/lib/store/exploreStore";

export function ExploreGrid({ embedded = false }: { embedded?: boolean }) {
  const posts = useExploreStore((s) => s.posts);
  const filterTab = useExploreStore((s) => s.filterTab);
  const isLoading = useExploreStore((s) => s.isLoading);
  const setSelectedPost = useExploreStore((s) => s.setSelectedPost);
  const toggleLike = useExploreStore((s) => s.toggleLike);
  const toggleFollow = useExploreStore((s) => s.toggleFollow);

  const centerStyle = embedded
    ? { display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px 64px", minHeight: "min(40vh, 360px)" }
    : { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 48 };

  if (isLoading) {
    return (
      <div style={centerStyle}>
        <div className="spinner" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div style={centerStyle}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, margin: "0 0 8px" }}>
            {filterTab === "liked" ? "No liked images yet" : "Nothing to explore yet"}
          </p>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>
            {filterTab === "liked"
              ? "Tap the heart on any image to save it here."
              : "Generate with the prompt above — images appear here automatically."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={embedded ? { padding: "8px 12px 32px" } : { flex: 1, overflowY: "auto", padding: "8px 12px 32px" }}>
      <div style={{ columnCount: 3, columnGap: 6, maxWidth: "none", margin: "0 auto" }}>
        {posts.map((post) => (
          <ExploreTile
            key={post.id}
            post={post}
            onOpen={() => setSelectedPost(post.id)}
            onLike={() => void toggleLike(post.id)}
            onFollow={() => void toggleFollow(post.creatorId)}
          />
        ))}
      </div>
    </div>
  );
}

const overlayBtnStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 8,
  padding: "6px 10px",
  background: "rgba(0,0,0,0.5)",
  color: "#fff",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  backdropFilter: "blur(4px)",
  whiteSpace: "nowrap",
};

function ExploreTile({
  post,
  onOpen,
  onLike,
  onFollow,
}: {
  post: ExplorePostView;
  onOpen: () => void;
  onLike: () => void;
  onFollow: () => void;
}) {
  const router = useRouter();
  const createProjectFromDataUrl = useEditorStore((s) => s.createProjectFromDataUrl);
  const localProfile = getLocalProfile();
  const isOwnPost = localProfile?.id === post.creatorId;
  const isVideo = isExploreVideo(post);

  const editCopy = async (e: React.MouseEvent) => {
    if (isVideo) return;
    e.stopPropagation();
    const name = `${post.prompt.slice(0, 36) || "Explore image"} (copy)`;
    const projectId = await createProjectFromDataUrl(post.imageUrl, name);
    router.push(`/editor/${projectId}`);
  };

  return (
    <div
      className="explore-tile"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      style={{
        breakInside: "avoid",
        marginBottom: 4,
        position: "relative",
        borderRadius: 2,
        overflow: "hidden",
        cursor: "pointer",
        background: "var(--color-surface-input)",
      }}
    >
      {isVideo ? (
        <video
          src={post.imageUrl}
          muted
          loop
          playsInline
          autoPlay
          style={{ width: "100%", display: "block", objectFit: "cover", pointerEvents: "none", aspectRatio: "9 / 16" }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.thumbnailUrl || post.imageUrl}
          alt={post.prompt}
          loading="lazy"
          draggable={false}
          style={{ width: "100%", display: "block", objectFit: "cover", pointerEvents: "none" }}
        />
      )}
      {isVideo && (
        <span className="explore-tile-video-badge" aria-hidden>
          ▶
        </span>
      )}

      <div className="explore-tile-overlay">
        <div className="explore-tile-actions" style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.creatorAvatarUrl}
            alt=""
            width={28}
            height={28}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
              border: "1.5px solid rgba(255,255,255,0.8)",
              pointerEvents: "none",
            }}
          />
          <span
            style={{
              flex: 1,
              fontSize: 12,
              fontWeight: 600,
              color: "#fff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textShadow: "0 1px 3px rgba(0,0,0,0.5)",
              pointerEvents: "none",
            }}
          >
            {post.creatorDisplayName}
          </span>
          {!isOwnPost && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFollow();
              }}
              style={{
                ...overlayBtnStyle,
                background: post.isFollowing ? "rgba(255,255,255,0.2)" : "var(--color-accent)",
                flexShrink: 0,
              }}
            >
              {post.isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>

        <div className="explore-tile-actions">
          <p className="explore-tile-prompt">{post.prompt}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, gap: 8 }}>
            {!isVideo && (
              <button type="button" onClick={(e) => void editCopy(e)} style={overlayBtnStyle}>
                Edit copy
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              style={{
                ...overlayBtnStyle,
                color: post.likedByMe ? "#ff6b8a" : "#fff",
                marginLeft: "auto",
              }}
            >
              {post.likedByMe ? "♥" : "♡"} {post.likeCount}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
