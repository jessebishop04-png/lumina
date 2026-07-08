"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppPageShell } from "@/components/layout/AppPageShell";
import { getGenerationJobs } from "@/lib/storage/generationStorage";
import { useAuthStore } from "@/lib/store/authStore";
import { signOutUser } from "@/lib/auth/signInOut";

type AccountSection = "profile" | "subscription" | "billing";

export function AccountPageView() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [section, setSection] = useState<AccountSection>("profile");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [generationCount, setGenerationCount] = useState(0);

  useEffect(() => {
    if (isHydrated && !user) router.replace("/login");
  }, [isHydrated, user, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setUsername(user.username);
    }
  }, [user]);

  useEffect(() => {
    void getGenerationJobs().then((jobs) => {
      const count = jobs.reduce((sum, j) => sum + j.images.length, 0);
      setGenerationCount(count);
    });
  }, []);

  if (!isHydrated) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-surface)" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppPageShell
      top={
        <div className="account-top-bar">
          <h1 className="account-top-title">Account</h1>
        </div>
      }
    >
      <div className="account-layout">
        <aside className="account-nav">
          {(
            [
              ["profile", "Profile"],
              ["subscription", "Manage plan"],
              ["billing", "Billing"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={`account-nav-item${section === id ? " is-active" : ""}`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            className="account-nav-item account-nav-signout"
            onClick={() => {
              void signOutUser().then(() => router.push("/login"));
            }}
          >
            Sign out
          </button>
        </aside>

        <div className="account-content">
          {section === "profile" && (
            <div style={{ maxWidth: 560 }}>
              <h2 className="account-section-title">Profile</h2>

              <div className="account-profile-header">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.avatarUrl} alt="" width={80} height={80} className="account-profile-avatar" />
                <div>
                  <p className="account-profile-name">{user.displayName}</p>
                  <p className="account-profile-meta">@{user.username}</p>
                  <p className="account-profile-meta">
                    {user.authMethod} account · Member since {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <label style={labelStyle}>Display name</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={fieldStyle} />

              <label style={labelStyle}>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} style={fieldStyle} />

              {user.email && (
                <>
                  <label style={labelStyle}>Email</label>
                  <input value={user.email} readOnly style={{ ...fieldStyle, opacity: 0.7 }} />
                </>
              )}

              <button
                type="button"
                onClick={() => updateProfile({ displayName: displayName.trim(), username: username.trim() })}
                style={saveBtnStyle}
              >
                Save changes
              </button>

              <div className="account-stat-card">
                <p className="account-stat-label">Images created</p>
                <p className="account-stat-value">{generationCount}</p>
              </div>
            </div>
          )}

          {section === "subscription" && (
            <div style={{ maxWidth: 560 }}>
              <h2 className="account-section-title">Manage plan</h2>
              <p style={{ color: "var(--color-text-secondary)", margin: "0 0 24px", fontSize: 14 }}>
                You&apos;re on the Basic plan — free with local generation.
              </p>
              <div className="account-plan-card">
                <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 16 }}>Basic</p>
                <p style={{ margin: "0 0 16px", color: "var(--color-text-secondary)", fontSize: 13 }}>$0 / month</p>
                <ul style={{ margin: 0, paddingLeft: 18, color: "var(--color-text-secondary)", fontSize: 13, lineHeight: 1.8 }}>
                  <li>AI image generation</li>
                  <li>Photo editor with adjustments</li>
                  <li>Explore community feed</li>
                  <li>Local project storage</li>
                </ul>
              </div>
              <button type="button" disabled style={{ ...saveBtnStyle, marginTop: 16, opacity: 0.5, cursor: "not-allowed" }}>
                Upgrade (coming soon)
              </button>
            </div>
          )}

          {section === "billing" && (
            <div style={{ maxWidth: 560 }}>
              <h2 className="account-section-title">Billing</h2>
              <p style={{ color: "var(--color-text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
                No payment method on file. Billing will appear here when you upgrade to a paid plan.
              </p>
              <Link href="/generate" style={{ color: "var(--color-accent)", fontSize: 14, fontWeight: 600 }}>
                Go to Create →
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppPageShell>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--color-text-secondary)",
  marginBottom: 6,
  marginTop: 16,
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-input)",
  color: "var(--color-text-primary)",
  fontSize: 14,
  boxSizing: "border-box",
};

const saveBtnStyle: React.CSSProperties = {
  marginTop: 24,
  padding: "10px 20px",
  borderRadius: 10,
  border: "none",
  background: "var(--color-accent)",
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};
