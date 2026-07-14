"use client";

import { InstagramSidebar } from "@/components/layout/InstagramSidebar";
import { LibraryGrid, usePhotoUpload } from "@/components/library/LightroomLibraryHome";

export default function LibraryPage() {
  const { fileRef, uploadInput, uploadingOverlay, openUpload } = usePhotoUpload();

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--color-surface)", overflow: "hidden" }}>
      <InstagramSidebar />
      <LibraryGrid fileRef={fileRef} />
      {uploadInput}
      {uploadingOverlay}
    </div>
  );
}
