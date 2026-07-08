import { NextResponse } from "next/server";
import { fetchPollinationsImage } from "@/lib/ai/pollinationsClient";

export const maxDuration = 120;

interface StudioEditRequest {
  compositeDataUrl: string;
  maskDataUrl?: string | null;
  prompt: string;
  width: number;
  height: number;
  mode: "edit" | "retexture";
  count?: number;
}

function buildPrompt(prompt: string, mode: "edit" | "retexture"): string {
  const base = prompt.trim();
  if (mode === "retexture") {
    return `${base}, same composition and structure, restyled, cohesive, high quality`;
  }
  return `${base}, seamless blend, photorealistic, high detail`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as StudioEditRequest;
    const { prompt, width, height, mode, count = 4 } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const enhanced = buildPrompt(prompt, mode);
    const imageCount = mode === "retexture" ? 4 : count;
    const results: { url: string; seed: number }[] = [];

    for (let i = 0; i < imageCount; i++) {
      const seed = Math.floor(Math.random() * 999999);
      const url = await fetchPollinationsImage({
        prompt: enhanced,
        width: Math.min(1536, width),
        height: Math.min(1536, height),
        seed,
        model: "flux",
      });
      results.push({ url, seed });
    }

    return NextResponse.json({ images: results });
  } catch (err) {
    console.error("Studio edit error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Studio edit failed" },
      { status: 500 }
    );
  }
}
