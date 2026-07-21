"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { canRedoHistory, canUndoHistory, getHistoryStacks } from "@/lib/store/editHistory";
import type { EditorModule } from "@/lib/store/editorStore";
import { useEditorStore } from "@/lib/store/editorStore";

const MODULES: { id: EditorModule; label: string }[] = [
  { id: "edit", label: "Adjust" },
  { id: "crop", label: "Crop & Rotate" },
];

function ToolbarIconButton({
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`editor-toolbar-icon${active ? " is-active" : ""}`}
    >
      {children}
    </button>
  );
}

function CompareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <rect x="3" y="5" width="8" height="14" rx="1.5" />
      <rect x="13" y="5" width="8" height="14" rx="1.5" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 20h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function LightroomToolbar() {
  const router = useRouter();
  const project = useEditorStore((s) => s.project);
  const editorModule = useEditorStore((s) => s.editorModule);
  const showBefore = useEditorStore((s) => s.showBefore);
  const editHistoryByImage = useEditorStore((s) => s.editHistoryByImage);
  const setEditorModule = useEditorStore((s) => s.setEditorModule);
  const setShowBefore = useEditorStore((s) => s.setShowBefore);
  const setShowExportModal = useEditorStore((s) => s.setShowExportModal);
  const undoEdit = useEditorStore((s) => s.undoEdit);
  const redoEdit = useEditorStore((s) => s.redoEdit);
  const saveProjectNow = useEditorStore((s) => s.saveProjectNow);
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const isAdjusting = useEditorStore((s) => s.isAdjusting);
  const [isSaving, setIsSaving] = useState(false);

  const activeImageId = project?.activeImageId ?? null;
  const isVideo = project?.images.find((img) => img.id === activeImageId)?.mediaType === "video";
  const historyStacks = activeImageId ? getHistoryStacks(editHistoryByImage, activeImageId) : { past: [], future: [] };
  const canUndo = canUndoHistory(historyStacks);
  const canRedo = canRedoHistory(historyStacks);

  const handleCompare = () => {
    if (editorModule !== "edit") {
      setEditorModule("edit");
      setShowBefore(true);
      return;
    }
    setShowBefore(!showBefore);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await saveProjectNow();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <header className="editor-toolbar">
      <div className="editor-toolbar-filename" title={project?.name ?? "Project"}>
        {project?.name ?? "Project"}
      </div>

      <div className="editor-toolbar-modules">
        <div className="editor-module-track">
          {MODULES.map((mod) => (
            <button
              key={mod.id}
              type="button"
              onClick={() => setEditorModule(mod.id)}
              className={editorModule === mod.id ? "lr-module-active" : "lr-module-inactive"}
            >
              {mod.label}
            </button>
          ))}
        </div>
      </div>

      <div className="editor-toolbar-actions">
        {isProcessing && !isAdjusting && (
          <span className="editor-toolbar-status">Processing…</span>
        )}
        {!isVideo && (
          <ToolbarIconButton
            title="Compare before and after"
            active={showBefore && editorModule === "edit"}
            onClick={handleCompare}
          >
            <CompareIcon />
          </ToolbarIconButton>
        )}
        <ToolbarIconButton title="Undo" disabled={!canUndo || isVideo} onClick={undoEdit}>
          <UndoIcon />
        </ToolbarIconButton>
        <ToolbarIconButton title="Redo" disabled={!canRedo || isVideo} onClick={redoEdit}>
          <RedoIcon />
        </ToolbarIconButton>
        <ToolbarIconButton title="Save project" disabled={isSaving} onClick={() => void handleSave()}>
          <SaveIcon />
        </ToolbarIconButton>
        <div className="editor-toolbar-divider" aria-hidden />
        <ToolbarIconButton title="Export" onClick={() => setShowExportModal(true)}>
          <ExportIcon />
        </ToolbarIconButton>
        <ToolbarIconButton title="Close editor" onClick={() => router.push("/library")}>
          <CloseIcon />
        </ToolbarIconButton>
      </div>
    </header>
  );
}
