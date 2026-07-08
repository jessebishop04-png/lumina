import { NextResponse } from "next/server";
import { isReferenceImg2ImgEnabled } from "@/lib/ai/pollinationsClient";

export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const referenceImg2img = isReferenceImg2ImgEnabled();

  return NextResponse.json({
    ready: true,
    referenceImg2img,
    message: referenceImg2img
      ? null
      : "Add POLLINATIONS_API_KEY to .env.local to use dropped images as img2img input.",
    provider: hasOpenAI ? "openai" : "pollinations",
    mode: referenceImg2img ? "text-free-reference-img2img" : "text-free-only",
  });
}
