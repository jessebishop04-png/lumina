"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getStyleById } from "@/lib/constants/generationStyles";
import { getLocalProfile } from "@/lib/user/localProfile";
import { buildCommentThreads } from "@/lib/explore/commentThreads";
import { isExploreVideo } from "@/lib/explore/exploreMedia";
import { copyExplorePrompt, downloadExploreImage } from "@/lib/explore/exploreActions";
import { useEditorStore } from "@/lib/store/editorStore";
import { useExploreStore } from "@/lib/store/exploreStore";
import { useGenerationStore } from "@/lib/store/generationStore";
import type { ExploreCommentThread, ExploreCommentView } from "@/lib/types/explore";
import { ExplorePostActionsMenu } from "@/components/explore/ExplorePostActionsMenu";
import { ModalPortal } from "@/components/layout/ModalPortal";

gsap.registerPlugin(useGSAP);

function HeartIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SmallHeartIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SmallTrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatCommentTime(createdAt: string): string {
  return new Date(createdAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function resolveReplyParentId(comment: ExploreCommentView, threads: ExploreCommentThread[]): string {
  const topLevel = threads.find((t) => t.id === comment.id);
  if (topLevel) return topLevel.id;
  const parentThread = threads.find((t) => t.replies.some((r) => r.id === comment.id));
  return parentThread?.id ?? comment.id;
}

interface CommentRowProps {
  comment: ExploreCommentView;
  isReply?: boolean;
  isOwn: boolean;
  onReply: (comment: ExploreCommentView) => void;
  onToggleLike: (commentId: string) => void;
  onDelete: (commentId: string) => void;
}

function CommentRow({ comment, isReply = false, isOwn, onReply, onToggleLike, onDelete }: CommentRowProps) {
  return (
    <div className={`explore-modal-comment-row${isReply ? " explore-modal-comment-row--reply" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={comment.authorAvatarUrl}
        alt=""
        width={isReply ? 22 : 28}
        height={isReply ? 22 : 28}
        className={`explore-modal-comment-avatar${isReply ? " explore-modal-comment-avatar--reply" : ""}`}
      />
      <div className="explore-modal-comment-content">
        <p className="explore-modal-comment-inline">
          <span className="explore-modal-comment-author">{comment.authorDisplayName}</span>
          {comment.text}
        </p>
        <div className="explore-modal-comment-actions">
          <span className="explore-modal-comment-time-inline">{formatCommentTime(comment.createdAt)}</span>
          <button
            type="button"
            className="explore-modal-comment-action-btn"
            onClick={() => onToggleLike(comment.id)}
          >
            {comment.likedByMe ? "Unlike" : "Like"}
            {comment.likeCount > 0 ? ` (${comment.likeCount})` : ""}
          </button>
          <button type="button" className="explore-modal-comment-action-btn" onClick={() => onReply(comment)}>
            Reply
          </button>
        </div>
      </div>
      <div className="explore-modal-comment-trailing">
        {isOwn && (
          <button
            type="button"
            className="explore-modal-comment-delete-btn"
            onClick={() => onDelete(comment.id)}
            aria-label="Delete comment"
          >
            <SmallTrashIcon />
          </button>
        )}
        <button
          type="button"
          className="explore-modal-comment-like-btn"
          data-liked={comment.likedByMe ? "true" : "false"}
          onClick={() => onToggleLike(comment.id)}
          aria-label={comment.likedByMe ? "Unlike comment" : "Like comment"}
        >
          <SmallHeartIcon filled={comment.likedByMe} />
          {comment.likeCount > 0 && <span className="explore-modal-comment-like-count">{comment.likeCount}</span>}
        </button>
      </div>
    </div>
  );
}

interface CommentThreadProps {
  thread: ExploreCommentThread;
  expanded: boolean;
  currentUserId: string | null;
  onReply: (comment: ExploreCommentView) => void;
  onToggleLike: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onToggleReplies: (commentId: string) => void;
}

function CommentThread({ thread, expanded, currentUserId, onReply, onToggleLike, onDelete, onToggleReplies }: CommentThreadProps) {
  const replyLabel = thread.replyCount === 1 ? "View 1 reply" : `View all ${thread.replyCount} replies`;

  return (
    <li className="explore-modal-comment">
      <CommentRow
        comment={thread}
        isOwn={currentUserId === thread.authorId}
        onReply={onReply}
        onToggleLike={onToggleLike}
        onDelete={onDelete}
      />

      {thread.replyCount > 0 && (
        <button type="button" className="explore-modal-comment-replies-toggle" onClick={() => onToggleReplies(thread.id)}>
          {expanded ? "Hide replies" : replyLabel}
        </button>
      )}

      {expanded && thread.replies.length > 0 && (
        <ul className="explore-modal-comment-replies">
          {thread.replies.map((reply) => (
            <li key={reply.id}>
              <CommentRow
                comment={reply}
                isReply
                isOwn={currentUserId === reply.authorId}
                onReply={onReply}
                onToggleLike={onToggleLike}
                onDelete={onDelete}
              />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

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
  const deleteComment = useExploreStore((s) => s.deleteComment);
  const toggleCommentLike = useExploreStore((s) => s.toggleCommentLike);
  const setAnimateTarget = useGenerationStore((s) => s.setAnimateTarget);
  const isGenerating = useGenerationStore((s) => s.isGenerating);
  const createProjectFromDataUrl = useEditorStore((s) => s.createProjectFromDataUrl);
  const [commentDraft, setCommentDraft] = useState("");
  const [replyingToParentId, setReplyingToParentId] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const isClosingRef = useRef(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);
  const composeRef = useRef<HTMLDivElement>(null);

  const commentThreads = useMemo(() => buildCommentThreads(postComments), [postComments]);
  const currentUserId = getLocalProfile()?.id ?? null;

  useEffect(() => {
    void fetch("/api/generate/status")
      .then((r) => r.json())
      .then((data: { videoGeneration?: boolean }) => setVideoEnabled(!!data.videoGeneration))
      .catch(() => setVideoEnabled(false));
  }, []);

  useEffect(() => {
    if (selectedPostId) {
      isClosingRef.current = false;
    }
  }, [selectedPostId]);

  const finishClose = useCallback(() => {
    isClosingRef.current = false;
    setReplyingToParentId(null);
    setCommentDraft("");
    setExpandedReplies(new Set());
    setShareNote(null);
    setSelectedPost(null);
  }, [setSelectedPost]);

  const getSidebarSections = useCallback(() => {
    return [
      headerRef.current,
      promptRef.current,
      commentsRef.current,
      socialRef.current,
      composeRef.current,
    ].filter((el): el is HTMLDivElement => el !== null);
  }, []);

  useGSAP(
    () => {
      if (isClosingRef.current) return;

      const sidebar = sidebarRef.current;
      if (!sidebar) return;

      const sections = getSidebarSections();
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(sidebar, { x: 0, opacity: 1 });
        gsap.set(sections, { opacity: 1, y: 0 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(sidebar, { x: 48, opacity: 0 });
        gsap.set(sections, { opacity: 0, y: 16 });

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.to(sidebar, {
          x: 0,
          opacity: 1,
          duration: 0.58,
        }).to(
          sections,
          {
            opacity: 1,
            y: 0,
            duration: 0.44,
            stagger: 0.08,
          },
          "-=0.38",
        );
      });

      return () => mm.revert();
    },
    {
      scope: sidebarRef,
      dependencies: [selectedPostId, getSidebarSections],
    },
  );

  const runCloseAnimation = useCallback(() => {
    const sidebar = sidebarRef.current;
    const sections = getSidebarSections();

    const completeClose = () => {
      requestAnimationFrame(() => finishClose());
    };

    if (!sidebar) {
      completeClose();
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      completeClose();
      return;
    }

    gsap.timeline({
      defaults: { ease: "power2.in" },
      onComplete: completeClose,
    })
      .to([...sections].reverse(), {
        opacity: 0,
        y: 10,
        duration: 0.22,
        stagger: 0.045,
      })
      .to(
        sidebar,
        {
          x: 40,
          opacity: 0,
          duration: 0.3,
        },
        "-=0.06",
      );
  }, [finishClose, getSidebarSections]);

  if (!selectedPostId) return null;

  const post = posts.find((p) => p.id === selectedPostId) ?? allPosts.find((p) => p.id === selectedPostId);
  if (!post) return null;

  const style = getStyleById(post.styleId ?? null);
  const isVideo = isExploreVideo(post);
  const commentCount = postComments.length;

  const clearReplyMode = () => {
    setReplyingToParentId(null);
    setCommentDraft("");
  };

  const close = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    runCloseAnimation();
  };

  const editCopy = async () => {
    if (isVideo) return;
    const name = `${post.prompt.slice(0, 36) || "Explore image"} (copy)`;
    const projectId = await createProjectFromDataUrl(post.imageUrl, name);
    close();
    router.push(`/editor/${projectId}`);
  };

  const startAnimate = () => {
    setAnimateTarget({
      type: "url",
      imageUrl: post.imageUrl,
      prompt: post.prompt,
      styleId: post.styleId ?? null,
    });
    close();
  };

  const submitComment = async () => {
    const text = commentDraft.trim();
    if (!text) return;
    await addComment(post.id, text, replyingToParentId ?? undefined);
    if (replyingToParentId) {
      setExpandedReplies((prev) => new Set([...prev, replyingToParentId]));
    }
    clearReplyMode();
  };

  const startReply = (comment: ExploreCommentView) => {
    const parentId = resolveReplyParentId(comment, commentThreads);
    setReplyingToParentId(parentId);
    setCommentDraft(`@${comment.authorUsername} `);
    setExpandedReplies((prev) => new Set([...prev, parentId]));
    window.requestAnimationFrame(() => commentInputRef.current?.focus());
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleToggleCommentLike = (commentId: string) => {
    void toggleCommentLike(post.id, commentId);
  };

  const handleDeleteComment = (commentId: string) => {
    void deleteComment(post.id, commentId).then(() => {
      if (replyingToParentId === commentId) clearReplyMode();
      setExpandedReplies((prev) => {
        if (!prev.has(commentId)) return prev;
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    });
  };

  const sharePost = async () => {
    const url = `${window.location.origin}/?post=${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.prompt, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareNote("Link copied");
      window.setTimeout(() => setShareNote(null), 2000);
    } catch {
      // user cancelled share
    }
  };

  return (
    <ModalPortal>
      <div className="explore-modal-backdrop" onClick={close}>
        <div className="explore-modal-shell" onClick={(e) => e.stopPropagation()}>
          <div className="explore-modal-panel">
            <div className="explore-modal-image-wrap">
              {isVideo ? (
                <video
                  src={post.imageUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="explore-modal-image explore-modal-video"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.imageUrl} alt={post.prompt} className="explore-modal-image" />
              )}
            </div>

            <aside ref={sidebarRef} className="explore-modal-sidebar">
              <div ref={headerRef} className="explore-modal-header">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.creatorAvatarUrl} alt="" width={40} height={40} className="explore-modal-avatar" />
                <div className="explore-modal-creator">
                  <p className="explore-modal-creator-name">{post.creatorDisplayName}</p>
                  <p className="explore-modal-creator-handle">@{post.creatorUsername}</p>
                </div>
                <div className="explore-modal-header-actions">
                  <button
                    type="button"
                    className="explore-modal-follow-btn"
                    data-following={post.isFollowing ? "true" : "false"}
                    onClick={() => void toggleFollow(post.creatorId)}
                  >
                    {post.isFollowing ? "Following" : "Follow"}
                  </button>
                  <ExplorePostActionsMenu
                    variant="header"
                    copiedPrompt={copiedPromptId === post.id}
                    animateDisabled={!videoEnabled || isGenerating || isVideo}
                    onCopyPrompt={async () => {
                      const ok = await copyExplorePrompt(post.prompt);
                      if (ok) markPromptCopied(post.id);
                    }}
                    onEditCopy={!isVideo ? () => void editCopy() : undefined}
                    onAnimate={videoEnabled && !isVideo ? () => startAnimate() : undefined}
                    onDownload={() =>
                      void downloadExploreImage(post.imageUrl, isVideo ? "lumina-explore.mp4" : "lumina-explore.jpg")
                    }
                  />
                </div>
              </div>

              <div className="explore-modal-body">
                <div ref={promptRef} className="explore-modal-prompt-block">
                  <p className="explore-modal-section-label">Prompt</p>
                  <p className="explore-modal-prompt">{post.prompt}</p>

                  {style && (
                    <div className="explore-modal-style">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={style.previewUrl} alt="" width={28} height={28} />
                      <span>{style.label} style</span>
                    </div>
                  )}
                </div>

                <div ref={commentsRef} className="explore-modal-comments">
                  <p className="explore-modal-section-label">
                    Comments{commentCount > 0 ? ` (${commentCount})` : ""}
                  </p>

                  {commentCount === 0 ? (
                    <p className="explore-modal-comments-empty">No comments yet. Be the first to share your thoughts.</p>
                  ) : (
                    <ul className="explore-modal-comment-list">
                      {commentThreads.map((thread) => (
                        <CommentThread
                          key={thread.id}
                          thread={thread}
                          expanded={expandedReplies.has(thread.id)}
                          currentUserId={currentUserId}
                          onReply={startReply}
                          onToggleLike={handleToggleCommentLike}
                          onDelete={handleDeleteComment}
                          onToggleReplies={toggleReplies}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div ref={socialRef} className="explore-modal-social">
                <button
                  type="button"
                  className="explore-modal-social-btn"
                  data-liked={post.likedByMe ? "true" : "false"}
                  onClick={() => void toggleLike(post.id)}
                  aria-label={post.likedByMe ? "Unlike" : "Like"}
                >
                  <HeartIcon filled={post.likedByMe} />
                  <span>{post.likeCount}</span>
                </button>
                <button
                  type="button"
                  className="explore-modal-social-btn"
                  onClick={() => commentInputRef.current?.focus()}
                  aria-label="Comment"
                >
                  <CommentIcon />
                  <span>{commentCount}</span>
                </button>
                <button
                  type="button"
                  className="explore-modal-social-btn explore-modal-social-btn--share"
                  onClick={() => void sharePost()}
                  aria-label={shareNote ?? "Share"}
                  title={shareNote ?? "Share"}
                >
                  <ShareIcon />
                </button>
              </div>

              <div ref={composeRef} className="explore-modal-comment-compose">
                <div className={`explore-modal-comment-pill${replyingToParentId ? " is-replying" : ""}`}>
                  <input
                    ref={commentInputRef}
                    type="text"
                    className="explore-modal-comment-input"
                    placeholder={replyingToParentId ? "Add a reply…" : "Add a comment…"}
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void submitComment();
                      }
                      if (e.key === "Escape") clearReplyMode();
                    }}
                  />
                  <button
                    type="button"
                    className="explore-modal-comment-send"
                    disabled={!commentDraft.trim()}
                    onClick={() => void submitComment()}
                    aria-label={replyingToParentId ? "Post reply" : "Post comment"}
                  >
                    <SendIcon />
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
