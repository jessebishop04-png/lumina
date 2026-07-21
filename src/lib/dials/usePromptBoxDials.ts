"use client";

import { useDialKit } from "dialkit";

export function usePromptBoxDials() {
  return useDialKit(
    "Prompt Box",
    {
      Layout: {
        borderRadius: [12, 0, 24],
        inputPaddingX: [10, 4, 20],
        inputPaddingY: [8, 4, 16],
        inputGap: [8, 4, 16],
        footerPaddingY: [6, 2, 14],
        footerPaddingX: [8, 4, 16],
        chipsPadding: [8, 4, 16],
        submitSize: [36, 28, 48],
        submitRadius: [10, 4, 16],
        settingsBtnSize: [32, 28, 48],
      },
      Type: {
        fontSize: [13, 11, 17],
        lineHeight: [1.45, 1.2, 1.8],
        submitFontSize: [16, 12, 20],
      },
      Animation: {
        transitionDuration: [200, 80, 500],
        generatingOpacity: [0.72, 0.4, 1],
        dropdownDuration: [180, 80, 400],
        dropdownOffsetY: [4, 0, 16],
        settingsBtnDuration: [150, 80, 400],
        easeX1: [0.32, 0, 1],
        easeY1: [0.72, 0, 1],
        easeX2: [0, 0, 1],
        easeY2: [1, 0, 1],
      },
      Colors: {
        shellBackground: { type: "color", default: "#2a2a2a" },
        shellBorder: { type: "color", default: "#363636" },
        generatingBorder: { type: "color", default: "#3b82f6" },
        textareaColor: { type: "color", default: "#f5f5f5" },
        placeholderOpacity: [0.5, 0.2, 0.9],
        dividerColor: { type: "color", default: "#262626" },
        submitBackground: { type: "color", default: "#3b82f6" },
        submitText: { type: "color", default: "#ffffff" },
        submitDisabledOpacity: [0.45, 0.2, 0.8],
        toggleBackground: { type: "color", default: "#2a2a2a" },
        toggleBorder: { type: "color", default: "#363636" },
        toggleActiveBackground: { type: "color", default: "#1e1e1e" },
        toggleActiveText: { type: "color", default: "#fafafa" },
        settingsBtnColor: { type: "color", default: "#a3a3a3" },
        settingsBtnBorder: { type: "color", default: "#363636" },
        settingsBtnActiveColor: { type: "color", default: "#3b82f6" },
        dropdownCardBackground: { type: "color", default: "#1e1e1e" },
        dropdownCardBorder: { type: "color", default: "#333333" },
      },
    },
    {
      id: "prompt-box",
      persist: true,
    }
  );
}
