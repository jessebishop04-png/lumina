"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { InstagramSidebar } from "@/components/layout/InstagramSidebar";
import { LightroomToolbar } from "@/components/editor/LightroomToolbar";
import { DevelopPanel } from "@/components/editor/DevelopPanel";
import { Filmstrip } from "@/components/editor/Filmstrip";
import { ExportModal } from "@/components/editor/ExportModal";
import { EditCanvas } from "@/components/editor/EditCanvas";
import { CropCanvas } from "@/components/editor/CropCanvas";
import { ACCEPTED_IMAGE_EXTENSIONS, ACCEPTED_IMAGE_TYPES } from "@/lib/constants/exportPresets";
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
  const { project, isLoading, loadProject, createProjectFromFile } = useEditorStore();
  const createFileRef = useRef<HTMLInputElement>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProject(projectId).then(() => {
        if (!useEditorStore.getState().project) router.push("/");
      });
    }
  }, [projectId, loadProject, router]);

  const openCreate = () => createFileRef.current?.click();

  const handleCreateFile = async (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return;
    setIsCreating(true);
    try {
      const id = await createProjectFromFile(file);
      router.push(`/editor/${id}`);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isLoading && !project) {
    return null;
  }

  const isReady = !isLoading && !!project;

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--color-surface)", overflow: "hidden" }}>
      <InstagramSidebar onCreateClick={openCreate} />

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

      <input
        ref={createFileRef}
        type="file"
        accept={ACCEPTED_IMAGE_EXTENSIONS}
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleCreateFile(f);
        }}
      />

      {isCreating && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--color-loading-overlay)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>Preparing photo…</p>
          </div>
        </div>
      )}
    </div>
  );
}
