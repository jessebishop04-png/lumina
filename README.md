# Lumina

A fast, modern web-based image editor built with Next.js. Edit photos instantly in your browser — no install, no forced account.

## Features

- **Frictionless import** — Drag-and-drop or file picker for JPG, PNG, WebP
- **Non-destructive editing** — Original image never modified; full edit stack preserved
- **12 adjustment controls** — Exposure, contrast, highlights, shadows, whites, blacks, saturation, vibrance, temperature, tint, sharpness, clarity
- **AI Suggestions panel** — One-click presets (auto enhance, warm up, social ready, and more)
- **Before/after toggle** — Hold to compare original vs edited
- **Export workflow** — JPG, PNG, WebP with presets for Instagram, website, portfolio
- **Local project storage** — Projects saved in IndexedDB, no account required
- **Canvas controls** — Zoom, pan, fit to screen

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment variables (optional)

Copy `.env.example` to `.env.local` and add any keys you need:

| Variable | Purpose |
|----------|---------|
| `POLLINATIONS_API_KEY` | Reference image (img2img) generation — get a free key at [enter.pollinations.ai](https://enter.pollinations.ai) |
| `OPENAI_API_KEY` | Optional DALL·E 3 upscale / high-quality single images |

Without keys, text-to-image still works via Pollinations (Flux).

## Deploy to Vercel

1. Push this repo to GitHub (or connect your existing remote).
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Add environment variables in **Project → Settings → Environment Variables**:
   - `POLLINATIONS_API_KEY` (recommended for reference-image generation)
   - `OPENAI_API_KEY` (optional)
4. Deploy. Vercel auto-detects Next.js — no custom build settings needed.

**Note:** AI generation routes use long timeouts (up to 5 minutes for `/api/generate`). Vercel **Pro** is recommended for reliable multi-image generation; the Hobby plan caps serverless functions at 60 seconds.

Alternatively, install the [Vercel CLI](https://vercel.com/docs/cli) and run `npx vercel` from the project root.

## Tech Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- Zustand (editor state)
- IndexedDB (project persistence)
- Canvas API (image processing)
