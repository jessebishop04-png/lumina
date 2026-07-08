import { createHash } from "crypto";

const LEGACY_BASE = "https://image.pollinations.ai/prompt";
const GEN_BASE = "https://gen.pollinations.ai";
const MEDIA_BASE = "https://media.pollinations.ai";
const POLLINATIONS_KEY = process.env.POLLINATIONS_API_KEY?.trim();

const UPLOAD_TIMEOUT_MS = 120_000;
const GENERATION_TIMEOUT_MS = 240_000;
const VIDEO_TIMEOUT_MS = 300_000;

/** Reuse uploaded reference URLs within the same server process. */
const uploadedReferenceCache = new Map<string, string>();

function hashDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
  if (!match) return dataUrl;
  return createHash("sha256").update(match[1]).digest("hex").slice(0, 32);
}

export function getPollinationsAuthError(): string | null {
  return null;
}

export function getReferenceImageError(): string | null {
  if (POLLINATIONS_KEY) return null;
  return "Reference images require POLLINATIONS_API_KEY in .env.local (get a free key at enter.pollinations.ai).";
}

export function isReferenceImg2ImgEnabled(): boolean {
  return !!POLLINATIONS_KEY;
}

async function readImageBytes(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = (await res.json()) as {
      data?: { b64_json?: string; url?: string }[];
      error?: { message?: string; code?: string };
    };
    const item = data.data?.[0];
    if (item?.b64_json) return `data:image/jpeg;base64,${item.b64_json}`;
    if (item?.url) {
      const imgRes = await fetch(item.url, { signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS) });
      if (!imgRes.ok) throw new Error(`Failed to fetch image URL (${imgRes.status})`);
      return readImageBytes(imgRes);
    }
    throw new Error(data.error?.message ?? "No image returned from provider");
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const mime = contentType.startsWith("image/") ? contentType : "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

async function parseError(res: Response): Promise<string> {
  let text = "";
  try {
    text = await res.text();
  } catch {
    return `Generation failed (${res.status})`;
  }

  try {
    const data = JSON.parse(text) as { error?: { message?: string; code?: string } };
    if (data.error?.message) {
      const code = data.error.code ? ` (${data.error.code})` : "";
      return `${data.error.message}${code}`;
    }
  } catch {
    // not JSON
  }

  return text.slice(0, 200) || `Generation failed (${res.status})`;
}

function isRetryableNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  const cause = (err as Error & { cause?: Error }).cause;
  const causeMsg = cause?.message?.toLowerCase() ?? "";
  return (
    msg.includes("fetch failed") ||
    msg.includes("timeout") ||
    msg.includes("aborted") ||
    msg.includes("econnreset") ||
    causeMsg.includes("econnreset") ||
    causeMsg.includes("etimedout")
  );
}

async function withNetworkRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isRetryableNetworkError(err) || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw lastError;
}

async function uploadReferenceImage(dataUrl: string): Promise<string> {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid reference image format");

  const [, , b64] = match;
  const buffer = Buffer.from(b64, "base64");
  const form = new FormData();
  // Always upload as JPEG — reference images are resized client-side before upload.
  form.append("file", new Blob([buffer], { type: "image/jpeg" }), "reference.jpg");

  const res = await withNetworkRetry(() =>
    fetch(`${MEDIA_BASE}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${POLLINATIONS_KEY}` },
      body: form,
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    })
  );

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  const data = (await res.json()) as { url?: string; hash?: string };
  if (data.url) return data.url;
  if (data.hash) return `${MEDIA_BASE}/${data.hash}`;
  throw new Error("Upload succeeded but no URL returned");
}

async function resolveReferenceImage(referenceImage: string): Promise<string> {
  if (!referenceImage.startsWith("data:")) return referenceImage;

  const cacheKey = hashDataUrl(referenceImage);
  const cached = uploadedReferenceCache.get(cacheKey);
  if (cached) return cached;

  const url = await uploadReferenceImage(referenceImage);
  uploadedReferenceCache.set(cacheKey, url);
  return url;
}

/** Resolve a reference image for img2img and return the media URL for client caching. */
export async function prepareReferenceImage(
  referenceImage: string
): Promise<{ imageInput: string; mediaUrl: string }> {
  const imageInput = await resolveReferenceImage(referenceImage);
  return { imageInput, mediaUrl: imageInput };
}

async function fetchLegacy(
  prompt: string,
  width: number,
  height: number,
  seed: number,
  model: string
): Promise<string> {
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    seed: String(seed),
    model: model === "turbo" ? "turbo" : "flux",
    nologo: "true",
    enhance: "true",
  });

  const url = `${LEGACY_BASE}/${encodeURIComponent(prompt)}?${params}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS) });

  if (!res.ok) {
    throw new Error(`Generation failed (${res.status})`);
  }

  return readImageBytes(res);
}

async function fetchImg2ImgPost(
  prompt: string,
  width: number,
  height: number,
  seed: number,
  imageInput: string
): Promise<Response> {
  return fetch(`${GEN_BASE}/v1/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${POLLINATIONS_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      model: "kontext",
      image: imageInput,
      size: `${width}x${height}`,
      seed,
      response_format: "b64_json",
    }),
    signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
  });
}

async function fetchImg2ImgGet(
  prompt: string,
  width: number,
  height: number,
  seed: number,
  imageInput: string
): Promise<Response> {
  const params = new URLSearchParams({
    model: "kontext",
    width: String(width),
    height: String(height),
    seed: String(seed),
    image: imageInput,
    key: POLLINATIONS_KEY!,
  });

  const url = `${GEN_BASE}/image/${encodeURIComponent(prompt)}?${params}`;
  return fetch(url, {
    headers: { Authorization: `Bearer ${POLLINATIONS_KEY}` },
    signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
  });
}

async function fetchImg2Img(
  prompt: string,
  width: number,
  height: number,
  seed: number,
  referenceImage: string,
  imageInputOverride?: string
): Promise<string> {
  if (!POLLINATIONS_KEY) {
    throw new Error(getReferenceImageError()!);
  }

  const imageInput = imageInputOverride ?? (await resolveReferenceImage(referenceImage));

  const runOnce = async () => {
    // POST keeps the reference URL in the JSON body (GET can fail with long URLs).
    let res = await fetchImg2ImgPost(prompt, width, height, seed, imageInput);
    if (!res.ok && res.status !== 402) {
      res = await fetchImg2ImgGet(prompt, width, height, seed, imageInput);
    }
    return res;
  };

  let res: Response;
  try {
    res = await withNetworkRetry(runOnce, 2);
  } catch (err) {
    if (!isRetryableNetworkError(err)) throw err;
    res = await runOnce();
  }

  if (res.status === 402) {
    throw new Error("Insufficient Pollen for reference img2img. Top up at enter.pollinations.ai.");
  }

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return readImageBytes(res);
}

export async function fetchPollinationsImage(options: {
  prompt: string;
  width: number;
  height: number;
  seed: number;
  model?: string;
  referenceImage?: string;
  referenceImageInput?: string;
}): Promise<string> {
  const { prompt, width, height, seed, model = "flux", referenceImage, referenceImageInput } = options;

  if (referenceImage) {
    return fetchImg2Img(prompt, width, height, seed, referenceImage, referenceImageInput);
  }

  try {
    return await fetchLegacy(prompt, width, height, seed, model);
  } catch (legacyErr) {
    if (POLLINATIONS_KEY) {
      const params = new URLSearchParams({
        model: model === "turbo" ? "zimage" : "flux",
        width: String(width),
        height: String(height),
        seed: String(seed),
        key: POLLINATIONS_KEY,
      });
      const url = `${GEN_BASE}/image/${encodeURIComponent(prompt)}?${params}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${POLLINATIONS_KEY}` },
        signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
      });
      if (res.ok) return readImageBytes(res);
    }
    throw legacyErr;
  }
}

export function usesReferenceImg2Img(referenceImage?: string): boolean {
  return !!referenceImage && !!POLLINATIONS_KEY;
}

export function getVideoGenerationError(): string | null {
  if (POLLINATIONS_KEY) return null;
  return "Video generation requires POLLINATIONS_API_KEY in .env.local (get a key at enter.pollinations.ai).";
}

async function readVideoBytes(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    throw new Error(await parseError(res));
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 1000) {
    throw new Error("Video response too small — generation may have failed.");
  }

  const mime = contentType.startsWith("video/") ? contentType.split(";")[0]!.trim() : "video/mp4";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export async function fetchPollinationsVideo(options: {
  prompt: string;
  aspectRatio: "16:9" | "9:16";
  duration: number;
  seed: number;
  audio?: boolean;
  referenceImage?: string;
  referenceImageInput?: string;
}): Promise<string> {
  if (!POLLINATIONS_KEY) {
    throw new Error(getVideoGenerationError()!);
  }

  const { prompt, aspectRatio, duration, seed, audio = false, referenceImage, referenceImageInput } = options;

  let imageParam = referenceImageInput;
  if (!imageParam && referenceImage) {
    imageParam = (await prepareReferenceImage(referenceImage)).imageInput;
  }

  const params = new URLSearchParams();
  params.set("model", audio ? "seedance-2.0" : "seedance-pro");
  params.set("duration", String(duration));
  params.set("aspectRatio", aspectRatio);
  params.set("seed", String(seed));

  if (audio) {
    params.set("audio", "true");
  }

  if (imageParam) {
    params.set("image", imageParam);
  }

  const url = `${GEN_BASE}/video/${encodeURIComponent(prompt)}?${params.toString()}`;

  const res = await withNetworkRetry(
    () =>
      fetch(url, {
        headers: { Authorization: `Bearer ${POLLINATIONS_KEY}` },
        signal: AbortSignal.timeout(VIDEO_TIMEOUT_MS),
      }),
    2
  );

  if (res.status === 402) {
    throw new Error("Insufficient Pollen for video. Top up at enter.pollinations.ai.");
  }

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return readVideoBytes(res);
}
