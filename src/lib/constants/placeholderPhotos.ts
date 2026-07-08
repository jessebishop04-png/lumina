export interface PlaceholderPhoto {
  id: string;
  url: string;
  width: number;
  height: number;
  label: string;
}

export interface PhotoGroup {
  id: string;
  label: string;
  photos: PlaceholderPhoto[];
}

// Forest / nature placeholders — similar tone to Lightroom demo library
const FOREST_SEEDS = [
  "lr-forest-01", "lr-forest-02", "lr-forest-03", "lr-forest-04", "lr-forest-05",
  "lr-forest-06", "lr-forest-07", "lr-forest-08", "lr-forest-09", "lr-forest-10",
  "lr-forest-11", "lr-forest-12", "lr-forest-13", "lr-forest-14", "lr-forest-15",
  "lr-forest-16", "lr-forest-17", "lr-forest-18", "lr-forest-19", "lr-forest-20",
  "lr-forest-21", "lr-forest-22", "lr-forest-23", "lr-forest-24", "lr-forest-25",
  "lr-forest-26", "lr-forest-27", "lr-forest-28", "lr-forest-29", "lr-forest-30",
  "lr-forest-31", "lr-forest-32", "lr-forest-33", "lr-forest-34", "lr-forest-35",
  "lr-forest-36", "lr-forest-37", "lr-forest-38", "lr-forest-39", "lr-forest-40",
];

function makePhoto(seed: string, index: number): PlaceholderPhoto {
  const aspect = index % 3 === 0 ? { w: 240, h: 180 } : index % 3 === 1 ? { w: 240, h: 300 } : { w: 240, h: 240 };
  return {
    id: seed,
    url: `https://picsum.photos/seed/${seed}/${aspect.w}/${aspect.h}`,
    width: aspect.w,
    height: aspect.h,
    label: `Photo ${index + 1}`,
  };
}

function makeGroup(label: string, id: string, count: number, offset: number): PhotoGroup {
  return {
    id,
    label,
    photos: FOREST_SEEDS.slice(offset, offset + count).map((seed, i) => makePhoto(seed, offset + i)),
  };
}

export const PLACEHOLDER_GROUPS: PhotoGroup[] = [
  makeGroup("January 2026", "jan-2026", 16, 0),
  makeGroup("December 2025", "dec-2025", 8, 16),
];

export const PLACEHOLDER_PHOTO_COUNT = PLACEHOLDER_GROUPS.reduce((n, g) => n + g.photos.length, 0);
