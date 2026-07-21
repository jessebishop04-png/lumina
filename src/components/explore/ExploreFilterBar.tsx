"use client";

import type { ExploreFilter } from "@/lib/types/explore";
import type { LibraryMediaFilter } from "@/lib/library/libraryFilters";
import { MediaFilterTabs } from "@/components/shared/MediaFilterTabs";

interface ExploreFilterBarProps {
  active: ExploreFilter;
  onChange: (filter: ExploreFilter) => void;
  mediaFilter: LibraryMediaFilter;
  onMediaFilterChange: (filter: LibraryMediaFilter) => void;
  minimal?: boolean;
}

export function ExploreFilterBar({
  active,
  onChange,
  mediaFilter,
  onMediaFilterChange,
  minimal = false,
}: ExploreFilterBarProps) {
  if (minimal) {
    return (
      <div className="explore-filter-bar explore-filter-bar--flat">
        <div className="explore-filter-bar-primary">
          <FilterTab label="Most Popular" isActive={active === "popular"} onClick={() => onChange("popular")} />
          <FilterTab label="Liked" isActive={active === "liked"} onClick={() => onChange("liked")} />
        </div>
        <MediaFilterTabs value={mediaFilter} onChange={onMediaFilterChange} />
      </div>
    );
  }

  return (
    <div className="explore-filter-bar explore-filter-bar--panel">
      <div className="explore-filter-bar-primary">
        <FilterTab label="Most Popular" isActive={active === "popular"} onClick={() => onChange("popular")} />
        <FilterTab label="Liked" isActive={active === "liked"} onClick={() => onChange("liked")} />
      </div>
      <MediaFilterTabs value={mediaFilter} onChange={onMediaFilterChange} />
    </div>
  );
}

function FilterTab({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={`explore-filter-tab${isActive ? " is-active" : ""}`}>
      {label}
    </button>
  );
}
