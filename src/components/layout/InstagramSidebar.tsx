"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { DEFAULT_AVATAR_URL } from "@/lib/auth/guestName";

type NavItem = {
  id: string;
  href?: string;
  label: string;
  disabled?: boolean;
  action?: "upload";
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
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={active ? "var(--color-surface)" : "currentColor"} stroke="none" />
    </svg>
  );
}

function StylesIcon({ active = false }: { active?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.25 : 2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5" fill={active ? "currentColor" : "none"} />
      <circle cx="17.5" cy="10.5" r="2.5" fill={active ? "currentColor" : "none"} />
      <circle cx="8.5" cy="7.5" r="2.5" fill={active ? "currentColor" : "none"} />
      <circle cx="6.5" cy="12.5" r="2.5" fill={active ? "currentColor" : "none"} />
      <path d="M12 22c4.418 0 8-3.582 8-8 0-1.657-.503-3.197-1.363-4.473L12 22z" fill={active ? "currentColor" : "none"} />
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
    id: "styles",
    href: "/styles",
    label: "Styles",
    icon: (active = false) => <StylesIcon active={active} />,
  },
  {
    id: "upload",
    label: "Upload",
    action: "upload",
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
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

interface InstagramSidebarProps {
  onCreateClick?: () => void;
}

export function InstagramSidebar({ onCreateClick }: InstagramSidebarProps) {
  const pathname = usePathname();
  const inEditor = pathname.startsWith("/editor");
  const inGenerate = pathname.startsWith("/generate");
  const inLibrary = pathname.startsWith("/library");
  const inStyles = pathname.startsWith("/styles");
  const inAccount = pathname.startsWith("/account") || pathname.startsWith("/login");
  const inExplore = (pathname === "/" || pathname.startsWith("/explore")) && !inAccount;

  return (
    <aside className="sidebar-rail">
      <div className="sidebar-rail-logo">
        <Link href="/" className="sidebar-rail-logo-link" title="Lumina">
          <span className="sidebar-rail-logo-short">L</span>
          <span className="sidebar-rail-logo-full lumina-logo">Lumina</span>
        </Link>
      </div>

      <nav style={{ flex: 1 }} className="sidebar-rail-nav">
        {NAV.map((item) => {
          const active =
            (item.id === "explore" && inExplore && !inEditor && !inGenerate && !inLibrary && !inStyles) ||
            (item.id === "library" && (inEditor || inLibrary)) ||
            (item.id === "create-nav" && inGenerate) ||
            (item.id === "styles" && inStyles);

          if (item.action === "upload") {
            if (onCreateClick) {
              return (
                <button key={item.id} type="button" onClick={onCreateClick} className="sidebar-rail-item">
                  {item.icon(false)}
                  <span className="sidebar-rail-label">{item.label}</span>
                </button>
              );
            }
            return (
              <Link key={item.id} href="/library" className="sidebar-rail-item">
                {item.icon(false)}
                <span className="sidebar-rail-label">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link key={item.id} href={item.href ?? "/"} className={`sidebar-rail-item${active ? " is-active" : ""}`}>
              {item.icon(active)}
              <span className="sidebar-rail-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-rail-footer">
        <ProfileNavItem />
      </div>
    </aside>
  );
}

function ProfileNavItem() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const href = user ? "/account" : "/login";
  const active = pathname.startsWith("/account") || pathname.startsWith("/login");
  const avatar = user?.avatarUrl ?? DEFAULT_AVATAR_URL;
  const label = user ? user.displayName : "Sign in";

  return (
    <Link href={href} className={`sidebar-rail-item sidebar-rail-profile${active ? " is-active" : ""}`} title={label}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={avatar} alt="" width={28} height={28} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", display: "block", flexShrink: 0 }} />
      <span className="sidebar-rail-label">{label}</span>
    </Link>
  );
}
