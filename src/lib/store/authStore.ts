import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { AuthMethod, AuthUser } from "@/lib/types/auth";
import { avatarUrlForUser, generateGuestUsername } from "@/lib/auth/guestName";

interface AuthState {
  user: AuthUser | null;
  isHydrated: boolean;

  hydrate: () => void;
  continueAsGuest: () => AuthUser;
  signUpWithEmail: (email: string, password: string, displayName: string) => AuthUser;
  signInWithEmail: (email: string, password: string) => AuthUser | null;
  syncGoogleUser: (user: AuthUser) => void;
  signOut: () => void;
  updateProfile: (partial: { displayName?: string; username?: string; avatarUrl?: string }) => void;
}

const ACCOUNTS_KEY = "lumina-accounts";

interface StoredAccount {
  email: string;
  password: string;
  user: AuthUser;
}

function loadAccounts(): StoredAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw?.trim()) return [];
    return JSON.parse(raw) as StoredAccount[];
  } catch {
    localStorage.removeItem(ACCOUNTS_KEY);
    return [];
  }
}

const safeLocalStorage = {
  getItem: (name: string): string | null => {
    try {
      const raw = localStorage.getItem(name);
      if (!raw?.trim()) return null;
      JSON.parse(raw);
      return raw;
    } catch {
      localStorage.removeItem(name);
      return null;
    }
  },
  setItem: (name: string, value: string) => localStorage.setItem(name, value),
  removeItem: (name: string) => localStorage.removeItem(name),
};

function saveAccounts(accounts: StoredAccount[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function createUser(method: AuthMethod, opts: { email?: string; displayName?: string; username?: string }): AuthUser {
  const id = uuidv4();
  const username = opts.username ?? (method === "guest" ? generateGuestUsername() : opts.email?.split("@")[0] ?? `user_${id.slice(0, 6)}`);
  return {
    id,
    username,
    displayName: opts.displayName ?? username,
    email: opts.email ?? null,
    avatarUrl: avatarUrlForUser(id),
    authMethod: method,
    createdAt: new Date().toISOString(),
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isHydrated: false,

      hydrate: () => set({ isHydrated: true }),

      continueAsGuest: () => {
        const user = createUser("guest", {});
        set({ user });
        return user;
      },

      signUpWithEmail: (email, password, displayName) => {
        const accounts = loadAccounts();
        if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
          throw new Error("An account with this email already exists.");
        }
        const user = createUser("email", { email, displayName: displayName.trim() || email.split("@")[0] });
        accounts.push({ email: email.toLowerCase(), password, user });
        saveAccounts(accounts);
        set({ user });
        return user;
      },

      signInWithEmail: (email, password) => {
        const account = loadAccounts().find(
          (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
        );
        if (!account) return null;
        set({ user: account.user });
        return account.user;
      },

      syncGoogleUser: (user) => {
        set({ user });
      },

      signOut: () => set({ user: null }),

      updateProfile: (partial) => {
        const { user } = get();
        if (!user) return;
        const updated = { ...user, ...partial };
        set({ user: updated });
        const accounts = loadAccounts();
        const idx = accounts.findIndex((a) => a.user.id === user.id);
        if (idx >= 0) {
          accounts[idx] = { ...accounts[idx], user: updated };
          saveAccounts(accounts);
        }
      },
    }),
    {
      name: "lumina-auth",
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.hydrate();
      },
    }
  )
);

export function getAuthUser(): AuthUser | null {
  return useAuthStore.getState().user;
}
