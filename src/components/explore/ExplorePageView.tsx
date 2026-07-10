"use client";

import { useEffect } from "react";
import { AppPageShell } from "@/components/layout/AppPageShell";
import { CreatePromptBar } from "@/components/generate/CreatePromptBar";
import { GenerationLightbox } from "@/components/generate/CreationFeed";
import { AnimateImageModal } from "@/components/generate/AnimateImageModal";
import { ExploreFilterBar } from "@/components/explore/ExploreFilterBar";
import { ExploreGrid } from "@/components/explore/ExploreGrid";
import { ExplorePostModal } from "@/components/explore/ExplorePostModal";
import { ExploreSessionFeed } from "@/components/explore/ExploreSessionFeed";
import { WelcomeAuthModal } from "@/components/auth/WelcomeAuthModal";
import { useExploreStore } from "@/lib/store/exploreStore";
import { useGenerationStore } from "@/lib/store/generationStore";

export function ExplorePageView() {
  const loadExplore = useExploreStore((s) => s.loadExplore);
  const filterTab = useExploreStore((s) => s.filterTab);
  const setFilterTab = useExploreStore((s) => s.setFilterTab);
  const loadJobs = useGenerationStore((s) => s.loadJobs);
  const isGenerating = useGenerationStore((s) => s.isGenerating);

  useEffect(() => {
    void loadExplore();
    void loadJobs();
  }, [loadExplore, loadJobs]);

  return (
    <AppPageShell
      top={
        <>
          <CreatePromptBar sticky={false} showHint={false} wide variant="flat" />
          <ExploreFilterBar active={filterTab} onChange={setFilterTab} minimal />
        </>
      }
      overlay={
        <>
          <WelcomeAuthModal />
          <ExplorePostModal />
          <GenerationLightbox />
          <AnimateImageModal />
        </>
      }
    >
      {isGenerating && <ExploreSessionFeed />}
      <ExploreGrid embedded />
    </AppPageShell>
  );
}
