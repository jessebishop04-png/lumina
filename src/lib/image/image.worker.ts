import type { AdjustmentKey, EditAdjustments } from "@/lib/types";
import { applyAdjustmentsToBuffer } from "./adjustmentsCore";

interface WorkerRequest {
  id: number;
  buffer: ArrayBuffer;
  width: number;
  height: number;
  edits: EditAdjustments;
  enabledEdits: Record<AdjustmentKey, boolean>;
  skipDetail: boolean;
}

interface WorkerResponse {
  id: number;
  buffer: ArrayBuffer;
  width: number;
  height: number;
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, buffer, width, height, edits, enabledEdits, skipDetail } = event.data;
  const output = applyAdjustmentsToBuffer(
    new Uint8ClampedArray(buffer),
    width,
    height,
    edits,
    enabledEdits,
    { skipDetail }
  );

  const outBuffer = output.buffer as ArrayBuffer;
  const response: WorkerResponse = { id, buffer: outBuffer, width, height };
  self.postMessage(response);
};

export {};
