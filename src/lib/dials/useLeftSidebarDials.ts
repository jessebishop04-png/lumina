"use client";

import { useDialKit } from "dialkit";

export function useLeftSidebarDials() {
  return useDialKit(
    "Left Sidebar",
    {
      Layout: {
        collapsedWidth: [72, 56, 96],
        expandedWidth: [220, 160, 320],
        iconInset: [24, 12, 36],
        itemGap: [2, 0, 12],
        itemMinHeight: [48, 40, 64],
        itemPaddingY: [12, 4, 20],
        labelGap: [12, 0, 16],
        labelMaxWidth: [140, 80, 200],
        logoRestMaxWidth: [72, 40, 120],
      },
      Animation: {
        expandDuration: [320, 120, 700],
        labelDuration: [280, 100, 600],
        easeX1: [0.32, 0, 1],
        easeY1: [0.72, 0, 1],
        easeX2: [0, 0, 1],
        easeY2: [1, 0, 1],
      },
      Controls: {
        iconSize: [24, 18, 32],
        labelFontSize: [15, 12, 18],
        logoFontSize: [32, 20, 40],
        itemBorderRadius: [10, 0, 16],
        profileAvatarSize: [28, 20, 40],
        itemHoverOpacity: [1, 0.6, 1],
      },
      Colors: {
        background: { type: "color", default: "#121212" },
        itemColor: { type: "color", default: "#737373" },
        itemActiveColor: { type: "color", default: "#fafafa" },
      },
    },
    {
      id: "left-sidebar",
      persist: true,
    }
  );
}
