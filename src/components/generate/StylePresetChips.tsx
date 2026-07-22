"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { GenerationStyle } from "@/lib/constants/generationStyles";
import { getStyleChipPlaceholder, getStyleChipThumbnail } from "@/lib/constants/styleChipPlaceholder";
import { PROMPT_BAR_STYLES } from "@/lib/constants/generationStyles";
import {
  PROMPT_PANEL_COLLAPSE_DURATION,
  PROMPT_PANEL_COLLAPSE_EASE,
  PROMPT_PANEL_COLLAPSE_FADE_RATIO,
  PROMPT_PANEL_EXPAND_DURATION,
  PROMPT_PANEL_EXPAND_EASE,
} from "@/lib/generation/promptPanelMotion";

const EXPAND_DURATION = PROMPT_PANEL_EXPAND_DURATION;
const COLLAPSE_DURATION = PROMPT_PANEL_COLLAPSE_DURATION;
const EXPAND_EASE = PROMPT_PANEL_EXPAND_EASE;
const COLLAPSE_EASE = PROMPT_PANEL_COLLAPSE_EASE;

/** Legacy peek-row collapse (first visible row stays shown). */
const PEEK_COLLAPSE_DURATION = 0.58;
const PEEK_COLLAPSE_EASE = "power1.inOut";

gsap.registerPlugin(useGSAP);

const HIDDEN_COUNT_LABEL = (count: number) =>
  `+${count} more ${count === 1 ? "style" : "styles"}`;

interface StylePresetChipsProps {
  activeStyleId: string | null;
  onToggle: (styleId: string) => void;
  styles?: GenerationStyle[];
  /** When false, chips collapse according to collapseBehavior */
  expanded?: boolean;
  /** peek = show one row when collapsed; hidden = show nothing until expanded */
  collapseBehavior?: "peek" | "hidden";
  /** Show +N more styles hint below collapsed peek row */
  showHiddenCount?: boolean;
}

export function StylePresetChips({
  activeStyleId,
  onToggle,
  styles = PROMPT_BAR_STYLES,
  expanded = true,
  collapseBehavior = "peek",
  showHiddenCount = false,
}: StylePresetChipsProps) {
  const hideUntilExpanded = collapseBehavior === "hidden";
  const allStyles = styles;
  const wrapRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const hiddenCountRef = useRef<HTMLSpanElement>(null);
  const prevExpandedRef = useRef(expanded);
  const lastCollapsedIdsRef = useRef<Set<string>>(new Set());
  const collapseTweenRef = useRef<gsap.core.Timeline | null>(null);
  const isCollapsingRef = useRef(false);
  const [layoutExpanded, setLayoutExpanded] = useState(expanded);
  const [visibleCount, setVisibleCount] = useState(allStyles.length);

  const isCollapsing = !expanded && layoutExpanded;
  const showAllChips = layoutExpanded || expanded || isCollapsing;

  const computeFitCount = useCallback(() => {
    if (!wrapRef.current || !measureRef.current) return allStyles.length;

    const wrapWidth = wrapRef.current.clientWidth;
    measureRef.current.style.width = `${Math.max(0, wrapWidth)}px`;

    const chipEls = measureRef.current.querySelectorAll<HTMLElement>(".style-preset-chip");
    if (chipEls.length === 0) return 0;

    const containerRect = measureRef.current.getBoundingClientRect();
    const maxRight = containerRect.right;
    const firstRowTop = chipEls[0].offsetTop;

    let fit = 0;
    for (const chip of chipEls) {
      if (chip.offsetTop > firstRowTop + 1) break;
      const rect = chip.getBoundingClientRect();
      if (rect.right <= maxRight + 0.5) fit++;
      else break;
    }

    return Math.max(1, fit);
  }, [allStyles.length]);

  const measureVisible = useCallback(() => {
    if (hideUntilExpanded || layoutExpanded || !wrapRef.current || !measureRef.current) {
      setVisibleCount(allStyles.length);
      return;
    }

    setVisibleCount(computeFitCount());
  }, [allStyles.length, computeFitCount, hideUntilExpanded, layoutExpanded]);

  useEffect(() => {
    measureVisible();
  }, [measureVisible, activeStyleId]);

  useEffect(() => {
    if (hideUntilExpanded || layoutExpanded) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    const observer = new ResizeObserver(() => measureVisible());
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [hideUntilExpanded, layoutExpanded, measureVisible]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    if (expanded) {
      collapseTweenRef.current?.kill();
      collapseTweenRef.current = null;
      isCollapsingRef.current = false;
      if (hideUntilExpanded) {
        gsap.set(wrap, { height: 0, overflow: "hidden" });
      } else {
        gsap.set(wrap, { clearProps: "height,overflow" });
      }
      setLayoutExpanded(true);
      return;
    }

    if (!expanded && layoutExpanded) {
      isCollapsingRef.current = true;
      gsap.set(wrap, { height: wrap.offsetHeight, overflow: "hidden" });
    }
  }, [expanded, hideUntilExpanded, layoutExpanded]);

  const displayStyles = useMemo(() => {
    if (hideUntilExpanded) {
      return showAllChips ? allStyles : [];
    }

    if (showAllChips) return allStyles;

    let slice = allStyles.slice(0, visibleCount);
    if (activeStyleId && !slice.some((s) => s.id === activeStyleId)) {
      const active = allStyles.find((s) => s.id === activeStyleId);
      if (active && slice.length > 0) {
        slice = [...slice.slice(0, -1), active];
      }
    }
    return slice;
  }, [activeStyleId, allStyles, hideUntilExpanded, showAllChips, visibleCount]);

  const hiddenCount = layoutExpanded ? 0 : Math.max(0, allStyles.length - displayStyles.length);

  useEffect(() => {
    if (!layoutExpanded) {
      lastCollapsedIdsRef.current = new Set(displayStyles.map((s) => s.id));
    }
  }, [displayStyles, layoutExpanded]);

  const getCollapsedWrapHeight = useCallback(() => {
    if (hideUntilExpanded) return 0;

    const wrap = wrapRef.current;
    const measure = measureRef.current;
    if (!wrap || !measure) return wrap?.offsetHeight ?? 0;

    const chips = measure.querySelectorAll<HTMLElement>(".style-preset-chip");
    if (chips.length === 0) return wrap.offsetHeight;

    const firstRowTop = chips[0].offsetTop;
    let firstRowBottom = 0;
    for (const chip of chips) {
      if (chip.offsetTop > firstRowTop + 1) break;
      firstRowBottom = Math.max(firstRowBottom, chip.offsetTop + chip.offsetHeight);
    }

    const hidden = Math.max(0, allStyles.length - computeFitCount());
    const labelBlock = showHiddenCount && hidden > 0 ? 8 + 18 : 0;

    return firstRowBottom + labelBlock;
  }, [allStyles.length, computeFitCount, hideUntilExpanded, showHiddenCount]);

  const collapsedLabelCount = isCollapsing
    ? Math.max(0, allStyles.length - computeFitCount())
    : hiddenCount;
  const showCollapsedLabel =
    !hideUntilExpanded && showHiddenCount && (!layoutExpanded || isCollapsing) && collapsedLabelCount > 0;

  useEffect(() => {
    if (!showCollapsedLabel || !hiddenCountRef.current) return;
    gsap.set(hiddenCountRef.current, { opacity: 1, clearProps: "transform" });
  }, [showCollapsedLabel, collapsedLabelCount, layoutExpanded]);

  useGSAP(
    () => {
      const wasExpanded = prevExpandedRef.current;
      prevExpandedRef.current = expanded;

      if (!chipsRef.current) return;

      const mm = gsap.matchMedia();

      const finishCollapse = () => {
        const wrap = wrapRef.current;
        if (wrap) {
          gsap.set(wrap, { height: 0, overflow: "hidden" });
        }
        isCollapsingRef.current = false;
        setLayoutExpanded(false);
      };

      if (expanded && !wasExpanded) {
        const chips = chipsRef.current.querySelectorAll<HTMLElement>(".style-preset-chip");
        const previouslyVisible = lastCollapsedIdsRef.current;
        const toAnimate = hideUntilExpanded
          ? Array.from(chips)
          : Array.from(chips).filter(
              (chip) => chip.dataset.styleId && !previouslyVisible.has(chip.dataset.styleId),
            );

        mm.add("(prefers-reduced-motion: reduce)", () => {
          gsap.set(toAnimate, { opacity: 1, y: 0, scale: 1 });
        });

        mm.add("(prefers-reduced-motion: no-preference)", () => {
          const wrap = wrapRef.current;

          if (wrap) {
            gsap.set(wrap, { height: hideUntilExpanded ? 0 : wrap.offsetHeight, overflow: "hidden" });
          }

          if (toAnimate.length > 0) {
            gsap.set(toAnimate, { opacity: 0, y: hideUntilExpanded ? 12 : 18, scale: hideUntilExpanded ? 0.98 : 1 });
          }

          requestAnimationFrame(() => {
            if (wrap) {
              gsap.to(wrap, {
                height: wrap.scrollHeight,
                duration: EXPAND_DURATION,
                ease: EXPAND_EASE,
                onComplete: () => {
                  gsap.set(wrap, { clearProps: "height,overflow" });
                },
              });
            }

            if (toAnimate.length > 0) {
              gsap.to(toAnimate, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: hideUntilExpanded ? 0.38 : 0.52,
                stagger: hideUntilExpanded ? 0.028 : 0.042,
                ease: EXPAND_EASE,
                clearProps: "transform",
              });
            }
          });
        });
      }

      if (!expanded && wasExpanded && layoutExpanded) {
        const chips = chipsRef.current.querySelectorAll<HTMLElement>(".style-preset-chip");

        if (hideUntilExpanded) {
          mm.add("(prefers-reduced-motion: reduce)", finishCollapse);

          mm.add("(prefers-reduced-motion: no-preference)", () => {
            const wrap = wrapRef.current;
            collapseTweenRef.current?.kill();

            const tl = gsap.timeline({
              onComplete: () => {
                collapseTweenRef.current = null;
                finishCollapse();
              },
            });

            if (chips.length > 0) {
              tl.to(
                chips,
                {
                  opacity: 0,
                  duration: COLLAPSE_DURATION * PROMPT_PANEL_COLLAPSE_FADE_RATIO,
                  stagger: { each: 0.012, from: "end" },
                  ease: "power1.in",
                },
                0,
              );
            }

            if (wrap) {
              tl.to(
                wrap,
                {
                  height: 0,
                  duration: COLLAPSE_DURATION,
                  ease: COLLAPSE_EASE,
                },
                0,
              );
            }

            collapseTweenRef.current = tl;
          });

          return () => mm.revert();
        }

        const fitCount = computeFitCount();
        let keepStyles = allStyles.slice(0, fitCount);
        if (activeStyleId && !keepStyles.some((s) => s.id === activeStyleId)) {
          const active = allStyles.find((s) => s.id === activeStyleId);
          if (active && keepStyles.length > 0) {
            keepStyles = [...keepStyles.slice(0, -1), active];
          }
        }
        const keepIds = new Set(keepStyles.map((s) => s.id));

        const toAnimate = Array.from(chips).filter(
          (chip) => chip.dataset.styleId && !keepIds.has(chip.dataset.styleId),
        );

        mm.add("(prefers-reduced-motion: reduce)", finishCollapse);

        mm.add("(prefers-reduced-motion: no-preference)", () => {
          const wrap = wrapRef.current;
          const chipsContainer = chipsRef.current;
          const targetHeight = getCollapsedWrapHeight();

          if (toAnimate.length === 0) {
            if (wrap) {
              gsap.to(wrap, {
                height: targetHeight,
                duration: PEEK_COLLAPSE_DURATION,
                ease: PEEK_COLLAPSE_EASE,
                onComplete: finishCollapse,
              });
            } else {
              finishCollapse();
            }
            return;
          }

          if (chipsContainer) {
            gsap.set(chipsContainer, { position: "relative" });
          }

          toAnimate.forEach((chip) => {
            const chipRect = chip.getBoundingClientRect();
            const parentRect = chipsContainer?.getBoundingClientRect();
            if (!parentRect) return;
            gsap.set(chip, {
              position: "absolute",
              left: chipRect.left - parentRect.left,
              top: chipRect.top - parentRect.top,
              width: chipRect.width,
              margin: 0,
              zIndex: 1,
            });
          });

          collapseTweenRef.current?.kill();
          const tl = gsap.timeline({
            onComplete: () => {
              gsap.set(toAnimate, { opacity: 0, visibility: "hidden" });
              collapseTweenRef.current = null;
              finishCollapse();
            },
          });

          if (wrap) {
            tl.to(
              wrap,
              {
                height: targetHeight,
                duration: PEEK_COLLAPSE_DURATION,
                ease: PEEK_COLLAPSE_EASE,
              },
              0,
            );
          }

          tl.to(
            toAnimate,
            {
              opacity: 0,
              duration: PEEK_COLLAPSE_DURATION * 0.72,
              ease: "power1.in",
            },
            0,
          );

          const label = hiddenCountRef.current;
          if (label) {
            tl.fromTo(
              label,
              { opacity: 0 },
              { opacity: 1, duration: 0.22, ease: "power1.out" },
              PEEK_COLLAPSE_DURATION * 0.55,
            );
          }

          collapseTweenRef.current = tl;
        });
      }

      return () => mm.revert();
    },
    {
      scope: chipsRef,
      dependencies: [activeStyleId, allStyles, computeFitCount, expanded, getCollapsedWrapHeight, hideUntilExpanded],
    },
  );

  return (
    <div
      ref={wrapRef}
      className={`style-preset-chips-wrap${hideUntilExpanded ? " style-preset-chips-wrap--hidden-mode" : ""}${!layoutExpanded ? " style-preset-chips-wrap--collapsed" : ""}${isCollapsing ? " style-preset-chips-wrap--collapsing" : ""}`}
    >
      {!hideUntilExpanded && (
        <div className="style-preset-chips-row">
          <div ref={measureRef} className="style-preset-chips-measure" aria-hidden>
            {allStyles.map((style) => (
              <StyleChip
                key={`measure-${style.id}`}
                style={style}
                active={false}
                onToggle={() => {}}
                measureOnly
                onReady={measureVisible}
              />
            ))}
          </div>

          <div ref={chipsRef} className="style-preset-chips">
            {displayStyles.map((style) => {
              const active = activeStyleId === style.id;
              return <StyleChip key={style.id} style={style} active={active} onToggle={onToggle} />;
            })}
          </div>
        </div>
      )}

      {hideUntilExpanded && (
        <div className="style-preset-chips-row">
          <div ref={chipsRef} className="style-preset-chips">
            {displayStyles.map((style) => {
              const active = activeStyleId === style.id;
              return <StyleChip key={style.id} style={style} active={active} onToggle={onToggle} />;
            })}
          </div>
        </div>
      )}

      {showCollapsedLabel && (
        <span ref={hiddenCountRef} className="style-preset-chips-hidden-count">
          {HIDDEN_COUNT_LABEL(collapsedLabelCount)}
        </span>
      )}
    </div>
  );
}

function StyleChip({
  style,
  active,
  onToggle,
  measureOnly = false,
  onReady,
}: {
  style: GenerationStyle;
  active: boolean;
  onToggle: (id: string) => void;
  measureOnly?: boolean;
  onReady?: () => void;
}) {
  const thumbSize = 24;
  const thumbSrc = getStyleChipThumbnail(style);

  return (
    <button
      type="button"
      data-style-id={style.id}
      onClick={measureOnly ? undefined : () => onToggle(style.id)}
      title={style.suffix}
      tabIndex={measureOnly ? -1 : undefined}
      className={`style-preset-chip${active ? " is-active" : ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbSrc}
        alt=""
        width={thumbSize}
        height={thumbSize}
        loading={measureOnly ? "eager" : "lazy"}
        decoding="async"
        onLoad={onReady}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = getStyleChipPlaceholder(style);
          onReady?.();
        }}
        className="style-preset-chip-thumb"
      />
      <span className="style-preset-chip-label">{style.label}</span>
    </button>
  );
}
