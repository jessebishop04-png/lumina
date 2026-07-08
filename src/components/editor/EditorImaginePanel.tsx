"use client";

import { EditorImaginePrompt } from "@/components/editor/EditorImaginePrompt";

export function EditorImaginePanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        <EditorImaginePrompt />
      </div>
    </div>
  );
}
