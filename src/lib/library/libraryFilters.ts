import type { ProjectSummary } from "@/lib/types";

export type LibraryMediaFilter = "all" | "photos" | "videos";
export type LibrarySort = "newest" | "oldest";

function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith("data:video") || /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

export function normalizeProjectSummary(summary: ProjectSummary): ProjectSummary {
  const url = summary.previewDataUrl ?? summary.thumbnailDataUrl;
  const inferredVideo = isVideoUrl(url);
  const mediaType = summary.mediaType ?? (inferredVideo ? "video" : "image");

  if (summary.hasVideo !== undefined || summary.hasPhoto !== undefined) {
    return {
      ...summary,
      mediaType,
      hasVideo: summary.hasVideo ?? false,
      hasPhoto: summary.hasPhoto ?? true,
    };
  }

  return {
    ...summary,
    mediaType,
    hasVideo: inferredVideo || mediaType === "video",
    hasPhoto: !inferredVideo && mediaType !== "video",
  };
}

export function filterLibraryProjects(
  projects: ProjectSummary[],
  opts: { query: string; mediaFilter: LibraryMediaFilter },
): ProjectSummary[] {
  let result = projects.map(normalizeProjectSummary);

  if (opts.mediaFilter === "photos") {
    result = result.filter((p) => p.hasPhoto !== false);
  } else if (opts.mediaFilter === "videos") {
    result = result.filter((p) => p.hasVideo);
  }

  const q = opts.query.trim().toLowerCase();
  if (q) {
    result = result.filter((p) => p.name.toLowerCase().includes(q));
  }

  return result;
}

export function sortLibraryProjects(projects: ProjectSummary[], sort: LibrarySort): ProjectSummary[] {
  return [...projects].sort((a, b) => {
    const ta = new Date(a.updatedAt).getTime();
    const tb = new Date(b.updatedAt).getTime();
    return sort === "newest" ? tb - ta : ta - tb;
  });
}

export function libraryFilterLabel(filter: LibraryMediaFilter): string {
  if (filter === "photos") return "Photos";
  if (filter === "videos") return "Videos";
  return "All";
}

export interface LibraryDateGroup {
  key: string;
  label: string;
  monthLabel: string | null;
  projects: ProjectSummary[];
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function formatLibraryDateLabel(date: Date, now = new Date()): string {
  const today = startOfDay(now);
  const day = startOfDay(date);
  const diffDays = Math.round((today.getTime() - day.getTime()) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function groupLibraryByDate(projects: ProjectSummary[], sort: LibrarySort): LibraryDateGroup[] {
  const sorted = sortLibraryProjects(projects, sort);
  const now = new Date();
  const bucket = new Map<string, ProjectSummary[]>();

  for (const project of sorted) {
    const key = dateKey(new Date(project.updatedAt));
    const list = bucket.get(key) ?? [];
    list.push(project);
    bucket.set(key, list);
  }

  const keys = [...bucket.keys()].sort((a, b) => (sort === "newest" ? b.localeCompare(a) : a.localeCompare(b)));

  let lastMonthKey = "";

  return keys.map((key) => {
    const [y, m, d] = key.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const monthKey = `${y}-${m}`;
    const monthLabel = monthKey !== lastMonthKey ? formatMonthLabel(date) : null;
    lastMonthKey = monthKey;

    return {
      key,
      label: formatLibraryDateLabel(date, now),
      monthLabel,
      projects: bucket.get(key) ?? [],
    };
  });
}
