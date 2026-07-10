"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppPageShell } from "@/components/layout/AppPageShell";
import { ALL_STYLES } from "@/lib/constants/generationStyles";
import { useGenerationStore } from "@/lib/store/generationStore";
import { useStyleStore } from "@/lib/store/styleStore";
import { StyleCard } from "@/components/styles/StyleCard";

export function StylesPageView() {
  const router = useRouter();
  const activeStyleId = useGenerationStore((s) => s.activeStyleId);
  const toggleStyle = useGenerationStore((s) => s.toggleStyle);
  const filterTab = useStyleStore((s) => s.filterTab);
  const setFilterTab = useStyleStore((s) => s.setFilterTab);
  const loadLikes = useStyleStore((s) => s.loadLikes);
  const toggleStyleLike = useStyleStore((s) => s.toggleStyleLike);
  const likedStyleIds = useStyleStore((s) => s.likedStyleIds);

  useEffect(() => {
    loadLikes();
  }, [loadLikes]);

  const visibleStyles =
    filterTab === "liked"
      ? ALL_STYLES.filter((s) => likedStyleIds.has(s.id))
      : ALL_STYLES;

  return (
    <AppPageShell
      top={
        <div className="styles-page-header">
          <div className="styles-page-header-inner">
            <h1 className="styles-page-title">Styles</h1>
            <p className="styles-page-subtitle">
              Browse aesthetic presets inspired by Midjourney SREFs. Each card shows sample generations in that style.
            </p>
            <div className="styles-page-filters">
              <button
                type="button"
                className={`styles-page-filter${filterTab === "all" ? " is-active" : ""}`}
                onClick={() => setFilterTab("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`styles-page-filter${filterTab === "liked" ? " is-active" : ""}`}
                onClick={() => setFilterTab("liked")}
              >
                Liked
              </button>
            </div>
          </div>
          {activeStyleId && (
            <button
              type="button"
              className="styles-page-create-btn"
              onClick={() => router.push("/generate")}
            >
              Create with style →
            </button>
          )}
        </div>
      }
    >
      <div className="styles-page-feed">
        {visibleStyles.length === 0 ? (
          <p className="styles-page-empty">No liked styles yet. Tap ♡ on any style to save it here.</p>
        ) : (
          visibleStyles.map((style) => (
            <StyleCard
              key={style.id}
              style={style}
              active={activeStyleId === style.id}
              liked={likedStyleIds.has(style.id)}
              onSelect={() => toggleStyle(style.id)}
              onToggleLike={() => toggleStyleLike(style.id)}
            />
          ))
        )}
      </div>
    </AppPageShell>
  );
}
