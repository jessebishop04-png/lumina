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
