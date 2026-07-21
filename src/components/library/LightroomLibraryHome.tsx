"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ACCEPTED_IMAGE_EXTENSIONS, ACCEPTED_IMAGE_TYPES } from "@/lib/constants/exportPresets";
import { useEditorStore } from "@/lib/store/editorStore";

export function usePhotoUpload() {
  const router = useRouter();
  const createProjectFromFile = useEditorStore((s) => s.createProjectFromFile);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return;
      setIsUploading(true);
      try {
        const id = await createProjectFromFile(file);
        router.push(`/editor/${id}`);
      } finally {
        setIsUploading(false);
      }
    },
    [createProjectFromFile, router]
  );

  const uploadInput = (
    <input
      ref={fileRef}
      type="file"
      accept={ACCEPTED_IMAGE_EXTENSIONS}
      style={{ display: "none" }}
      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
    />
  );

  const uploadingOverlay = isUploading ? (
    <div className="library-upload-overlay">
      <div className="library-upload-overlay-inner">
        <div className="spinner" />
        <p>Preparing photo…</p>
      </div>
    </div>
  ) : null;

  return { fileRef, uploadInput, uploadingOverlay, openUpload: () => fileRef.current?.click() };
}
