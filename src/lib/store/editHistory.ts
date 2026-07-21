import type { CropRect, EditAdjustments, ProjectImage, AdjustmentKey } from "@/lib/types";

const MAX_EDIT_HISTORY = 50;

export interface ImageEditSnapshot {
  edits: EditAdjustments;
  enabledEdits: Record<AdjustmentKey, boolean>;
  rotation: number;
  crop: CropRect;
  maskDataUrl: string | null;
}

export interface ImageHistoryStacks {
  past: ImageEditSnapshot[];
  future: ImageEditSnapshot[];
}

export function snapshotFromImage(image: ProjectImage): ImageEditSnapshot {
  return {
    edits: { ...image.edits },
    enabledEdits: { ...image.enabledEdits },
    rotation: image.rotation,
    crop: { ...image.crop },
    maskDataUrl: image.maskDataUrl,
  };
}

function snapshotsEqual(a: ImageEditSnapshot, b: ImageEditSnapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function getHistoryStacks(
  historyByImage: Record<string, ImageHistoryStacks>,
  imageId: string
): ImageHistoryStacks {
  return historyByImage[imageId] ?? { past: [], future: [] };
}

/** Push current state onto past before applying a new edit. Clears redo stack. */
export function recordSnapshot(
  historyByImage: Record<string, ImageHistoryStacks>,
  imageId: string,
  snapshot: ImageEditSnapshot
): Record<string, ImageHistoryStacks> {
  const stacks = getHistoryStacks(historyByImage, imageId);
  const last = stacks.past[stacks.past.length - 1];
  if (last && snapshotsEqual(last, snapshot)) {
    return historyByImage;
  }
  const past = [...stacks.past, snapshot].slice(-MAX_EDIT_HISTORY);
  return {
    ...historyByImage,
    [imageId]: { past, future: [] },
  };
}

export function canUndoHistory(stacks: ImageHistoryStacks): boolean {
  return stacks.past.length > 0;
}

export function canRedoHistory(stacks: ImageHistoryStacks): boolean {
  return stacks.future.length > 0;
}

export function undoHistory(
  historyByImage: Record<string, ImageHistoryStacks>,
  imageId: string,
  current: ImageEditSnapshot
): { historyByImage: Record<string, ImageHistoryStacks>; snapshot: ImageEditSnapshot | null } {
  const stacks = getHistoryStacks(historyByImage, imageId);
  if (stacks.past.length === 0) {
    return { historyByImage, snapshot: null };
  }
  const past = [...stacks.past];
  const previous = past.pop()!;
  return {
    historyByImage: {
      ...historyByImage,
      [imageId]: {
        past,
        future: [current, ...stacks.future],
      },
    },
    snapshot: previous,
  };
}

export function redoHistory(
  historyByImage: Record<string, ImageHistoryStacks>,
  imageId: string,
  current: ImageEditSnapshot
): { historyByImage: Record<string, ImageHistoryStacks>; snapshot: ImageEditSnapshot | null } {
  const stacks = getHistoryStacks(historyByImage, imageId);
  if (stacks.future.length === 0) {
    return { historyByImage, snapshot: null };
  }
  const future = [...stacks.future];
  const next = future.shift()!;
  return {
    historyByImage: {
      ...historyByImage,
      [imageId]: {
        past: [...stacks.past, current],
        future,
      },
    },
    snapshot: next,
  };
}

export function applySnapshotToImage(image: ProjectImage, snapshot: ImageEditSnapshot): ProjectImage {
  return {
    ...image,
    edits: { ...snapshot.edits },
    enabledEdits: { ...snapshot.enabledEdits },
    rotation: snapshot.rotation,
    crop: { ...snapshot.crop },
    maskDataUrl: snapshot.maskDataUrl,
    updatedAt: new Date().toISOString(),
  };
}
