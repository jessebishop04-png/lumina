"use client";

import { useDialKit } from "dialkit";

export function useAnimateImageModalDials() {
  return useDialKit(
    "Animate Image Modal",
    {
      Layout: {
        panelMaxWidth: [960, 640, 1200],
        panelRadius: [16, 0, 28],
        backdropPadding: [24, 8, 48],
        headerPaddingX: [20, 12, 32],
        headerPaddingY: [16, 8, 24],
        previewPadding: [20, 8, 32],
        previewMinHeight: [320, 200, 520],
        sidePanelWidth: [380, 280, 460],
        titleFontSize: [15, 12, 20],
        closeBtnSize: [36, 28, 48],
        imageRadius: [8, 0, 16],
        panelPaddingY: [20, 12, 32],
        panelPaddingX: [24, 16, 36],
        panelGap: [16, 8, 24],
      },
      Animation: {
        openDuration: [280, 100, 600],
        easeX1: [0.32, 0, 1],
        easeY1: [0.72, 0, 1],
        easeX2: [0, 0, 1],
        easeY2: [1, 0, 1],
        panelScaleStart: [0.96, 0.88, 1],
        panelOffsetY: [12, 0, 32],
        backdropOpacity: [0.92, 0.5, 1],
      },
      Colors: {
        backdropColor: { type: "color", default: "#000000" },
        panelBackground: { type: "color", default: "#1a1a1a" },
        panelBorder: { type: "color", default: "#333333" },
        previewBackground: { type: "color", default: "#0a0a0a" },
        titleColor: { type: "color", default: "#fafafa" },
        headerDivider: { type: "color", default: "#262626" },
        closeColor: { type: "color", default: "#a3a3a3" },
        closeBorder: { type: "color", default: "#333333" },
        closeBackground: { type: "color", default: "transparent" },
        generateBackground: { type: "color", default: "#3b82f6" },
        generateText: { type: "color", default: "#ffffff" },
        cancelColor: { type: "color", default: "#a3a3a3" },
        cancelBorder: { type: "color", default: "#333333" },
        labelColor: { type: "color", default: "#fafafa" },
        hintColor: { type: "color", default: "#737373" },
        shadowOpacity: [0.35, 0, 0.6],
      },
    },
    {
      id: "animate-image-modal",
      persist: true,
    }
  );
}
