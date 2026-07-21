"use client";

import { libraryFilterLabel, type LibraryMediaFilter } from "@/lib/library/libraryFilters";

const MEDIA_FILTERS: LibraryMediaFilter[] = ["all", "photos", "videos"];

interface MediaFilterTabsProps {
  value: LibraryMediaFilter;
  onChange: (filter: LibraryMediaFilter) => void;
  className?: string;
}

export function MediaFilterTabs({ value, onChange, className = "" }: MediaFilterTabsProps) {
  return (
    <div className={`media-filter-tabs${className ? ` ${className}` : ""}`} role="tablist" aria-label="Media type">
      {MEDIA_FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          role="tab"
          aria-selected={value === filter}
          className={`media-filter-tab${value === filter ? " is-active" : ""}`}
          onClick={() => onChange(filter)}
        >
          {libraryFilterLabel(filter)}
        </button>
      ))}
    </div>
  );
}
