"use client";

import { LibraryPageView } from "@/components/library/LibraryPageView";
import { usePhotoUpload } from "@/components/library/LightroomLibraryHome";

export default function LibraryPage() {
  const { fileRef, uploadInput, uploadingOverlay } = usePhotoUpload();

  return (
    <>
      <LibraryPageView fileRef={fileRef} overlay={uploadingOverlay} />
      {uploadInput}
    </>
  );
}
