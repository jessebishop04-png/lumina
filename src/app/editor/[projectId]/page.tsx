"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { InstagramSidebar } from "@/components/layout/InstagramSidebar";
import { LightroomToolbar } from "@/components/editor/LightroomToolbar";
import { DevelopPanel } from "@/components/editor/DevelopPanel";
import { Filmstrip } from "@/components/editor/Filmstrip";
import { ExportModal } from "@/components/editor/ExportModal";
import { AnimateImageModal } from "@/components/generate/AnimateImageModal";
import { EditCanvas } from "@/components/editor/EditCanvas";
import { CropCanvas } from "@/components/editor/CropCanvas";
import { useEditorStore } from "@/lib/store/editorStore";

function EditorCanvas() {
  const editorModule = useEditorStore((s) => s.editorModule);
  if (editorModule === "crop") return <CropCanvas />;
  return <EditCanvas />;
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { project, isLoading, loadProject } = useEditorStore();

  useEffect(() => {
    if (projectId) {
      loadProject(projectId).then(() => {
        if (!useEditorStore.getState().project) router.push("/");
      });
    }
  }, [projectId, loadProject, router]);

  if (!isLoading && !project) {
    return null;
  }

  const isReady = !isLoading && !!project;

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--color-surface)", overflow: "hidden" }}>
      <InstagramSidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <LightroomToolbar />

        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0, minWidth: 0, position: "relative" }}>
          {!isReady && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                background: "var(--color-loading-overlay)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 12,
                pointerEvents: "none",
              }}
            >
              <div className="spinner" />
              <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Loading project…</span>
            </div>
          )}
          <EditorCanvas />
          <DevelopPanel />
        </div>

        {isReady && <Filmstrip />}
      </div>

      {isReady && <ExportModal />}
      {isReady && <AnimateImageModal />}
    </div>
  );
}
