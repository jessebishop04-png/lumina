"use client";

import { signOut as nextAuthSignOut } from "next-auth/react";
import { useAuthStore } from "@/lib/store/authStore";

export async function signOutUser(): Promise<void> {
  const user = useAuthStore.getState().user;
  useAuthStore.getState().signOut();

  if (user?.authMethod === "google") {
    await nextAuthSignOut({ redirect: false });
  }
}

export function signInWithGoogle(callbackUrl = "/"): void {
  void import("next-auth/react").then(({ signIn }) => {
    void signIn("google", { callbackUrl });
  });
}
