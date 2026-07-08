"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

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
          <button type="button" onClick={() => { signInWithGoogle(); finish(); }} style={googleBtnStyle}>
            <GoogleIcon />
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
          </div>

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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
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

const googleBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 10,
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-panel)",
  color: "var(--color-text-primary)",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
};
