export interface EditAdjustments {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  saturation: number;
  vibrance: number;
  temperature: number;
  tint: number;
  sharpness: number;
  clarity: number;
  dehaze: number;
  texture: number;
}

export type AdjustmentKey = keyof EditAdjustments;

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const DEFAULT_CROP: CropRect = { x: 0, y: 0, width: 1, height: 1 };

export interface ProjectImage {
  id: string;
  name: string;
  mediaType?: "image" | "video";
  originalDataUrl: string;
  thumbnailDataUrl: string;
  previewDataUrl?: string;
  edits: EditAdjustments;
  enabledEdits: Record<AdjustmentKey, boolean>;
  rotation: number;
  crop: CropRect;
  maskDataUrl: string | null;
  studio?: import("@/lib/types/studio").StudioCanvasState;
  studioResults?: import("@/lib/types/studio").StudioResultImage[];
  imagine?: import("@/lib/types/generation").ImagineEditState;
  imagineResults?: import("@/lib/types/studio").StudioResultImage[];
  /** Cached Pollinations media URL — skips re-upload on repeat img2img generations. */
  referenceMediaUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  images: ProjectImage[];
  activeImageId: string | null;
}

/** Lightweight record for library grid — avoids loading full image data on the home page. */
export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: string;
  thumbnailDataUrl: string | null;
  previewDataUrl?: string | null;
  imageCount: number;
  /** Cover media type for the library tile */
  mediaType?: "image" | "video";
  /** Project contains at least one video */
  hasVideo?: boolean;
  /** Project contains at least one photo */
  hasPhoto?: boolean;
}

export interface ExportSettings {
  filename: string;
  format: "jpeg" | "png" | "webp";
  quality: number;
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  preset: ExportPresetId;
}

export type ExportPresetId =
  | "instagram-post"
  | "instagram-story"
  | "website"
  | "portfolio"
  | "high-quality"
  | "custom";

export interface SuggestionPreset {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: PresetCategory;
  adjustments: Partial<EditAdjustments>;
}

export type PresetCategory =
  | "Essentials"
  | "Portrait"
  | "Landscape"
  | "Black & White"
  | "Vintage"
  | "Social";

export interface CanvasViewState {
  zoom: number;
  panX: number;
  panY: number;
  fitToScreen: boolean;
}

export const DEFAULT_ADJUSTMENTS: EditAdjustments = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
  sharpness: 0,
  clarity: 0,
  dehaze: 0,
  texture: 0,
};

export function createEnabledEdits(
  overrides?: Partial<Record<AdjustmentKey, boolean>>
): Record<AdjustmentKey, boolean> {
  const keys = Object.keys(DEFAULT_ADJUSTMENTS) as AdjustmentKey[];
  return keys.reduce(
    (acc, key) => {
      acc[key] = overrides?.[key] ?? true;
      return acc;
    },
    {} as Record<AdjustmentKey, boolean>
  );
}
