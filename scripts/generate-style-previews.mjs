import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public", "style-previews");
const SIZE = 128;

const STYLES = [
  { id: "photorealistic", prompt: "photorealistic portrait photograph, natural window light, sharp focus, 85mm lens", seed: 41 },
  { id: "cinematic", prompt: "cinematic film still, dramatic lighting, anamorphic lens flare, moody atmosphere", seed: 42 },
  { id: "anime", prompt: "anime illustration portrait, vibrant colors, cel shading, detailed eyes", seed: 43 },
  { id: "oil-painting", prompt: "classical oil painting still life, rich brushstrokes, renaissance palette, canvas texture", seed: 44 },
  { id: "watercolor", prompt: "watercolor painting landscape, soft bleeding edges, pastel pigments, paper texture", seed: 45 },
  { id: "3d-render", prompt: "3d render cute robot character, octane render, ray tracing, glossy materials", seed: 46 },
  { id: "cyberpunk", prompt: "cyberpunk city street at night, neon signs, rain reflections, futuristic", seed: 47 },
  { id: "fantasy", prompt: "fantasy landscape, floating castle, magical glowing forest, epic scale", seed: 48 },
  { id: "minimalist", prompt: "minimalist interior, clean white walls, simple geometric shapes, soft daylight", seed: 49 },
  { id: "vintage", prompt: "vintage 1970s photograph, faded warm tones, film grain, retro portrait", seed: 50 },
  { id: "sketch", prompt: "pencil sketch portrait, hand drawn crosshatching, graphite on paper", seed: 51 },
  { id: "pop-art", prompt: "pop art portrait, bold primary colors, halftone dots, comic book style", seed: 52 },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function previewUrl(prompt, seed) {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${SIZE}&height=${SIZE}&seed=${seed}&model=turbo&nologo=true`;
}

async function downloadStyle(style) {
  const url = previewUrl(style.prompt, style.seed);
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 500) throw new Error("Response too small");
        return buf;
      }
      if (res.status === 429) {
        console.warn(`  Rate limited on ${style.id}, waiting ${attempt * 6}s…`);
        await sleep(attempt * 6000);
        continue;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (attempt === 4) throw err;
      console.warn(`  Retry ${style.id} (${attempt}/4): ${err.message}`);
      await sleep(attempt * 4000);
    }
  }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Generating ${STYLES.length} style previews into public/style-previews/…`);

  for (const style of STYLES) {
    process.stdout.write(`→ ${style.id}… `);
    try {
      const buf = await downloadStyle(style);
      const outPath = join(OUT_DIR, `${style.id}.jpg`);
      writeFileSync(outPath, buf);
      console.log(`ok (${Math.round(buf.length / 1024)}kb)`);
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
    }
    await sleep(3000);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
