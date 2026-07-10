import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public", "style-previews");
const WIDTH = 400;
const HEIGHT = 520;

const SUBJECTS = [
  "portrait of a person, expressive face, studio lighting",
  "landscape scenery with depth and atmosphere",
  "still life with rich detail and composition",
];

const STYLES = [
  { id: "photorealistic", suffix: "photorealistic, ultra detailed, natural lighting, 8k", seed: 41 },
  { id: "cinematic", suffix: "cinematic lighting, film still, dramatic atmosphere, wide angle", seed: 42 },
  { id: "anime", suffix: "anime style, vibrant colors, detailed illustration", seed: 43 },
  { id: "oil-painting", suffix: "oil painting, textured brushstrokes, classical art", seed: 44 },
  { id: "watercolor", suffix: "watercolor painting, soft edges, flowing pigments", seed: 45 },
  { id: "3d-render", suffix: "3d render, octane render, ray tracing, highly detailed", seed: 46 },
  { id: "cyberpunk", suffix: "cyberpunk, neon lights, futuristic city, moody", seed: 47 },
  { id: "fantasy", suffix: "fantasy art, epic, magical atmosphere, detailed", seed: 48 },
  { id: "minimalist", suffix: "minimalist, clean composition, simple shapes, modern", seed: 49 },
  { id: "vintage", suffix: "vintage photograph, faded tones, film grain, retro", seed: 50 },
  { id: "sketch", suffix: "pencil sketch, hand drawn, artistic linework", seed: 51 },
  { id: "pop-art", suffix: "pop art, bold colors, halftone dots, graphic style", seed: 52 },
  { id: "fisheye", suffix: "extreme fisheye lens, distorted wide angle, lo-fi digicam, lens flare, candid snapshot", seed: 53 },
  { id: "line-doodle", suffix: "hand drawn line art, doodle style, sketchy ink lines, whimsical illustration, notebook drawing", seed: 54 },
  { id: "glittercore", suffix: "glittercore aesthetic, sparkle filter, dreamy pink tones, star lens flare, ethereal glow", seed: 55 },
  { id: "moody-film", suffix: "moody film photography, soft focus, natural light, analog film grain, contemplative atmosphere", seed: 56 },
  { id: "baroque", suffix: "baroque oil painting, renaissance portrait, chiaroscuro lighting, classical composition, old masters", seed: 57 },
  { id: "film-noir", suffix: "film noir, high contrast black and white, dramatic shadows, 1940s detective cinema", seed: 58 },
  { id: "polaroid", suffix: "polaroid instant photo, faded colors, white border frame, nostalgic snapshot, light leak", seed: 59 },
  { id: "claymation", suffix: "claymation stop motion style, sculpted clay figures, tactile textures, whimsical 3d", seed: 60 },
  { id: "pixel-art", suffix: "pixel art, 16-bit retro game aesthetic, limited color palette, crisp pixels", seed: 61 },
  { id: "surreal", suffix: "surrealist art, dreamlike scene, impossible geometry, salvador dali inspired, ethereal", seed: 62 },
  { id: "art-nouveau", suffix: "art nouveau style, organic flowing lines, floral motifs, alphonse mucha inspired, decorative", seed: 63 },
  { id: "infrared", suffix: "infrared photography, false color, white foliage, deep blue sky, otherworldly landscape", seed: 64 },
  { id: "isometric", suffix: "isometric illustration, clean vector style, miniature diorama, soft shadows, game art", seed: 65 },
  { id: "brutalist", suffix: "brutalist architecture photography, raw concrete, geometric forms, overcast sky, monumental", seed: 66 },
  { id: "studio-ghibli", suffix: "studio ghibli style, soft watercolor backgrounds, warm pastoral scenery, hand painted animation", seed: 67 },
  { id: "dark-academia", suffix: "dark academia aesthetic, moody library, warm candlelight, vintage scholarly atmosphere", seed: 68 },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function previewUrl(prompt, seed) {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${WIDTH}&height=${HEIGHT}&seed=${seed}&model=turbo&nologo=true`;
}

async function downloadPreview(url) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 500) throw new Error("Response too small");
        return buf;
      }
      if (res.status === 429) {
        console.warn(`  Rate limited, waiting ${attempt * 6}s…`);
        await sleep(attempt * 6000);
        continue;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (attempt === 4) throw err;
      console.warn(`  Retry (${attempt}/4): ${err.message}`);
      await sleep(attempt * 4000);
    }
  }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const total = STYLES.length * SUBJECTS.length;
  console.log(`Generating ${total} style preview images into public/style-previews/…`);

  for (const style of STYLES) {
    for (let i = 0; i < SUBJECTS.length; i++) {
      const prompt = `${SUBJECTS[i]}, ${style.suffix}`;
      const seed = style.seed + i * 17;
      const filename = `${style.id}-${i}.jpg`;
      process.stdout.write(`→ ${filename}… `);
      try {
        const buf = await downloadPreview(previewUrl(prompt, seed));
        writeFileSync(join(OUT_DIR, filename), buf);
        console.log(`ok (${Math.round(buf.length / 1024)}kb)`);
      } catch (err) {
        console.log(`FAILED: ${err.message}`);
      }
      await sleep(3000);
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
