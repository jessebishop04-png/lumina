"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, type ReactNode } from "react";
import { authUserFromSession } from "@/lib/auth/sessionUser";
import { useAuthStore } from "@/lib/store/authStore";

function AuthSessionSync() {
  const { data: session, status } = useSession();
  const user = useAuthStore((s) => s.user);
  const syncGoogleUser = useAuthStore((s) => s.syncGoogleUser);
  const signOut = useAuthStore((s) => s.signOut);

  useEffect(() => {
    if (status === "loading") return;

    if (session?.user?.id) {
      syncGoogleUser(authUserFromSession(session));
      return;
    }

    if (status === "unauthenticated" && user?.authMethod === "google") {
      signOut();
    }
  }, [session, status, syncGoogleUser, signOut, user?.authMethod]);

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthSessionSync />
      {children}
    </SessionProvider>
  );
}
