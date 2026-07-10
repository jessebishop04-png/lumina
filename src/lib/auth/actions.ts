"use server";

import { signIn } from "@/auth";

export async function signInWithGoogleAction(redirectTo = "/"): Promise<void> {
  await signIn("google", { redirectTo });
}
