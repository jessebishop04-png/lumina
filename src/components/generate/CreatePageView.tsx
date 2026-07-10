"use client";

import { useEffect } from "react";
import { AppPageShell } from "@/components/layout/AppPageShell";
import { CreatePromptBar } from "@/components/generate/CreatePromptBar";
import { CreationFeed, GenerationLightbox } from "@/components/generate/CreationFeed";
import { AnimateImageModal } from "@/components/generate/AnimateImageModal";
import { useGenerationStore } from "@/lib/store/generationStore";

export function CreatePageView() {
  const loadJobs = useGenerationStore((s) => s.loadJobs);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  return (
    <AppPageShell
      top={<CreatePromptBar sticky={false} showHint={false} wide variant="flat" />}
      overlay={
        <>
          <GenerationLightbox />
          <AnimateImageModal />
        </>
      }
    >
      <CreationFeed embedded />
    </AppPageShell>
  );
}
