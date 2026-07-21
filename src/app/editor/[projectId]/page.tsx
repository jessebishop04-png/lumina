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
    <div className="editor-page">
      <InstagramSidebar />

      <div className="editor-main">
        <LightroomToolbar />

        <div className="editor-workspace">
          {!isReady && (
            <div className="editor-loading-overlay">
              <div className="spinner" />
              <span>Loading project…</span>
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
