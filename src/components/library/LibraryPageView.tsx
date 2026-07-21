"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppPageShell } from "@/components/layout/AppPageShell";
import { LibrarySearch } from "@/components/library/LibrarySearch";
import {
  filterLibraryProjects,
  groupLibraryByDate,
  libraryFilterLabel,
  normalizeProjectSummary,
  type LibraryDateGroup,
  type LibraryMediaFilter,
} from "@/lib/library/libraryFilters";
import { MediaFilterTabs } from "@/components/shared/MediaFilterTabs";
import { useEditorStore } from "@/lib/store/editorStore";
import type { ProjectSummary } from "@/lib/types";

gsap.registerPlugin(useGSAP);

const MIN_COL_WIDTH = 120;
const MAX_COL_WIDTH = 320;

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProjectTile({
  project,
  selected,
  selectionActive,
  onToggleSelect,
  onOpen,
}: {
  project: ProjectSummary;
  selected: boolean;
  selectionActive: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
}) {
  const summary = normalizeProjectSummary(project);
  const src = summary.previewDataUrl ?? summary.thumbnailDataUrl;
  if (!src) return null;
  const isVideo = summary.mediaType === "video";

  return (
    <div
      className={`library-photo-wrap${selected ? " is-selected" : ""}${selectionActive ? " is-selecting" : ""}`}
      data-project-id={project.id}
    >
      <button
        type="button"
        className="library-photo-check"
        aria-label={selected ? "Deselect item" : "Select item"}
        aria-pressed={selected}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
      >
        <span className={`library-check-circle${selected ? " is-checked" : ""}`}>
          {selected && <CheckIcon />}
        </span>
      </button>

      <button
        type="button"
        className="library-photo"
        onClick={() => {
          if (selectionActive) onToggleSelect();
          else onOpen();
        }}
      >
        <span className="library-photo-frame">
          {isVideo ? (
            <video src={src} muted loop playsInline autoPlay className="library-photo-media" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={summary.name} loading="lazy" decoding="async" className="library-photo-media" />
          )}
        </span>
        {isVideo && (
          <span className="library-photo-video-badge" aria-hidden>
            ▶
          </span>
        )}
      </button>
    </div>
  );
}

function DateSectionHeader({
  group,
  selectedCount,
  onToggleDay,
}: {
  group: LibraryDateGroup;
  selectedCount: number;
  onToggleDay: () => void;
}) {
  const total = group.projects.length;
  const allSelected = total > 0 && selectedCount === total;
  const someSelected = selectedCount > 0 && selectedCount < total;

  return (
    <div className={`library-date-header${selectedCount > 0 ? " has-day-selection" : ""}`}>
      <button
        type="button"
        className="library-date-select"
        aria-label={allSelected ? `Deselect all from ${group.label}` : `Select all from ${group.label}`}
        aria-pressed={allSelected}
        onClick={onToggleDay}
      >
        <span
          className={`library-check-circle library-check-circle--day${allSelected ? " is-checked" : ""}${someSelected ? " is-indeterminate" : ""}`}
        >
          {allSelected && <CheckIcon />}
          {someSelected && !allSelected && <span className="library-check-indeterminate" />}
        </span>
      </button>
      <h2 className="library-date-label">{group.label}</h2>
    </div>
  );
}

interface LibraryPageViewProps {
  fileRef: React.RefObject<HTMLInputElement | null>;
  overlay?: React.ReactNode;
}

export function LibraryPageView({ fileRef, overlay }: LibraryPageViewProps) {
  const router = useRouter();
  const { recentProjects, loadRecentProjects, deleteProjectsByIds } = useEditorStore();
  const [gridSize, setGridSize] = useState(180);
  const [search, setSearch] = useState("");
  const [mediaFilter, setMediaFilter] = useState<LibraryMediaFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const normalNavRef = useRef<HTMLDivElement>(null);
  const selectionNavRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const emptyRef = useRef<HTMLDivElement>(null);
  const animateKeyRef = useRef("");

  const selectionActive = selectedIds.size > 0;

  useEffect(() => {
    const schedule = () => loadRecentProjects();
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(schedule);
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(schedule, 0);
    return () => clearTimeout(id);
  }, [loadRecentProjects]);

  const query = search.trim().toLowerCase();

  const displayProjects = useMemo(
    () => filterLibraryProjects(recentProjects, { query, mediaFilter }),
    [recentProjects, query, mediaFilter],
  );

  const dateGroups = useMemo(() => groupLibraryByDate(displayProjects, "newest"), [displayProjects]);

  const hasResults = displayProjects.length > 0;
  const animateKey = `${mediaFilter}:${dateGroups.map((g) => `${g.key}:${g.projects.length}`).join("|")}`;

  const emptyTitle = query
    ? "No matches for your search"
    : mediaFilter === "videos"
      ? "No videos yet"
      : mediaFilter === "photos"
        ? "No photos yet"
        : "No items yet";

  const emptyDesc = query
    ? `Nothing in ${libraryFilterLabel(mediaFilter).toLowerCase()} matched "${search.trim()}". Try another term or filter.`
    : mediaFilter === "videos"
      ? "Generate a video in Explore or Create to see it here."
      : "Upload a photo or create something in Explore to get started.";

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleDaySelection = useCallback((projects: ProjectSummary[]) => {
    const ids = projects.map((p) => p.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = ids.length > 0 && ids.every((id) => next.has(id));
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const deleteSelected = async () => {
    if (selectedIds.size === 0 || isDeleting) return;
    const count = selectedIds.size;
    const label = count === 1 ? "this item" : `these ${count} items`;
    if (!window.confirm(`Move ${label} to trash? This cannot be undone.`)) return;

    const ids = [...selectedIds];
    setIsDeleting(true);

    const tiles = ids
      .map((id) => contentRef.current?.querySelector<HTMLElement>(`[data-project-id="${id}"]`))
      .filter((el): el is HTMLElement => !!el);

    const runDelete = async () => {
      await deleteProjectsByIds(ids);
      setSelectedIds(new Set());
      setIsDeleting(false);
    };

    if (tiles?.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.to(tiles, {
        opacity: 0,
        scale: 0.92,
        duration: 0.22,
        stagger: 0.015,
        ease: "power2.in",
        onComplete: () => {
          void runDelete();
        },
      });
    } else {
      await runDelete();
    }
  };

  useGSAP(
    () => {
      const normalNav = normalNavRef.current;
      const selectionNav = selectionNavRef.current;
      const searchEl = headerRef.current?.querySelector<HTMLElement>(".library-gphotos-search");
      if (!normalNav || !selectionNav) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(normalNav, { display: selectionActive ? "none" : "flex", opacity: 1, x: 0 });
        gsap.set(selectionNav, { display: selectionActive ? "flex" : "none", opacity: 1, x: 0 });
        if (searchEl) gsap.set(searchEl, { opacity: 1 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (selectionActive) {
          if (searchEl) gsap.to(searchEl, { opacity: 0.35, duration: 0.2 });
          gsap.to(normalNav, { opacity: 0, x: 16, duration: 0.22, ease: "power2.in", onComplete: () => {
            gsap.set(normalNav, { display: "none" });
          }});
          gsap.set(selectionNav, { display: "flex" });
          gsap.fromTo(selectionNav, { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.28, ease: "power2.out", delay: 0.06 });
        } else {
          gsap.to(selectionNav, { opacity: 0, x: 16, duration: 0.2, ease: "power2.in", onComplete: () => {
            gsap.set(selectionNav, { display: "none" });
          }});
          gsap.set(normalNav, { display: "flex" });
          gsap.fromTo(normalNav, { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.28, ease: "power2.out", delay: 0.06 });
          if (searchEl) gsap.to(searchEl, { opacity: 1, duration: 0.24, delay: 0.04 });
        }
      });

      return () => mm.revert();
    },
    { scope: headerRef, dependencies: [selectionActive] },
  );

  useGSAP(
    () => {
      if (selectionActive) return;
      const header = headerRef.current;
      if (!header) return;

      const searchEl = header.querySelector<HTMLElement>(".library-gphotos-search");
      const navItems = header.querySelectorAll<HTMLElement>(".library-gphotos-nav-item");
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (searchEl) {
          gsap.fromTo(searchEl, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
        }
        gsap.fromTo(
          navItems,
          { opacity: 0, x: 18 },
          { opacity: 1, x: 0, duration: 0.38, stagger: 0.07, ease: "power2.out", delay: 0.08 },
        );
      });

      return () => mm.revert();
    },
    { scope: headerRef, dependencies: [selectionActive] },
  );

  useGSAP(
    () => {
      if (animateKey === animateKeyRef.current && animateKeyRef.current !== "") return;
      animateKeyRef.current = animateKey;

      const mm = gsap.matchMedia();

      if (hasResults) {
        const sections = contentRef.current?.querySelectorAll<HTMLElement>(".library-date-section");
        if (!sections?.length) return;

        mm.add("(prefers-reduced-motion: no-preference)", () => {
          sections.forEach((section, index) => {
            const month = section.querySelector<HTMLElement>(".library-month-label");
            const heading = section.querySelector<HTMLElement>(".library-date-header");
            const tiles = section.querySelectorAll<HTMLElement>(".library-photo-wrap");
            const baseDelay = index * 0.07;

            if (month) {
              gsap.fromTo(month, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.34, ease: "power2.out", delay: baseDelay });
            }
            if (heading) {
              gsap.fromTo(heading, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.36, ease: "power2.out", delay: baseDelay + 0.04 });
            }
            if (tiles.length > 0) {
              gsap.fromTo(
                tiles,
                { opacity: 0, scale: 0.94 },
                { opacity: 1, scale: 1, duration: 0.32, stagger: 0.018, ease: "power2.out", delay: baseDelay + 0.08 },
              );
            }
          });
        });
      } else if (emptyRef.current) {
        mm.add("(prefers-reduced-motion: no-preference)", () => {
          gsap.fromTo(emptyRef.current, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.36, ease: "power2.out" });
        });
      }

      return () => mm.revert();
    },
    { scope: contentRef, dependencies: [animateKey, hasResults] },
  );

  return (
    <AppPageShell
      top={
        <div ref={headerRef} className={`library-gphotos-header${selectionActive ? " is-selecting" : ""}`}>
          <div className="library-gphotos-search library-top-search">
            <LibrarySearch value={search} onChange={setSearch} projects={recentProjects} />
          </div>

          <div ref={normalNavRef} className="library-gphotos-nav" aria-label="Library controls">
            <button
              type="button"
              className="library-gphotos-nav-item library-gphotos-upload"
              onClick={() => fileRef.current?.click()}
              aria-label="Add photos"
              title="Add photos"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div ref={selectionNavRef} className="library-gphotos-selection-nav" style={{ display: "none" }} aria-label="Selection actions">
            <span className="library-selection-count">
              {selectedIds.size} selected
            </span>
            <button
              type="button"
              className="library-selection-delete"
              onClick={() => void deleteSelected()}
              disabled={selectedIds.size === 0 || isDeleting}
              aria-label="Delete selected"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      }
      footer={
        !selectionActive ? (
          <div className="library-footer">
            <div className="library-footer-left">
              <MediaFilterTabs value={mediaFilter} onChange={setMediaFilter} />
            </div>
            <div className="library-footer-center library-footer-size" aria-label="Thumbnail size">
              <button type="button" onClick={() => setGridSize((s) => Math.max(MIN_COL_WIDTH, s - 20))} aria-label="Smaller thumbnails">
                −
              </button>
              <input
                type="range"
                min={MIN_COL_WIDTH}
                max={MAX_COL_WIDTH}
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                aria-label="Grid size"
              />
              <button type="button" onClick={() => setGridSize((s) => Math.min(MAX_COL_WIDTH, s + 20))} aria-label="Larger thumbnails">
                +
              </button>
            </div>
            <div className="library-footer-right">
              <span className="library-footer-count">
                {displayProjects.length} {displayProjects.length === 1 ? "item" : "items"}
              </span>
            </div>
          </div>
        ) : null
      }
      overlay={overlay}
    >
      <div
        ref={contentRef}
        className={`library-gphotos-content${selectionActive ? " is-selecting" : ""}`}
        style={{ ["--library-cell-size" as string]: `${gridSize}px` }}
      >
        {hasResults ? (
          <div className="library-gphotos-timeline">
            {dateGroups.map((group) => {
              const daySelectedCount = group.projects.filter((p) => selectedIds.has(p.id)).length;
              return (
                <section key={group.key} className="library-date-section" data-date={group.key}>
                  {group.monthLabel && <p className="library-month-label">{group.monthLabel}</p>}
                  <DateSectionHeader
                    group={group}
                    selectedCount={daySelectedCount}
                    onToggleDay={() => toggleDaySelection(group.projects)}
                  />
                  <div className="library-date-grid">
                    {group.projects.map((p) => (
                      <ProjectTile
                        key={p.id}
                        project={p}
                        selected={selectedIds.has(p.id)}
                        selectionActive={selectionActive}
                        onToggleSelect={() => toggleSelect(p.id)}
                        onOpen={() => router.push(`/editor/${p.id}`)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div ref={emptyRef} className="library-empty">
            <p className="library-empty-title">{emptyTitle}</p>
            <p className="library-empty-desc">{emptyDesc}</p>
            {!query && mediaFilter !== "videos" && (
              <button type="button" className="library-empty-cta" onClick={() => fileRef.current?.click()}>
                Add photos
              </button>
            )}
          </div>
        )}
      </div>
    </AppPageShell>
  );
}
