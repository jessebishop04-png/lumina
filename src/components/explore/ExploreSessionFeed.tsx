"use client";

import { GenerationJobCard } from "@/components/generate/CreationFeed";
import { useGenerationStore } from "@/lib/store/generationStore";

/** Compact progress strip while generating on Explore. */
export function ExploreSessionFeed() {
  const jobs = useGenerationStore((s) => s.jobs);
  const active = jobs.find((j) => j.status === "generating" || j.status === "pending");

  if (!active) return null;

  return (
    <div
      style={{
        borderBottom: "1px solid var(--color-border-subtle)",
        background: "var(--color-surface-panel)",
        flexShrink: 0,
      }}
    >
      <GenerationJobCard job={active} />
    </div>
  );
}
