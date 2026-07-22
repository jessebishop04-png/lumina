import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { AnimateImageOptions, AnimateTarget, GeneratedImage, GenerationJob, GenerationMediaType, GenerationSettings, ImageAnimation } from "@/lib/types/generation";
import { DEFAULT_GENERATION_SETTINGS } from "@/lib/types/generation";
import {
  deleteGenerationJob,
  getGenerationJobs,
  saveGenerationJob,
} from "@/lib/storage/generationStorage";
import { publishToExplore } from "@/lib/explore/publishToExplore";
import { notifyExploreNewPost } from "@/lib/store/exploreStore";
import { urlToDataUrl } from "@/lib/image/urlToDataUrl";

interface GenerationState {
  jobs: GenerationJob[];
  settings: GenerationSettings;
  prompt: string;
  referenceImageDataUrl: string | null;
  mediaType: GenerationMediaType;
  activeStyleId: string | null;
  isGenerating: boolean;
  selectedJobId: string | null;
  selectedImageId: string | null;
  selectedAnimationId: string | null;
  animateTarget: AnimateTarget | null;

  loadJobs: () => Promise<void>;
  setPrompt: (prompt: string) => void;
  setReferenceImage: (dataUrl: string | null) => void;
  setMediaType: (mediaType: GenerationMediaType) => void;
  toggleStyle: (styleId: string) => void;
  setSettings: (settings: Partial<GenerationSettings>) => void;
  setSelected: (jobId: string | null, imageId: string | null, animationId?: string | null) => void;
  setAnimateTarget: (target: AnimateTarget | null) => void;
  imagine: (prompt?: string) => Promise<string | null>;
  vary: (jobId: string, imageId: string) => Promise<string | null>;
  upscale: (jobId: string, imageId: string) => Promise<string | null>;
  reroll: (jobId: string) => Promise<string | null>;
  animateImage: (jobId: string, imageId: string, options?: AnimateImageOptions) => Promise<string | null>;
  animateFromUrl: (imageUrl: string, prompt?: string, styleId?: string | null, options?: AnimateImageOptions) => Promise<string | null>;
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

async function callGenerateVideoApi(
  prompt: string,
  settings: GenerationSettings,
  opts: { seed?: number; styleId?: string | null; referenceImageDataUrl?: string } = {}
): Promise<{ url: string; seed: number }[]> {
  const res = await fetch("/api/generate/video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, settings, ...opts }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Video generation failed");
  return data.videos;
}

async function runVideoGeneration(
  job: GenerationJob,
  onUpdate: (job: GenerationJob) => void
): Promise<GenerationJob> {
  const seed = Math.floor(Math.random() * 999999);
  const current: GenerationJob = { ...job, status: "generating", progress: 0, images: [] };
  onUpdate(current);
  await saveGenerationJob(current);

  try {
    const results = await callGenerateVideoApi(job.prompt, job.settings, {
      seed,
      styleId: job.styleId,
      referenceImageDataUrl: job.referenceImageDataUrl,
    });

    const images: GeneratedImage[] = results.map((result) => ({
      id: uuidv4(),
      url: result.url,
      seed: result.seed,
      mediaType: "video",
    }));

    const complete = { ...current, status: "complete" as const, progress: 100, images };
    onUpdate(complete);
    await saveGenerationJob(complete);

    for (const video of images) {
      void publishToExplore({
        imageUrl: video.url,
        prompt: job.prompt,
        styleId: job.styleId,
        mediaType: "video",
        source: "generate",
        sourceKey: `gen:${job.id}:${video.id}`,
      }).then((post) => {
        if (post) notifyExploreNewPost(post);
      });
    }

    return complete;
  } catch (err) {
    const failed = {
      ...current,
      status: "failed" as const,
      error: err instanceof Error ? err.message : "Failed",
      progress: 0,
    };
    onUpdate(failed);
    await saveGenerationJob(failed);
    return failed;
  }
}

async function runGeneration(
  job: GenerationJob,
  onUpdate: (job: GenerationJob) => void
): Promise<GenerationJob> {
  if (job.mediaType === "video") {
    return runVideoGeneration(job, onUpdate);
  }

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
        mediaType: "image",
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

async function runInPlaceAnimation(
  jobId: string,
  animation: ImageAnimation,
  referenceImageDataUrl: string,
  onUpdate: (job: GenerationJob) => void,
  getJob: () => GenerationJob | undefined
): Promise<void> {
  const patchAnimation = (patch: Partial<ImageAnimation>) => {
    const current = getJob();
    if (!current) return;
    const animations = (current.animations ?? []).map((a) =>
      a.id === animation.id ? { ...a, ...patch } : a
    );
    const updated = { ...current, animations };
    onUpdate(updated);
    void saveGenerationJob(updated);
  };

  try {
    const results = await callGenerateVideoApi(animation.prompt, {
      ...DEFAULT_GENERATION_SETTINGS,
      aspectRatio: animation.settings.aspectRatio,
      videoDuration: animation.settings.videoDuration,
      videoAudio: animation.settings.videoAudio,
    }, {
      seed: Math.floor(Math.random() * 999999),
      styleId: animation.styleId,
      referenceImageDataUrl,
    });

    const video: GeneratedImage = {
      id: uuidv4(),
      url: results[0]!.url,
      seed: results[0]!.seed,
      mediaType: "video",
    };
    patchAnimation({ status: "complete", video });

    const job = getJob();
    if (job && video) {
      void publishToExplore({
        imageUrl: video.url,
        prompt: animation.prompt,
        styleId: animation.styleId ?? job.styleId,
        mediaType: "video",
        source: "generate",
        sourceKey: `gen:${jobId}:anim:${animation.id}`,
      }).then((post) => {
        if (post) notifyExploreNewPost(post);
      });
    }
  } catch (err) {
    patchAnimation({
      status: "failed",
      error: err instanceof Error ? err.message : "Failed",
    });
  }
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  jobs: [],
  settings: { ...DEFAULT_GENERATION_SETTINGS },
  prompt: "",
  referenceImageDataUrl: null,
  mediaType: "image",
  activeStyleId: null,
  isGenerating: false,
  selectedJobId: null,
  selectedImageId: null,
  selectedAnimationId: null,
  animateTarget: null,

  loadJobs: async () => {
    if (get().jobs.length > 0) return;
    const jobs = await getGenerationJobs();
    set({ jobs });
  },

  setPrompt: (prompt) => set({ prompt }),
  setReferenceImage: (dataUrl) => set({ referenceImageDataUrl: dataUrl }),
  setMediaType: (mediaType) =>
    set((s) => ({
      mediaType,
      settings:
        mediaType === "video" && s.settings.aspectRatio !== "9:16" && s.settings.aspectRatio !== "16:9"
          ? { ...s.settings, aspectRatio: "9:16" }
          : s.settings,
    })),
  toggleStyle: (styleId) =>
    set((s) => ({
      activeStyleId: s.activeStyleId === styleId ? null : styleId,
    })),
  setSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),
  setSelected: (jobId, imageId, animationId = null) =>
    set({ selectedJobId: jobId, selectedImageId: imageId, selectedAnimationId: animationId }),

  setAnimateTarget: (target) => set({ animateTarget: target }),

  imagine: async (promptOverride) => {
    const { prompt, settings, referenceImageDataUrl, mediaType, activeStyleId, isGenerating } = get();
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
      mediaType,
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
    if (!source || !sourceImage || get().isGenerating || source.mediaType === "video") return null;

    const job: GenerationJob = {
      id: uuidv4(),
      prompt: `${source.prompt} --variation`,
      settings: { ...source.settings, variety: Math.min(100, source.settings.variety + 20) },
      images: [],
      status: "pending",
      progress: 0,
      action: "vary",
      mediaType: "image",
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
    if (!source || get().isGenerating || source.mediaType === "video") return null;

    const job: GenerationJob = {
      id: uuidv4(),
      prompt: source.prompt,
      settings: { ...source.settings, draft: false },
      images: [],
      status: "pending",
      progress: 0,
      action: "upscale",
      mediaType: "image",
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
      mediaType: source.mediaType ?? "image",
      activeStyleId: source.styleId ?? null,
      referenceImageDataUrl: source.referenceImageDataUrl ?? null,
    });
    return get().imagine(source.prompt);
  },

  animateImage: async (jobId, imageId, options = {}) => {
    const source = get().jobs.find((j) => j.id === jobId);
    const sourceImage = source?.images.find((i) => i.id === imageId);
    if (!source || !sourceImage || sourceImage.mediaType === "video") return null;

    const aspectRatio = options.aspectRatio === "16:9" ? "16:9" : "9:16";
    const videoDuration = options.videoDuration ?? 4;
    const videoAudio = options.videoAudio ?? false;
    const styleId = options.styleId ?? source.styleId ?? get().activeStyleId;
    const motionPrompt =
      options.motionPrompt?.trim() ||
      source.prompt ||
      "gentle cinematic motion, subtle natural movement";

    let referenceImageDataUrl: string;
    try {
      referenceImageDataUrl = await urlToDataUrl(sourceImage.url);
    } catch (err) {
      console.error(err);
      return null;
    }

    const animation: ImageAnimation = {
      id: uuidv4(),
      sourceImageId: imageId,
      prompt: motionPrompt,
      styleId,
      settings: { aspectRatio, videoDuration, videoAudio },
      status: "generating",
      createdAt: new Date().toISOString(),
    };

    const updatedJob: GenerationJob = {
      ...source,
      animations: [...(source.animations ?? []), animation],
    };

    set((s) => ({ jobs: updateJobInList(s.jobs, updatedJob) }));
    await saveGenerationJob(updatedJob);

    const onUpdate = (job: GenerationJob) => {
      set((s) => ({ jobs: updateJobInList(s.jobs, job) }));
    };

    void runInPlaceAnimation(jobId, animation, referenceImageDataUrl, onUpdate, () =>
      get().jobs.find((j) => j.id === jobId)
    );

    return animation.id;
  },

  animateFromUrl: async (imageUrl, prompt, styleId, options = {}) => {
    if (get().isGenerating) return null;

    let referenceImageDataUrl = imageUrl;
    try {
      referenceImageDataUrl = await urlToDataUrl(imageUrl);
    } catch (err) {
      console.error(err);
      return null;
    }

    const aspectRatio = options.aspectRatio === "16:9" ? "16:9" : "9:16";
    const videoDuration = options.videoDuration ?? 4;
    const videoAudio = options.videoAudio ?? false;
    const motionPrompt =
      options.motionPrompt?.trim() ||
      prompt?.trim() ||
      "gentle cinematic motion, subtle natural movement";

    const job: GenerationJob = {
      id: uuidv4(),
      prompt: motionPrompt,
      settings: {
        ...get().settings,
        aspectRatio,
        videoDuration,
        videoAudio,
      },
      images: [],
      status: "pending",
      progress: 0,
      action: "animate",
      mediaType: "video",
      styleId: styleId ?? options.styleId ?? get().activeStyleId,
      referenceImageDataUrl,
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

  deleteJob: async (jobId) => {
    await deleteGenerationJob(jobId);
    set((s) => ({
      jobs: s.jobs.filter((j) => j.id !== jobId),
      selectedJobId: s.selectedJobId === jobId ? null : s.selectedJobId,
      selectedAnimationId: s.selectedJobId === jobId ? null : s.selectedAnimationId,
    }));
  },
}));
