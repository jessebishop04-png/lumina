import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { GeneratedImage, GenerationJob, GenerationSettings } from "@/lib/types/generation";
import { DEFAULT_GENERATION_SETTINGS } from "@/lib/types/generation";
import {
  deleteGenerationJob,
  getGenerationJobs,
  saveGenerationJob,
} from "@/lib/storage/generationStorage";
import { publishToExplore } from "@/lib/explore/publishToExplore";
import { notifyExploreNewPost } from "@/lib/store/exploreStore";

interface GenerationState {
  jobs: GenerationJob[];
  settings: GenerationSettings;
  prompt: string;
  referenceImageDataUrl: string | null;
  activeStyleId: string | null;
  isGenerating: boolean;
  selectedJobId: string | null;
  selectedImageId: string | null;

  loadJobs: () => Promise<void>;
  setPrompt: (prompt: string) => void;
  setReferenceImage: (dataUrl: string | null) => void;
  toggleStyle: (styleId: string) => void;
  setSettings: (settings: Partial<GenerationSettings>) => void;
  setSelected: (jobId: string | null, imageId: string | null) => void;
  imagine: (prompt?: string) => Promise<string | null>;
  vary: (jobId: string, imageId: string) => Promise<string | null>;
  upscale: (jobId: string, imageId: string) => Promise<string | null>;
  reroll: (jobId: string) => Promise<string | null>;
  deleteJob: (jobId: string) => Promise<void>;
}

async function callGenerateApi(
  prompt: string,
  settings: GenerationSettings,
  opts: {
    count?: number;
    seeds?: number[];
    upscale?: boolean;
    styleId?: string | null;
    referenceImageDataUrl?: string;
  } = {}
): Promise<{ url: string; seed: number }[]> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, settings, ...opts }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Generation failed");
  return data.images;
}

async function runGeneration(
  job: GenerationJob,
  onUpdate: (job: GenerationJob) => void
): Promise<GenerationJob> {
  const count = job.action === "upscale" ? 1 : 4;
  const seeds = Array.from({ length: count }, () => Math.floor(Math.random() * 999999));
  const images: GeneratedImage[] = [];

  let current: GenerationJob = { ...job, status: "generating", progress: 0, images: [] };
  onUpdate(current);
  await saveGenerationJob(current);

  for (let i = 0; i < count; i++) {
    try {
      const results = await callGenerateApi(job.prompt, job.settings, {
        count: 1,
        seeds: [seeds[i]],
        upscale: job.action === "upscale",
        styleId: job.styleId,
        referenceImageDataUrl: job.referenceImageDataUrl,
      });
      images.push({
        id: uuidv4(),
        url: results[0].url,
        seed: results[0].seed,
      });
      const latestImage = images[images.length - 1]!;
      void publishToExplore({
        imageUrl: latestImage.url,
        prompt: job.prompt,
        styleId: job.styleId,
        source: "generate",
        sourceKey: `gen:${job.id}:${latestImage.id}`,
      }).then((post) => {
        if (post) notifyExploreNewPost(post);
      });
      current = {
        ...current,
        images: [...images],
        progress: Math.round(((i + 1) / count) * 100),
      };
      onUpdate(current);
      await saveGenerationJob(current);
    } catch (err) {
      const failed = {
        ...current,
        status: "failed" as const,
        error: err instanceof Error ? err.message : "Failed",
        progress: Math.round((images.length / count) * 100),
      };
      onUpdate(failed);
      await saveGenerationJob(failed);
      return failed;
    }
  }

  const complete = { ...current, status: "complete" as const, progress: 100, images };
  onUpdate(complete);
  await saveGenerationJob(complete);
  return complete;
}

function updateJobInList(jobs: GenerationJob[], updated: GenerationJob): GenerationJob[] {
  const idx = jobs.findIndex((j) => j.id === updated.id);
  if (idx === -1) return [updated, ...jobs];
  const next = [...jobs];
  next[idx] = updated;
  return next;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  jobs: [],
  settings: { ...DEFAULT_GENERATION_SETTINGS },
  prompt: "",
  referenceImageDataUrl: null,
  activeStyleId: null,
  isGenerating: false,
  selectedJobId: null,
  selectedImageId: null,

  loadJobs: async () => {
    const jobs = await getGenerationJobs();
    set({ jobs });
  },

  setPrompt: (prompt) => set({ prompt }),
  setReferenceImage: (dataUrl) => set({ referenceImageDataUrl: dataUrl }),
  toggleStyle: (styleId) =>
    set((s) => ({
      activeStyleId: s.activeStyleId === styleId ? null : styleId,
    })),
  setSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),
  setSelected: (jobId, imageId) => set({ selectedJobId: jobId, selectedImageId: imageId }),

  imagine: async (promptOverride) => {
    const { prompt, settings, referenceImageDataUrl, activeStyleId, isGenerating } = get();
    const text = (promptOverride ?? prompt).trim();
    if ((!text && !referenceImageDataUrl) || isGenerating) return null;

    const job: GenerationJob = {
      id: uuidv4(),
      prompt: text,
      settings: { ...settings },
      images: [],
      status: "pending",
      progress: 0,
      action: "imagine",
      styleId: activeStyleId,
      referenceImageDataUrl: referenceImageDataUrl ?? undefined,
      createdAt: new Date().toISOString(),
    };

    set((s) => ({ jobs: [job, ...s.jobs], isGenerating: true, prompt: text }));
    await saveGenerationJob(job);

    const onUpdate = (updated: GenerationJob) => {
      set((s) => ({
        jobs: updateJobInList(s.jobs, updated),
      }));
    };

    await runGeneration(job, onUpdate);
    set({ isGenerating: false });
    return job.id;
  },

  vary: async (jobId, imageId) => {
    const source = get().jobs.find((j) => j.id === jobId);
    const sourceImage = source?.images.find((i) => i.id === imageId);
    if (!source || !sourceImage || get().isGenerating) return null;

    const job: GenerationJob = {
      id: uuidv4(),
      prompt: `${source.prompt} --variation`,
      settings: { ...source.settings, variety: Math.min(100, source.settings.variety + 20) },
      images: [],
      status: "pending",
      progress: 0,
      action: "vary",
      parentJobId: jobId,
      parentImageId: imageId,
      createdAt: new Date().toISOString(),
    };

    set((s) => ({ jobs: [job, ...s.jobs], isGenerating: true }));
    await saveGenerationJob(job);

    const onUpdate = (updated: GenerationJob) => {
      set((s) => ({ jobs: updateJobInList(s.jobs, updated) }));
    };

    await runGeneration(job, onUpdate);
    set({ isGenerating: false });
    return job.id;
  },

  upscale: async (jobId, imageId) => {
    const source = get().jobs.find((j) => j.id === jobId);
    if (!source || get().isGenerating) return null;

    const job: GenerationJob = {
      id: uuidv4(),
      prompt: source.prompt,
      settings: { ...source.settings, draft: false },
      images: [],
      status: "pending",
      progress: 0,
      action: "upscale",
      parentJobId: jobId,
      parentImageId: imageId,
      createdAt: new Date().toISOString(),
    };

    set((s) => ({ jobs: [job, ...s.jobs], isGenerating: true }));
    await saveGenerationJob(job);

    const onUpdate = (updated: GenerationJob) => {
      set((s) => ({ jobs: updateJobInList(s.jobs, updated) }));
    };

    await runGeneration(job, onUpdate);
    set({ isGenerating: false });
    return job.id;
  },

  reroll: async (jobId) => {
    const source = get().jobs.find((j) => j.id === jobId);
    if (!source || get().isGenerating) return null;

    set({
      prompt: source.prompt,
      settings: source.settings,
      activeStyleId: source.styleId ?? null,
      referenceImageDataUrl: source.referenceImageDataUrl ?? null,
    });
    return get().imagine(source.prompt);
  },

  deleteJob: async (jobId) => {
    await deleteGenerationJob(jobId);
    set((s) => ({
      jobs: s.jobs.filter((j) => j.id !== jobId),
      selectedJobId: s.selectedJobId === jobId ? null : s.selectedJobId,
    }));
  },
}));
