"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/lib/store/authStore";
import { ModalPortal } from "@/components/layout/ModalPortal";

export function WelcomeAuthModal() {
  const router = useRouter();
  const { status } = useSession();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);

  if (!isHydrated || status === "loading" || user) return null;

  return (
    <ModalPortal>
      <div className="welcome-auth-backdrop">
        <div className="welcome-auth-panel" role="dialog" aria-labelledby="welcome-auth-title">
          <p className="welcome-auth-eyebrow">Welcome to Lumina</p>
          <h2 id="welcome-auth-title" className="welcome-auth-title">
            Create, explore, and edit AI images
          </h2>
          <p className="welcome-auth-subtitle">
            Sign up for a free account, or continue as a guest to start creating right away.
          </p>

          <div className="welcome-auth-actions">
            <Link href="/login?mode=signup" className="welcome-auth-btn welcome-auth-btn--primary">
              Create account
            </Link>
            <Link href="/login?mode=signin" className="welcome-auth-btn">
              Sign in with email
            </Link>
            <button
              type="button"
              className="welcome-auth-btn welcome-auth-btn--ghost"
              onClick={() => {
                continueAsGuest();
                router.push("/");
              }}
            >
              Continue as guest
            </button>
          </div>

          <p className="welcome-auth-note">Guest accounts get a random username like guest_x7k2m9</p>
        </div>
      </div>
    </ModalPortal>
  );
}
