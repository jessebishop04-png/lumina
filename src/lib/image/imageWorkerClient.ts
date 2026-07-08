import type { AdjustmentKey, EditAdjustments } from "@/lib/types";
import { applyAdjustmentsToBuffer } from "./adjustmentsCore";

interface PendingJob {
  resolve: (data: ImageData) => void;
  reject: (error: Error) => void;
}

let worker: Worker | null = null;
let jobId = 0;
const pending = new Map<number, PendingJob>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./image.worker.ts", import.meta.url));
    worker.onmessage = (event: MessageEvent<{ id: number; buffer: ArrayBuffer; width: number; height: number }>) => {
      const job = pending.get(event.data.id);
      if (!job) return;
      pending.delete(event.data.id);
      job.resolve(new ImageData(new Uint8ClampedArray(event.data.buffer), event.data.width, event.data.height));
    };
    worker.onerror = (error) => {
      pending.forEach((job) => job.reject(new Error(error.message || "Image worker failed")));
      pending.clear();
    };
  }
  return worker;
}

export function processImageInWorker(
  imageData: ImageData,
  edits: EditAdjustments,
  enabledEdits: Record<AdjustmentKey, boolean>,
  skipDetail = false
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const id = jobId++;
    pending.forEach((job, pendingId) => {
      if (pendingId < id) {
        pending.delete(pendingId);
        job.reject(new Error("Superseded"));
      }
    });
    pending.set(id, { resolve, reject });

    const copy = new Uint8ClampedArray(imageData.data);
    getWorker().postMessage({
      id,
      buffer: copy.buffer as ArrayBuffer,
      width: imageData.width,
      height: imageData.height,
      edits,
      enabledEdits,
      skipDetail,
    });
  });
}

export function processImageOnMainThread(
  imageData: ImageData,
  edits: EditAdjustments,
  enabledEdits: Record<AdjustmentKey, boolean>,
  skipDetail = false
): ImageData {
  const output = applyAdjustmentsToBuffer(
    imageData.data,
    imageData.width,
    imageData.height,
    edits,
    enabledEdits,
    { skipDetail }
  );
  return new ImageData(new Uint8ClampedArray(output), imageData.width, imageData.height);
}

export function cancelPendingWorkerJobs(): void {
  pending.forEach((job) => job.reject(new Error("Cancelled")));
  pending.clear();
}
