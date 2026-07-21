"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppPageShell } from "@/components/layout/AppPageShell";
import { ACCEPTED_IMAGE_EXTENSIONS, ACCEPTED_IMAGE_TYPES } from "@/lib/constants/exportPresets";
import { getGenerationJobs } from "@/lib/storage/generationStorage";
import { useAuthStore } from "@/lib/store/authStore";
import { signOutUser } from "@/lib/auth/signInOut";

function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        d="M4 8h3l1.5-2h7L17 8h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function ProfileAvatarPicker({
  avatarUrl,
  onChange,
}: {
  avatarUrl: string;
  onChange: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file || !ACCEPTED_IMAGE_TYPES.includes(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <button
        type="button"
        className="account-profile-avatar-btn"
        onClick={() => inputRef.current?.click()}
        aria-label="Change profile photo"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl} alt="" width={80} height={80} className="account-profile-avatar" />
        <span className="account-profile-avatar-overlay">
          <CameraIcon />
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_EXTENSIONS}
        className="account-profile-avatar-input"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </>
  );
}

export function AccountPageView() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const updateProfile = useAuthStore((s) => s.updateProfile);

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
      <AppPageShell
        top={
          <div className="account-top-bar">
            <h1 className="account-top-title">Account</h1>
          </div>
        }
      >
        <div className="account-loading-inline">
          <div className="spinner" />
        </div>
      </AppPageShell>
    );
  }

  if (!user) return null;

  const accountNav = (
    <aside className="account-nav">
      <button type="button" className="account-nav-item is-active" aria-current="page">
        Profile
      </button>
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
  );

  return (
    <AppPageShell
      top={
        <div className="account-top-bar">
          <h1 className="account-top-title">Account</h1>
        </div>
      }
      sidebar={accountNav}
    >
      <div className="account-content">
        <div className="account-panel">
          <h2 className="account-section-title">Profile</h2>

          <div className="account-profile-header">
            <ProfileAvatarPicker
              avatarUrl={user.avatarUrl}
              onChange={(avatarUrl) => updateProfile({ avatarUrl })}
            />
            <div>
              <p className="account-profile-name">{user.displayName}</p>
              <p className="account-profile-meta">@{user.username}</p>
              <p className="account-profile-meta">
                {user.authMethod} account · Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <label className="account-field-label">Display name</label>
          <input className="account-field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />

          <label className="account-field-label">Username</label>
          <input className="account-field" value={username} onChange={(e) => setUsername(e.target.value)} />

          {user.email && (
            <>
              <label className="account-field-label">Email</label>
              <input className="account-field account-field--readonly" value={user.email} readOnly />
            </>
          )}

          <button
            type="button"
            className="account-save-btn"
            onClick={() => updateProfile({ displayName: displayName.trim(), username: username.trim() })}
          >
            Save changes
          </button>

          <div className="account-stat-card">
            <p className="account-stat-label">Images created</p>
            <p className="account-stat-value">{generationCount}</p>
          </div>
        </div>
      </div>
    </AppPageShell>
  );
}
