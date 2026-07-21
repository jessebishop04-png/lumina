"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useLeftSidebarDials } from "@/lib/dials/useLeftSidebarDials";
import { useAuthStore } from "@/lib/store/authStore";
import { DEFAULT_AVATAR_URL } from "@/lib/auth/guestName";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: (active?: boolean) => ReactNode;
};

function CreateIcon({ active = false }: { active?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.25 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.376 2.622a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414L9.37 17.207l-4 1 1-4L18.376 2.622z" fill={active ? "currentColor" : "none"} />
      <path d="M3 21h18" />
    </svg>
  );
}

function ExploreIcon({ active = false }: { active?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.25 : 2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" fill={active ? "currentColor" : "none"} />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={active ? "var(--color-bg)" : "currentColor"} stroke="none" />
    </svg>
  );
}

const NAV: NavItem[] = [
  {
    id: "explore",
    href: "/",
    label: "Explore",
    icon: (active = false) => <ExploreIcon active={active} />,
  },
  {
    id: "create-nav",
    href: "/generate",
    label: "Create",
    icon: (active = false) => <CreateIcon active={active} />,
  },
  {
    id: "library",
    href: "/library",
    label: "Library",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
];

function leftSidebarDialStyles(d: ReturnType<typeof useLeftSidebarDials>): CSSProperties {
  const ease = `cubic-bezier(${d.Animation.easeX1}, ${d.Animation.easeY1}, ${d.Animation.easeX2}, ${d.Animation.easeY2})`;

  return {
    ["--sidebar-rail-width" as string]: `${d.Layout.collapsedWidth}px`,
    ["--sidebar-rail-expanded" as string]: `${d.Layout.expandedWidth}px`,
    ["--sidebar-rail-icon-inset" as string]: `${d.Layout.iconInset}px`,
    ["--sidebar-rail-item-gap" as string]: `${d.Layout.itemGap}px`,
    ["--sidebar-rail-item-min-height" as string]: `${d.Layout.itemMinHeight}px`,
    ["--sidebar-rail-item-padding-y" as string]: `${d.Layout.itemPaddingY}px`,
    ["--sidebar-rail-label-gap" as string]: `${d.Layout.labelGap}px`,
    ["--sidebar-rail-label-max-width" as string]: `${d.Layout.labelMaxWidth}px`,
    ["--sidebar-rail-expand-duration" as string]: `${d.Animation.expandDuration}ms`,
    ["--sidebar-rail-label-duration" as string]: `${d.Animation.labelDuration}ms`,
    ["--sidebar-rail-ease" as string]: ease,
    ["--sidebar-rail-icon-size" as string]: `${d.Controls.iconSize}px`,
    ["--sidebar-rail-label-font-size" as string]: `${d.Controls.labelFontSize}px`,
    ["--sidebar-rail-logo-size" as string]: `${d.Controls.logoFontSize}px`,
    ["--sidebar-rail-item-radius" as string]: `${d.Controls.itemBorderRadius}px`,
    ["--sidebar-rail-profile-avatar-size" as string]: `${d.Controls.profileAvatarSize}px`,
    ["--sidebar-rail-item-hover-opacity" as string]: String(d.Controls.itemHoverOpacity),
    ["--sidebar-rail-bg" as string]: "var(--color-surface)",
    ["--sidebar-rail-item-color" as string]: "var(--color-text-muted)",
    ["--sidebar-rail-item-active-color" as string]: "var(--color-text-primary)",
  };
}

export function InstagramSidebar() {
  const dials = useLeftSidebarDials();
  const pathname = usePathname();
  const inEditor = pathname.startsWith("/editor");
  const inGenerate = pathname.startsWith("/generate");
  const inLibrary = pathname.startsWith("/library");
  const inAccount = pathname.startsWith("/account") || pathname.startsWith("/login");
  const inExplore = (pathname === "/" || pathname.startsWith("/explore")) && !inAccount;

  return (
    <aside className="sidebar-rail" style={leftSidebarDialStyles(dials)}>
      <div className="sidebar-rail-logo">
        <Link href="/" className="sidebar-rail-logo-link" title="Home">
          <span className="sidebar-rail-icon-slot">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="sidebar-rail-logo-img" />
          </span>
        </Link>
      </div>

      <nav style={{ flex: 1 }} className="sidebar-rail-nav">
        {NAV.map((item) => {
          const active =
            (item.id === "explore" && inExplore && !inEditor && !inGenerate && !inLibrary) ||
            (item.id === "library" && (inEditor || inLibrary)) ||
            (item.id === "create-nav" && inGenerate);

          return (
            <Link key={item.id} href={item.href} className={`sidebar-rail-item${active ? " is-active" : ""}`}>
              <span className="sidebar-rail-icon-slot">{item.icon(active)}</span>
              <span className="sidebar-rail-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-rail-footer">
        <ThemeToggle />
        <ProfileNavItem avatarSize={dials.Controls.profileAvatarSize} />
      </div>
    </aside>
  );
}

function ProfileNavItem({ avatarSize }: { avatarSize: number }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const href = user ? "/account" : "/login";
  const active = pathname.startsWith("/account") || pathname.startsWith("/login");
  const avatar = user?.avatarUrl ?? DEFAULT_AVATAR_URL;
  const label = user ? user.displayName : "Sign in";

  return (
    <Link href={href} className={`sidebar-rail-item sidebar-rail-profile${active ? " is-active" : ""}`} title={label}>
      <span className="sidebar-rail-icon-slot">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt="" width={avatarSize} height={avatarSize} className="sidebar-rail-profile-avatar" />
      </span>
      <span className="sidebar-rail-label">{label}</span>
    </Link>
  );
}
