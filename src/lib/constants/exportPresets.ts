import type { ExportPresetId } from "@/lib/types";

export interface ExportPreset {
  id: ExportPresetId;
  label: string;
  description: string;
  width: number;
  height: number;
  format: "jpeg" | "png" | "webp";
  quality: number;
}

export const EXPORT_PRESETS: ExportPreset[] = [
  {
    id: "instagram-post",
    label: "Instagram Post",
    description: "1080 × 1080 square",
    width: 1080,
    height: 1080,
    format: "jpeg",
    quality: 92,
  },
  {
    id: "instagram-story",
    label: "Instagram Story",
    description: "1080 × 1920 vertical",
    width: 1080,
    height: 1920,
    format: "jpeg",
    quality: 92,
  },
  {
    id: "website",
    label: "Website",
    description: "1600px wide, optimized",
    width: 1600,
    height: 1200,
    format: "webp",
    quality: 85,
  },
  {
    id: "portfolio",
    label: "Portfolio",
    description: "2400px wide, high quality",
    width: 2400,
    height: 1800,
    format: "jpeg",
    quality: 95,
  },
  {
    id: "high-quality",
    label: "High Quality",
    description: "Original size, max quality",
    width: 0,
    height: 0,
    format: "png",
    quality: 100,
  },
  {
    id: "custom",
    label: "Custom",
    description: "Set your own dimensions",
    width: 0,
    height: 0,
    format: "jpeg",
    quality: 90,
  },
];

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPTED_IMAGE_EXTENSIONS = ".jpg,.jpeg,.png,.webp";
