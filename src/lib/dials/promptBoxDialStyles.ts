import type { CSSProperties } from "react";
import type { usePromptBoxDials } from "@/lib/dials/usePromptBoxDials";

export function promptBoxDialStyles(d: ReturnType<typeof usePromptBoxDials>): CSSProperties {
  const ease = `cubic-bezier(${d.Animation.easeX1}, ${d.Animation.easeY1}, ${d.Animation.easeX2}, ${d.Animation.easeY2})`;

  return {
    ["--prompt-radius" as string]: `${d.Layout.borderRadius}px`,
    ["--prompt-input-padding-x" as string]: `${d.Layout.inputPaddingX}px`,
    ["--prompt-input-padding-y" as string]: `${d.Layout.inputPaddingY}px`,
    ["--prompt-input-gap" as string]: `${d.Layout.inputGap}px`,
    ["--prompt-footer-padding-x" as string]: `${d.Layout.footerPaddingX}px`,
    ["--prompt-footer-padding-y" as string]: `${d.Layout.footerPaddingY}px`,
    ["--prompt-chips-padding" as string]: `${d.Layout.chipsPadding}px`,
    ["--prompt-submit-size" as string]: `${d.Layout.submitSize}px`,
    ["--prompt-submit-radius" as string]: `${d.Layout.submitRadius}px`,
    ["--prompt-settings-btn-size" as string]: `${d.Layout.settingsBtnSize}px`,
    ["--prompt-font-size" as string]: `${d.Type.fontSize}px`,
    ["--prompt-line-height" as string]: String(d.Type.lineHeight),
    ["--prompt-submit-font-size" as string]: `${d.Type.submitFontSize}px`,
    ["--prompt-transition-duration" as string]: `${d.Animation.transitionDuration}ms`,
    ["--prompt-generating-opacity" as string]: String(d.Animation.generatingOpacity),
    ["--prompt-dropdown-duration" as string]: `${d.Animation.dropdownDuration}ms`,
    ["--prompt-dropdown-offset-y" as string]: `${d.Animation.dropdownOffsetY}px`,
    ["--prompt-settings-btn-duration" as string]: `${d.Animation.settingsBtnDuration}ms`,
    ["--prompt-ease" as string]: ease,
    ["--prompt-shell-bg" as string]: "var(--color-surface-panel)",
    ["--prompt-shell-border" as string]: "var(--color-border)",
    ["--prompt-generating-border" as string]: d.Colors.generatingBorder,
    ["--prompt-text-color" as string]: "var(--color-text-primary)",
    ["--prompt-placeholder-opacity" as string]: String(d.Colors.placeholderOpacity),
    ["--prompt-divider" as string]: "var(--color-border-subtle)",
    ["--prompt-submit-bg" as string]: d.Colors.submitBackground,
    ["--prompt-submit-text" as string]: d.Colors.submitText,
    ["--prompt-submit-disabled-opacity" as string]: String(d.Colors.submitDisabledOpacity),
    ["--prompt-toggle-bg" as string]: "var(--color-surface-input)",
    ["--prompt-toggle-border" as string]: "var(--color-border)",
    ["--prompt-toggle-active-bg" as string]: "var(--color-surface-panel)",
    ["--prompt-toggle-active-text" as string]: "var(--color-text-primary)",
    ["--prompt-settings-btn-color" as string]: "var(--color-text-secondary)",
    ["--prompt-settings-btn-border" as string]: "var(--color-border)",
    ["--prompt-settings-btn-active-color" as string]: d.Colors.settingsBtnActiveColor,
    ["--prompt-dropdown-card-bg" as string]: "var(--color-surface-elevated)",
    ["--prompt-dropdown-card-border" as string]: "var(--color-border)",
  };
}
