import type { AdjustmentKey, EditAdjustments } from "@/lib/types";

export interface AdjustmentDefinition {
  key: AdjustmentKey;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  section: "light" | "color" | "detail";
}

export const ADJUSTMENT_DEFINITIONS: AdjustmentDefinition[] = [
  { key: "exposure", label: "Exposure", min: -100, max: 100, step: 1, defaultValue: 0, section: "light" },
  { key: "contrast", label: "Contrast", min: -100, max: 100, step: 1, defaultValue: 0, section: "light" },
  { key: "highlights", label: "Highlights", min: -100, max: 100, step: 1, defaultValue: 0, section: "light" },
  { key: "shadows", label: "Shadows", min: -100, max: 100, step: 1, defaultValue: 0, section: "light" },
  { key: "whites", label: "Whites", min: -100, max: 100, step: 1, defaultValue: 0, section: "light" },
  { key: "blacks", label: "Blacks", min: -100, max: 100, step: 1, defaultValue: 0, section: "light" },
  { key: "dehaze", label: "Dehaze", min: -100, max: 100, step: 1, defaultValue: 0, section: "light" },
  { key: "temperature", label: "Temperature", min: -100, max: 100, step: 1, defaultValue: 0, section: "color" },
  { key: "tint", label: "Tint", min: -100, max: 100, step: 1, defaultValue: 0, section: "color" },
  { key: "saturation", label: "Saturation", min: -100, max: 100, step: 1, defaultValue: 0, section: "color" },
  { key: "vibrance", label: "Vibrance", min: -100, max: 100, step: 1, defaultValue: 0, section: "color" },
  { key: "texture", label: "Texture", min: -100, max: 100, step: 1, defaultValue: 0, section: "detail" },
  { key: "clarity", label: "Clarity", min: -100, max: 100, step: 1, defaultValue: 0, section: "detail" },
  { key: "sharpness", label: "Sharpness", min: 0, max: 100, step: 1, defaultValue: 0, section: "detail" },
];

export const ADJUSTMENT_SECTIONS = [
  { id: "light" as const, label: "Light" },
  { id: "color" as const, label: "Color" },
  { id: "detail" as const, label: "Detail" },
];

export function getAdjustmentsBySection(section: "light" | "color" | "detail") {
  return ADJUSTMENT_DEFINITIONS.filter((def) => def.section === section);
}

export function hasActiveEdits(edits: EditAdjustments): boolean {
  return ADJUSTMENT_DEFINITIONS.some((def) => edits[def.key] !== def.defaultValue);
}

export function normalizeEdits(edits: Partial<EditAdjustments> | EditAdjustments): EditAdjustments {
  const result = {} as EditAdjustments;
  for (const def of ADJUSTMENT_DEFINITIONS) {
    result[def.key] = edits[def.key] ?? def.defaultValue;
  }
  return result;
}
