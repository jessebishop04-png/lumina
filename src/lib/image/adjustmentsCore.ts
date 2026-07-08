import type { AdjustmentKey, EditAdjustments } from "@/lib/types";

export interface ApplyCoreOptions {
  skipDetail?: boolean;
}

function clamp(value: number, min = 0, max = 255): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function luminance(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function applyExposure(r: number, g: number, b: number, exposure: number) {
  const ev = (exposure / 100) * 3;
  const factor = Math.pow(2, ev);
  return [clamp(r * factor), clamp(g * factor), clamp(b * factor)] as const;
}

function applyContrast(r: number, g: number, b: number, contrast: number) {
  if (contrast === 0) return [r, g, b] as const;
  const factor = 1 + contrast / 100;
  const l = luminance(r, g, b);
  const blend = Math.pow(l, 0.85);
  const nr = r + (r - 128 * (0.5 + blend * 0.5)) * (factor - 1) * 0.65;
  const ng = g + (g - 128 * (0.5 + blend * 0.5)) * (factor - 1) * 0.65;
  const nb = b + (b - 128 * (0.5 + blend * 0.5)) * (factor - 1) * 0.65;
  return [clamp(nr), clamp(ng), clamp(nb)] as const;
}

function applyToneRegions(
  r: number,
  g: number,
  b: number,
  highlights: number,
  shadows: number,
  whites: number,
  blacks: number
) {
  const lum = luminance(r, g, b);
  let delta = 0;

  const highlightMask = smoothstep(0.55, 0.95, lum);
  delta += (highlights / 100) * highlightMask * 0.55;

  const shadowMask = smoothstep(0.45, 0.05, lum);
  delta += (shadows / 100) * shadowMask * 0.55;

  const whiteMask = smoothstep(0.82, 1, lum);
  delta += (whites / 100) * whiteMask * 0.35;

  const blackMask = smoothstep(0.18, 0, lum);
  delta += (blacks / 100) * blackMask * -0.45;

  const scale = 1 + delta;
  return [clamp(r * scale), clamp(g * scale), clamp(b * scale)] as const;
}

function applyWhiteBalance(r: number, g: number, b: number, temperature: number, tint: number) {
  const temp = temperature / 100;
  const tintAmt = tint / 100;
  const lum = luminance(r, g, b);
  const preserve = 1 - smoothstep(0.88, 0.98, lum);

  const nr = r + temp * 28 * preserve;
  const ng = g + tintAmt * 18 - temp * 4;
  const nb = b - temp * 28 * preserve + tintAmt * 8;

  return [clamp(nr), clamp(ng), clamp(nb)] as const;
}

function applySaturationVibrance(r: number, g: number, b: number, saturation: number, vibrance: number) {
  const [h, s, l] = rgbToHsl(r, g, b);
  const satFactor = 1 + saturation / 100;
  let newS = s * satFactor;

  if (vibrance !== 0) {
    const vibFactor = 1 + (vibrance / 100) * (1 - s);
    newS *= vibFactor;
    const skinHue = h > 15 && h < 45;
    if (skinHue && vibrance > 0) newS = s + (newS - s) * 0.55;
  }

  return hslToRgb(h, clamp01(newS), l);
}

function boxBlurChannel(
  source: Float32Array,
  output: Float32Array,
  width: number,
  height: number,
  radius: number
): void {
  const temp = new Float32Array(source.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let kx = -radius; kx <= radius; kx++) {
        const sx = Math.max(0, Math.min(width - 1, x + kx));
        sum += source[y * width + sx];
        count++;
      }
      temp[y * width + x] = sum / count;
    }
  }
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let sum = 0;
      let count = 0;
      for (let ky = -radius; ky <= radius; ky++) {
        const sy = Math.max(0, Math.min(height - 1, y + ky));
        sum += temp[sy * width + x];
        count++;
      }
      output[y * width + x] = sum / count;
    }
  }
}

function applyLocalContrast(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number,
  radius: number,
  midtoneWeight: boolean
): void {
  if (amount === 0 || width < 3 || height < 3) return;

  const lum = new Float32Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    lum[p] = luminance(data[i], data[i + 1], data[i + 2]);
  }

  const blurred = new Float32Array(lum.length);
  boxBlurChannel(lum, blurred, width, height, radius);

  const strength = amount / 100;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const l = lum[p];
    let delta = (l - blurred[p]) * strength;
    if (midtoneWeight) {
      delta *= 1 - Math.abs(2 * l - 1);
    }
    const scale = 1 + delta * 2.2;
    data[i] = clamp(data[i] * scale);
    data[i + 1] = clamp(data[i + 1] * scale);
    data[i + 2] = clamp(data[i + 2] * scale);
  }
}

function applyUnsharpMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number,
  radius: number
): void {
  if (amount === 0 || width < 3 || height < 3) return;

  const copy = new Uint8ClampedArray(data);
  const lum = new Float32Array(width * height);
  for (let i = 0, p = 0; i < copy.length; i += 4, p++) {
    lum[p] = luminance(copy[i], copy[i + 1], copy[i + 2]);
  }

  const blurred = new Float32Array(lum.length);
  boxBlurChannel(lum, blurred, width, height, radius);

  const strength = (amount / 100) * 0.85;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const detail = lum[p] - blurred[p];
    const scale = 1 + detail * strength * 4;
    data[i] = clamp(copy[i] * scale);
    data[i + 1] = clamp(copy[i + 1] * scale);
    data[i + 2] = clamp(copy[i + 2] * scale);
  }
}

function applyDehaze(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  dehaze: number
): void {
  if (dehaze === 0 || width < 3 || height < 3) return;

  const lum = new Float32Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    lum[p] = luminance(data[i], data[i + 1], data[i + 2]);
  }

  const blurred = new Float32Array(lum.length);
  boxBlurChannel(lum, blurred, width, height, 8);

  const strength = dehaze / 100;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const hazeAmount = Math.max(0, blurred[p] - lum[p]);
    const boost = 1 + strength * hazeAmount * 3.5;
    const contrast = 1 + strength * 0.25;
    data[i] = clamp((data[i] - 128) * contrast * boost + 128);
    data[i + 1] = clamp((data[i + 1] - 128) * contrast * boost + 128);
    data[i + 2] = clamp((data[i + 2] - 128) * contrast * boost + 128);
  }
}

export function applyAdjustmentsToBuffer(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  edits: EditAdjustments,
  enabledEdits: Record<AdjustmentKey, boolean>,
  options: ApplyCoreOptions = {}
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(source);
  const get = (key: AdjustmentKey) => (enabledEdits[key] ? edits[key] : 0);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    [r, g, b] = applyExposure(r, g, b, get("exposure"));
    [r, g, b] = applyContrast(r, g, b, get("contrast"));
    [r, g, b] = applyToneRegions(
      r,
      g,
      b,
      get("highlights"),
      get("shadows"),
      get("whites"),
      get("blacks")
    );
    [r, g, b] = applyWhiteBalance(r, g, b, get("temperature"), get("tint"));
    [r, g, b] = applySaturationVibrance(r, g, b, get("saturation"), get("vibrance"));

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  const dehaze = get("dehaze");
  if (dehaze !== 0) applyDehaze(data, width, height, dehaze);

  if (!options.skipDetail) {
    const texture = get("texture");
    if (texture !== 0) applyLocalContrast(data, width, height, texture, 2, false);

    const clarity = get("clarity");
    if (clarity !== 0) applyLocalContrast(data, width, height, clarity, 5, true);

    const sharpness = get("sharpness");
    if (sharpness !== 0) applyUnsharpMask(data, width, height, sharpness, 1);
  }

  return data;
}
