"use client";

import type { ExploreFilter } from "@/lib/types/explore";

interface ExploreFilterBarProps {
  active: ExploreFilter;
  onChange: (filter: ExploreFilter) => void;
  minimal?: boolean;
}

export function ExploreFilterBar({ active, onChange, minimal = false }: ExploreFilterBarProps) {
  if (minimal) {
    return (
      <div className="explore-filter-bar explore-filter-bar--flat">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <FilterTab label="Most Popular" isActive={active === "popular"} onClick={() => onChange("popular")} minimal />
          <FilterTab label="Liked" isActive={active === "liked"} onClick={() => onChange("liked")} minimal />
        </div>
        <span className="explore-filter-type">Images</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "12px 24px",
        borderBottom: "1px solid var(--color-border-subtle)",
        background: "var(--color-surface-panel)",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <FilterTab label="Most Popular" isActive={active === "popular"} onClick={() => onChange("popular")} />
        <FilterTab label="Liked" isActive={active === "liked"} onClick={() => onChange("liked")} />
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 999,
          background: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
          color: "var(--color-accent)",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        Images
      </div>
    </div>
  );
}

function FilterTab({
  label,
  isActive,
  onClick,
  minimal = false,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  minimal?: boolean;
}) {
  if (minimal) {
    return (
      <button type="button" onClick={onClick} className={`explore-filter-tab${isActive ? " is-active" : ""}`}>
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        padding: 0,
        fontSize: 14,
        fontWeight: isActive ? 600 : 500,
        color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
        cursor: "pointer",
        borderBottom: isActive ? "2px solid var(--color-text-primary)" : "2px solid transparent",
        paddingBottom: 4,
      }}
    >
      {label}
    </button>
  );
}
