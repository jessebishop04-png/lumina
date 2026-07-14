"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";

type AuthMode = "signin" | "signup";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  useEffect(() => {
    const initial = searchParams.get("mode");
    if (initial === "signup") setMode("signup");
    if (initial === "signin") setMode("signin");
  }, [searchParams]);

  useEffect(() => {
    const authError = searchParams.get("error");
    if (authError) {
      setError("Could not sign in. Please try again.");
    }
  }, [searchParams]);

  const finish = () => router.push("/");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-surface)",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" className="lumina-logo" style={{ fontSize: 28 }}>
            Lumina
          </Link>
          <p style={{ margin: "12px 0 0", color: "var(--color-text-secondary)", fontSize: 14 }}>
            Create, edit, and explore AI images
          </p>
        </div>

        <div
          style={{
            background: "var(--color-surface-panel)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            padding: 28,
          }}
        >
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <TabButton active={mode === "signin"} onClick={() => setMode("signin")} label="Sign in" />
            <TabButton active={mode === "signup"} onClick={() => setMode("signup")} label="Sign up" />
          </div>

          {mode === "signup" && (
            <input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={inputStyle}
            />
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle, marginBottom: 16 }}
          />

          {error && <p style={{ color: "#e74c3c", fontSize: 13, margin: "0 0 12px" }}>{error}</p>}

          <button
            type="button"
            onClick={() => {
              setError(null);
              try {
                if (mode === "signup") {
                  if (!email || !password) {
                    setError("Email and password are required.");
                    return;
                  }
                  signUpWithEmail(email, password, displayName);
                } else {
                  const ok = signInWithEmail(email, password);
                  if (!ok) {
                    setError("Invalid email or password.");
                    return;
                  }
                }
                finish();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Something went wrong.");
              }
            }}
            style={primaryBtnStyle}
          >
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={() => {
              continueAsGuest();
              finish();
            }}
            style={guestBtnStyle}
          >
            Continue as guest
          </button>
          <p style={{ margin: "10px 0 0", fontSize: 11, color: "var(--color-text-muted)", textAlign: "center" }}>
            Guest accounts get a random username like guest_x7k2m9
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: "8px 0",
        border: "none",
        borderRadius: 8,
        background: active ? "var(--color-accent-soft)" : "transparent",
        color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  marginBottom: 10,
  borderRadius: 10,
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-input)",
  color: "var(--color-text-primary)",
  fontSize: 14,
  boxSizing: "border-box",
};

const primaryBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 0",
  borderRadius: 10,
  border: "none",
  background: "var(--color-accent)",
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  marginBottom: 10,
};

const guestBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 0",
  borderRadius: 10,
  border: "1px solid var(--color-border)",
  background: "transparent",
  color: "var(--color-text-secondary)",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};
