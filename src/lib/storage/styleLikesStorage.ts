const LIKES_KEY = "lumina-style-likes";

export function getLikedStyleIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function setLikedStyleIds(ids: Set<string>): void {
  localStorage.setItem(LIKES_KEY, JSON.stringify([...ids]));
}
