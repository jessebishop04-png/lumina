import { NextResponse } from "next/server";
import { buildEnhancedPrompt } from "@/lib/ai/promptBuilder";
import { fetchPollinationsImage, getReferenceImageError, prepareReferenceImage, usesReferenceImg2Img } from "@/lib/ai/pollinationsClient";
import type { GenerationSettings } from "@/lib/types/generation";
import { getDimensions } from "@/lib/types/generation";

export const maxDuration = 300;

interface GenerateRequest {
  prompt: string;
  settings: GenerationSettings;
  count?: number;
  seeds?: number[];
  upscale?: boolean;
  styleId?: string | null;
  referenceImageDataUrl?: string;
}

async function fetchOpenAIImage(prompt: string, size: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OpenAI not configured");

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size,
      response_format: "b64_json",
    }),
    signal: AbortSignal.timeout(180_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const data = (await res.json()) as { data: { b64_json: string }[] };
  return `data:image/png;base64,${data.data[0].b64_json}`;
}

function openAISize(width: number, height: number): "1024x1024" | "1792x1024" | "1024x1792" {
  const ratio = width / height;
  if (ratio > 1.2) return "1792x1024";
  if (ratio < 0.8) return "1024x1792";
  return "1024x1024";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateRequest;
    const {
      prompt,
      settings,
      count = 4,
      seeds,
      upscale = false,
      styleId,
      referenceImageDataUrl,
    } = body;

    const hasReference = !!referenceImageDataUrl;
    if (!prompt?.trim() && !hasReference) {
      return NextResponse.json({ error: "Prompt or reference image is required" }, { status: 400 });
    }

    if (hasReference) {
      const refError = getReferenceImageError();
      if (refError) {
        return NextResponse.json({ error: refError }, { status: 503 });
      }
    }

    const img2img = usesReferenceImg2Img(referenceImageDataUrl);

    const { width, height } = getDimensions(settings, upscale);
    const imageCount = upscale ? 1 : count;
    const useOpenAI = !!process.env.OPENAI_API_KEY && !settings.draft && !hasReference;

    let referenceMediaUrl: string | undefined;
    let referenceImageInput: string | undefined;
    if (hasReference && img2img && referenceImageDataUrl) {
      const prepared = await prepareReferenceImage(referenceImageDataUrl);
      referenceMediaUrl = prepared.mediaUrl;
      referenceImageInput = prepared.imageInput;
    }

    const results: { url: string; seed: number }[] = [];

    for (let i = 0; i < imageCount; i++) {
      const seed = seeds?.[i] ?? Math.floor(Math.random() * 999999);
      const enhanced = buildEnhancedPrompt(prompt, settings, i, styleId, hasReference, img2img);

      let url: string;
      if (useOpenAI && imageCount === 1) {
        url = await fetchOpenAIImage(enhanced, openAISize(width, height));
      } else {
        const model = settings.draft ? "turbo" : settings.model;
        url = await fetchPollinationsImage({
          prompt: enhanced,
          width,
          height,
          seed,
          model,
          referenceImage: referenceImageDataUrl,
          referenceImageInput,
        });
      }

      results.push({ url, seed });
    }

    return NextResponse.json({
      images: results,
      provider: useOpenAI ? "openai" : "pollinations",
      referenceMediaUrl,
    });
  } catch (err) {
    console.error("Generate error:", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    const friendly =
      message.toLowerCase().includes("timeout") ||
      message.toLowerCase().includes("aborted") ||
      message.toLowerCase().includes("fetch failed") ||
      message.toLowerCase().includes("econnreset")
        ? "Generation timed out or lost connection — try again. Draft mode in settings is faster."
        : message;
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}
