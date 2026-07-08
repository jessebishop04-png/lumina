import { NextResponse } from "next/server";
import { buildVideoPrompt } from "@/lib/ai/promptBuilder";
import { fetchPollinationsVideo, getVideoGenerationError, prepareReferenceImage, usesReferenceImg2Img } from "@/lib/ai/pollinationsClient";
import type { GenerationSettings, VideoDuration } from "@/lib/types/generation";

export const maxDuration = 300;

interface VideoGenerateRequest {
  prompt: string;
  settings: GenerationSettings;
  seed?: number;
  styleId?: string | null;
  referenceImageDataUrl?: string;
}

function videoAspectRatio(settings: GenerationSettings): "16:9" | "9:16" {
  return settings.aspectRatio === "16:9" ? "16:9" : "9:16";
}

function normalizeDuration(duration: number): VideoDuration {
  if (duration >= 8) return 8;
  if (duration >= 6) return 6;
  return 4;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VideoGenerateRequest;
    const { prompt, settings, referenceImageDataUrl, styleId } = body;

    const videoError = getVideoGenerationError();
    if (videoError) {
      return NextResponse.json({ error: videoError }, { status: 503 });
    }

    if (!prompt?.trim() && !referenceImageDataUrl) {
      return NextResponse.json({ error: "Prompt or reference image is required" }, { status: 400 });
    }

    const seed = body.seed ?? Math.floor(Math.random() * 999999);
    let referenceImageInput: string | undefined;

    if (referenceImageDataUrl && usesReferenceImg2Img(referenceImageDataUrl)) {
      const prepared = await prepareReferenceImage(referenceImageDataUrl);
      referenceImageInput = prepared.imageInput;
    }

    const enhancedPrompt = buildVideoPrompt(
      prompt.trim() || "cinematic motion, smooth camera movement",
      styleId ?? null
    );

    const url = await fetchPollinationsVideo({
      prompt: enhancedPrompt,
      aspectRatio: videoAspectRatio(settings),
      duration: normalizeDuration(settings.videoDuration ?? 4),
      seed,
      audio: settings.videoAudio ?? false,
      referenceImage: referenceImageDataUrl,
      referenceImageInput,
    });

    return NextResponse.json({
      videos: [{ url, seed }],
      provider: "pollinations",
    });
  } catch (err) {
    console.error("Video generate error:", err);
    const message = err instanceof Error ? err.message : "Video generation failed";
    const friendly =
      message.toLowerCase().includes("timeout") ||
      message.toLowerCase().includes("aborted") ||
      message.toLowerCase().includes("fetch failed")
        ? "Video generation timed out — try a shorter clip or try again."
        : message;
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}
