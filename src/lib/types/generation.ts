export type AspectRatioId = "1:1" | "16:9" | "9:16" | "4:5" | "3:2" | "2:3";

export interface GenerationSettings {
  aspectRatio: AspectRatioId;
  stylize: number;
  variety: number;
  draft: boolean;
  model: "flux" | "turbo";
}

export const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
  aspectRatio: "1:1",
  stylize: 100,
  variety: 25,
  draft: false,
  model: "flux",
};

export interface ImagineEditState {
  prompt: string;
  activeStyleId: string | null;
  settings: GenerationSettings;
}

export const DEFAULT_IMAGINE_STATE: ImagineEditState = {
  prompt: "",
  activeStyleId: null,
  settings: { ...DEFAULT_GENERATION_SETTINGS },
};

export interface GeneratedImage {
  id: string;
  url: string;
  seed: number;
}

export type GenerationStatus = "pending" | "generating" | "complete" | "failed";

export interface GenerationJob {
  id: string;
  prompt: string;
  settings: GenerationSettings;
  images: GeneratedImage[];
  status: GenerationStatus;
  progress: number;
  error?: string;
  parentJobId?: string;
  parentImageId?: string;
  action?: "imagine" | "vary" | "upscale" | "reroll";
  styleId?: string | null;
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
