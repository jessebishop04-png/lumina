"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getStyleById } from "@/lib/constants/generationStyles";
import { copyExplorePrompt, downloadExploreImage } from "@/lib/explore/exploreActions";
import { useEditorStore } from "@/lib/store/editorStore";
import { useExploreStore } from "@/lib/store/exploreStore";
import { ExplorePostActionsMenu } from "@/components/explore/ExplorePostActionsMenu";
import { ModalPortal } from "@/components/layout/ModalPortal";

export function ExplorePostModal() {
  const router = useRouter();
  const posts = useExploreStore((s) => s.posts);
  const allPosts = useExploreStore((s) => s.allPosts);
  const selectedPostId = useExploreStore((s) => s.selectedPostId);
  const copiedPromptId = useExploreStore((s) => s.copiedPromptId);
  const postComments = useExploreStore((s) => s.postComments);
  const setSelectedPost = useExploreStore((s) => s.setSelectedPost);
  const toggleLike = useExploreStore((s) => s.toggleLike);
  const toggleFollow = useExploreStore((s) => s.toggleFollow);
  const markPromptCopied = useExploreStore((s) => s.markPromptCopied);
  const addComment = useExploreStore((s) => s.addComment);
  const createProjectFromDataUrl = useEditorStore((s) => s.createProjectFromDataUrl);
  const [commentDraft, setCommentDraft] = useState("");

  if (!selectedPostId) return null;

  const post = posts.find((p) => p.id === selectedPostId) ?? allPosts.find((p) => p.id === selectedPostId);
  if (!post) return null;

  const style = getStyleById(post.styleId ?? null);
  const close = () => {
    setCommentDraft("");
    setSelectedPost(null);
  };

  const editCopy = async () => {
    const name = `${post.prompt.slice(0, 36) || "Explore image"} (copy)`;
    const projectId = await createProjectFromDataUrl(post.imageUrl, name);
    close();
    router.push(`/editor/${projectId}`);
  };

  const submitComment = async () => {
    if (!commentDraft.trim()) return;
    await addComment(post.id, commentDraft);
    setCommentDraft("");
  };

  return (
    <ModalPortal>
      <div className="explore-modal-backdrop" onClick={close}>
        <div className="explore-modal-panel" onClick={(e) => e.stopPropagation()}>
          <div className="explore-modal-image-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.imageUrl} alt={post.prompt} className="explore-modal-image" />
          </div>

          <aside className="explore-modal-sidebar">
            <div className="explore-modal-header">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.creatorAvatarUrl} alt="" width={40} height={40} className="explore-modal-avatar" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="explore-modal-creator-name">{post.creatorDisplayName}</p>
                <p className="explore-modal-creator-handle">@{post.creatorUsername}</p>
              </div>
              <button
                type="button"
                className="explore-modal-btn explore-modal-btn--accent"
                data-following={post.isFollowing ? "true" : "false"}
                onClick={() => void toggleFollow(post.creatorId)}
              >
                {post.isFollowing ? "Following" : "Follow"}
              </button>
            </div>

            <div className="explore-modal-body">
              <p className="explore-modal-section-label">Prompt</p>
              <p className="explore-modal-prompt">{post.prompt}</p>

              {style && (
                <div className="explore-modal-style">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={style.previewUrl} alt="" width={28} height={28} />
                  <span>{style.label} style</span>
                </div>
              )}

              <p className="explore-modal-meta">
                {post.likeCount} {post.likeCount === 1 ? "like" : "likes"} · {new Date(post.createdAt).toLocaleDateString()}
              </p>

              <div className="explore-modal-comments">
                <p className="explore-modal-section-label">
                  Comments {postComments.length > 0 ? `(${postComments.length})` : ""}
                </p>

                {postComments.length === 0 ? (
                  <p className="explore-modal-comments-empty">No comments yet. Be the first to share your thoughts.</p>
                ) : (
                  <ul className="explore-modal-comment-list">
                    {postComments.map((comment) => (
                      <li key={comment.id} className="explore-modal-comment">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={comment.authorAvatarUrl} alt="" width={28} height={28} className="explore-modal-comment-avatar" />
                        <div className="explore-modal-comment-body">
                          <div className="explore-modal-comment-head">
                            <span className="explore-modal-comment-author">{comment.authorDisplayName}</span>
                            <span className="explore-modal-comment-time">
                              {new Date(comment.createdAt).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="explore-modal-comment-text">{comment.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="explore-modal-comment-compose">
              <input
                type="text"
                className="explore-modal-comment-input"
                placeholder="Add a comment…"
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void submitComment();
                  }
                }}
              />
              <button
                type="button"
                className="explore-modal-btn explore-modal-btn--accent"
                disabled={!commentDraft.trim()}
                onClick={() => void submitComment()}
              >
                Post
              </button>
            </div>

            <div className="explore-modal-footer">
              <button
                type="button"
                className="explore-modal-btn"
                data-liked={post.likedByMe ? "true" : "false"}
                onClick={() => void toggleLike(post.id)}
              >
                {post.likedByMe ? "♥ Liked" : "♡ Like"}
              </button>
              <ExplorePostActionsMenu
                copiedPrompt={copiedPromptId === post.id}
                onCopyPrompt={async () => {
                  const ok = await copyExplorePrompt(post.prompt);
                  if (ok) markPromptCopied(post.id);
                }}
                onEditCopy={() => void editCopy()}
                onDownload={() => void downloadExploreImage(post.imageUrl, "lumina-explore.jpg")}
              />
              <button type="button" className="explore-modal-btn explore-modal-btn--ghost" onClick={close} style={{ marginLeft: "auto" }}>
                Close
              </button>
            </div>
          </aside>
        </div>
      </div>
    </ModalPortal>
  );
}
