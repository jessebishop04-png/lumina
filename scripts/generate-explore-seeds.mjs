import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public", "explore");
const SIZE = 768;

const ENTRIES = [
  { slug: "photorealistic", prompt: "portrait in golden hour light, shallow depth of field, natural skin tones, 85mm lens", seed: 1041 },
  { slug: "cinematic", prompt: "lonely figure on a rain-soaked city street, neon reflections, anamorphic bokeh", seed: 1042 },
  { slug: "anime", prompt: "anime character in a cherry blossom garden, soft pastel sky, detailed eyes", seed: 1043 },
  { slug: "oil-painting", prompt: "still life of fruit and flowers, classical oil painting, rich brushwork", seed: 1044 },
  { slug: "watercolor", prompt: "misty mountain valley at sunrise, soft watercolor washes, paper texture", seed: 1045 },
  { slug: "3d-render", prompt: "cute robot explorer on an alien planet, octane render, vivid colors", seed: 1046 },
  { slug: "cyberpunk", prompt: "cyberpunk alley with holographic signs, rain and neon, moody atmosphere", seed: 1047 },
  { slug: "fantasy", prompt: "floating castle above cloud sea, magical aurora, epic fantasy landscape", seed: 1048 },
  { slug: "minimalist", prompt: "minimal interior with single chair by window, clean lines, soft daylight", seed: 1049 },
  { slug: "vintage", prompt: "1970s road trip portrait, warm faded film tones, open highway", seed: 1050 },
  { slug: "sketch", prompt: "expressive pencil portrait, crosshatching, graphite on textured paper", seed: 1051 },
  { slug: "pop-art", prompt: "pop art portrait, bold primary colors, halftone dots, comic style", seed: 1052 },
];

function loadApiKey() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return null;
  const match = readFileSync(envPath, "utf8").match(/^POLLINATIONS_API_KEY=(.+)$/m);
  return match?.[1]?.trim() || null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function previewUrl(prompt, seed, apiKey) {
  const encoded = encodeURIComponent(prompt);
  const base = `https://gen.pollinations.ai/image/${encoded}?width=${SIZE}&height=${SIZE}&seed=${seed}&model=flux&nologo=true`;
  return apiKey ? `${base}&key=${encodeURIComponent(apiKey)}` : base;
}

async function downloadEntry(entry, apiKey) {
  const url = previewUrl(entry.prompt, entry.seed, apiKey);
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(180000) });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 1000) throw new Error("Response too small");
        return buf;
      }
      if (res.status === 429) {
        await sleep(attempt * 8000);
        continue;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (attempt === 4) throw err;
      console.warn(`  Retry ${entry.slug} (${attempt}/4): ${err.message}`);
      await sleep(attempt * 5000);
    }
  }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const apiKey = loadApiKey();
  console.log(`Generating ${ENTRIES.length} explore images (${SIZE}px) → public/explore/`);

  for (const entry of ENTRIES) {
    process.stdout.write(`→ ${entry.slug}… `);
    try {
      const buf = await downloadEntry(entry, apiKey);
      writeFileSync(join(OUT_DIR, `${entry.slug}.jpg`), buf);
      console.log(`ok (${Math.round(buf.length / 1024)}kb)`);
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
    }
    await sleep(4000);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
