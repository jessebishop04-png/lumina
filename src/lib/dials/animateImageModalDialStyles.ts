import type { CSSProperties } from "react";
import type { useAnimateImageModalDials } from "@/lib/dials/useAnimateImageModalDials";

export function animateImageModalDialStyles(d: ReturnType<typeof useAnimateImageModalDials>): CSSProperties {
  const ease = `cubic-bezier(${d.Animation.easeX1}, ${d.Animation.easeY1}, ${d.Animation.easeX2}, ${d.Animation.easeY2})`;

  return {
    ["--animate-modal-panel-max-width" as string]: `${d.Layout.panelMaxWidth}px`,
    ["--animate-modal-panel-radius" as string]: `${d.Layout.panelRadius}px`,
    ["--animate-modal-backdrop-padding" as string]: `${d.Layout.backdropPadding}px`,
    ["--animate-modal-header-px" as string]: `${d.Layout.headerPaddingX}px`,
    ["--animate-modal-header-py" as string]: `${d.Layout.headerPaddingY}px`,
    ["--animate-modal-preview-padding" as string]: `${d.Layout.previewPadding}px`,
    ["--animate-modal-preview-min-height" as string]: `${d.Layout.previewMinHeight}px`,
    ["--animate-modal-side-width" as string]: `${d.Layout.sidePanelWidth}px`,
    ["--animate-modal-title-size" as string]: `${d.Layout.titleFontSize}px`,
    ["--animate-modal-close-size" as string]: `${d.Layout.closeBtnSize}px`,
    ["--animate-modal-image-radius" as string]: `${d.Layout.imageRadius}px`,
    ["--animate-modal-panel-py" as string]: `${d.Layout.panelPaddingY}px`,
    ["--animate-modal-panel-px" as string]: `${d.Layout.panelPaddingX}px`,
    ["--animate-modal-panel-gap" as string]: `${d.Layout.panelGap}px`,
    ["--animate-modal-open-duration" as string]: `${d.Animation.openDuration}ms`,
    ["--animate-modal-ease" as string]: ease,
    ["--animate-modal-scale-start" as string]: String(d.Animation.panelScaleStart),
    ["--animate-modal-offset-y" as string]: `${d.Animation.panelOffsetY}px`,
    ["--animate-modal-backdrop-opacity" as string]: String(d.Animation.backdropOpacity),
    ["--animate-modal-backdrop-color" as string]: "var(--color-bg)",
    ["--animate-modal-panel-bg" as string]: "var(--color-surface-panel)",
    ["--animate-modal-panel-border" as string]: "var(--color-border)",
    ["--animate-modal-preview-bg" as string]: "var(--color-bg)",
    ["--animate-modal-title-color" as string]: "var(--color-text-primary)",
    ["--animate-modal-header-divider" as string]: "var(--color-border-subtle)",
    ["--animate-modal-close-color" as string]: "var(--color-text-secondary)",
    ["--animate-modal-close-border" as string]: "var(--color-border)",
    ["--animate-modal-close-bg" as string]: "transparent",
    ["--animate-modal-generate-bg" as string]: d.Colors.generateBackground,
    ["--animate-modal-generate-text" as string]: d.Colors.generateText,
    ["--animate-modal-cancel-color" as string]: "var(--color-text-secondary)",
    ["--animate-modal-cancel-border" as string]: "var(--color-border)",
    ["--animate-modal-label-color" as string]: "var(--color-text-primary)",
    ["--animate-modal-hint-color" as string]: "var(--color-text-muted)",
    ["--animate-modal-shadow-opacity" as string]: String(d.Colors.shadowOpacity),
  };
}
