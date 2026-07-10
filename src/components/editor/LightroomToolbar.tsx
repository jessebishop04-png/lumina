"use client";

import { EditorActionsMenu } from "@/components/editor/EditorActionsMenu";
import type { EditorModule } from "@/lib/store/editorStore";
import { useEditorStore } from "@/lib/store/editorStore";

const MODULES: { id: EditorModule; label: string }[] = [
  { id: "edit", label: "Adjust" },
  { id: "crop", label: "Crop & Rotate" },
];

export function LightroomToolbar() {
  const project = useEditorStore((s) => s.project);
  const editorModule = useEditorStore((s) => s.editorModule);
  const showBefore = useEditorStore((s) => s.showBefore);
  const setEditorModule = useEditorStore((s) => s.setEditorModule);
  const setShowBefore = useEditorStore((s) => s.setShowBefore);
  const setShowExportModal = useEditorStore((s) => s.setShowExportModal);
  const resetAllAdjustments = useEditorStore((s) => s.resetAllAdjustments);
  const persistProject = useEditorStore((s) => s.persistProject);
  const isProcessing = useEditorStore((s) => s.isProcessing);

  return (
    <header
      style={{
        height: 52,
        minHeight: 52,
        background: "var(--color-surface-panel)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        flexShrink: 0,
      }}
    >
      <div style={{ minWidth: 160 }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)" }}>
          {project?.name ?? "Project"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", flex: 1, justifyContent: "center", minWidth: 0, padding: "0 12px" }}>
        <div
          style={{
            display: "flex",
            maxWidth: "100%",
            overflowX: "auto",
            background: "var(--color-module-track)",
            borderRadius: 20,
            padding: 3,
            gap: 2,
            scrollbarWidth: "none",
          }}
        >
          {MODULES.map((mod) => (
            <button
              key={mod.id}
              type="button"
              onClick={() => setEditorModule(mod.id)}
              className={editorModule === mod.id ? "lr-module-active" : "lr-module-inactive"}
              style={{
                padding: "6px 14px",
                borderRadius: 18,
                fontSize: 13,
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {mod.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 160, justifyContent: "flex-end" }}>
        <EditorActionsMenu />
        {isProcessing && <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Processing…</span>}
        {editorModule === "edit" && (
          <>
            <button
              type="button"
              onClick={() => setShowBefore(!showBefore)}
              title="Compare original and edited side by side"
              data-active={showBefore ? "true" : "false"}
              className="lr-compare-btn"
              style={{
                padding: "6px 12px",
                fontSize: 12,
                color: showBefore ? "var(--color-accent)" : "var(--color-text-secondary)",
                borderRadius: 8,
                border: showBefore ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                background: showBefore ? "var(--color-accent-soft)" : "var(--color-surface-panel)",
              }}
            >
              Compare
            </button>
            <button
              onClick={() => {
                resetAllAdjustments();
                persistProject();
              }}
              style={{ padding: "6px 12px", fontSize: 12, color: "var(--color-text-secondary)", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-surface-panel)" }}
            >
              Reset
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setShowExportModal(true)}
          style={{
            padding: "7px 16px",
            fontSize: 13,
            fontWeight: 600,
            background: "var(--color-accent)",
            color: "#fff",
            borderRadius: 8,
          }}
        >
          Export
        </button>
      </div>
    </header>
  );
}
