import type { Session } from "next-auth";
import type { AuthUser } from "@/lib/types/auth";
import { avatarUrlForUser } from "@/lib/auth/guestName";

const GOOGLE_JOINED_PREFIX = "lumina-google-joined-";

function getOrSetCreatedAt(googleId: string): string {
  if (typeof window === "undefined") return new Date().toISOString();
  const key = `${GOOGLE_JOINED_PREFIX}${googleId}`;
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const now = new Date().toISOString();
  localStorage.setItem(key, now);
  return now;
}

export function authUserFromSession(session: Session): AuthUser {
  const googleId = session.user.id;
  const email = session.user.email ?? null;
  const displayName = session.user.name?.trim() || email?.split("@")[0] || "Google user";
  const username = email?.split("@")[0] ?? `user_${googleId.slice(0, 8)}`;

  return {
    id: googleId,
    username,
    displayName,
    email,
    avatarUrl: session.user.image ?? avatarUrlForUser(googleId),
    authMethod: "google",
    createdAt: getOrSetCreatedAt(googleId),
  };
}
