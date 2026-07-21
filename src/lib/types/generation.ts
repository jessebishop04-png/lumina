export type AspectRatioId = "1:1" | "16:9" | "9:16" | "4:5" | "3:2" | "2:3";
export type GenerationMediaType = "image" | "video";
export type VideoDuration = 4 | 6 | 8;

export interface GenerationSettings {
  aspectRatio: AspectRatioId;
  stylize: number;
  variety: number;
  draft: boolean;
  model: "flux" | "turbo";
  videoDuration: VideoDuration;
  videoAudio: boolean;
}

export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  aspectRatio: "1:1",
  stylize: 100,
  variety: 25,
  draft: false,
  model: "flux",
  videoDuration: 4,
  videoAudio: false,
};

export interface ImagineEditState {
  prompt: string;
  activeStyleId: string | null;
  mediaType: GenerationMediaType;
  settings: GenerationSettings;
}

export const DEFAULT_IMAGINE_STATE: ImagineEditState = {
  prompt: "",
  activeStyleId: null,
  mediaType: "image",
  settings: { ...DEFAULT_GENERATION_SETTINGS },
};

export interface GeneratedImage {
  id: string;
  url: string;
  seed: number;
  mediaType?: GenerationMediaType;
}

export type GenerationStatus = "pending" | "generating" | "complete" | "failed";

export interface AnimateImageOptions {
  motionPrompt?: string;
  aspectRatio?: "9:16" | "16:9";
  videoDuration?: VideoDuration;
  videoAudio?: boolean;
  styleId?: string | null;
}

export type AnimateTarget =
  | {
      type: "job";
      jobId: string;
      imageId: string;
      previewUrl: string;
      prompt?: string;
      styleId?: string | null;
    }
  | {
      type: "url";
      imageUrl: string;
      prompt?: string;
      styleId?: string | null;
    };

export interface ImageAnimation {
  id: string;
  sourceImageId: string;
  prompt: string;
  styleId?: string | null;
  settings: Pick<GenerationSettings, "aspectRatio" | "videoDuration" | "videoAudio">;
  video?: GeneratedImage;
  status: GenerationStatus;
  error?: string;
  createdAt: string;
}

export interface GenerationJob {
  id: string;
  prompt: string;
  settings: GenerationSettings;
  images: GeneratedImage[];
  animations?: ImageAnimation[];
  status: GenerationStatus;
  progress: number;
  error?: string;
  parentJobId?: string;
  parentImageId?: string;
  action?: "imagine" | "vary" | "upscale" | "reroll" | "animate";
  styleId?: string | null;
  mediaType?: GenerationMediaType;
  referenceImageDataUrl?: string;
  createdAt: string;
}

export const ASPECT_RATIO_OPTIONS: { id: AspectRatioId; label: string; width: number; height: number }[] = [
  { id: "1:1", label: "Square", width: 1024, height: 1024 },
  { id: "16:9", label: "Landscape", width: 1344, height: 768 },
  { id: "9:16", label: "Portrait", width: 768, height: 1344 },
  { id: "4:5", label: "4:5", width: 896, height: 1120 },
  { id: "3:2", label: "3:2", width: 1216, height: 832 },
  { id: "2:3", label: "2:3", width: 832, height: 1216 },
];

export function getDimensions(settings: GenerationSettings, upscale = false): { width: number; height: number } {
  const opt = ASPECT_RATIO_OPTIONS.find((a) => a.id === settings.aspectRatio) ?? ASPECT_RATIO_OPTIONS[0];
  const scale = settings.draft ? 0.5 : upscale ? 1.5 : 1;
  return {
    width: Math.round(opt.width * scale),
    height: Math.round(opt.height * scale),
  };
}
