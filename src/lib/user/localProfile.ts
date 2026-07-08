import type { LocalUserProfile } from "@/lib/types/explore";
import { useAuthStore } from "@/lib/store/authStore";

export function getLocalProfile(): LocalUserProfile | null {
  const user = useAuthStore.getState().user;
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  };
}

export function requireLocalProfile(): LocalUserProfile {
  const existing = getLocalProfile();
  if (existing) return existing;
  const user = useAuthStore.getState().continueAsGuest();
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  };
}
