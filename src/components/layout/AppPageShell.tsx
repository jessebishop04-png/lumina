"use client";

import type { ReactNode } from "react";
import { InstagramSidebar } from "@/components/layout/InstagramSidebar";

interface AppPageShellProps {
  top: ReactNode;
  children: ReactNode;
  overlay?: ReactNode;
  onUploadClick?: () => void;
}

export function AppPageShell({ top, children, overlay, onUploadClick }: AppPageShellProps) {
  return (
    <div className="app-layout" style={{ display: "flex", height: "100vh", background: "var(--color-surface)", overflow: "hidden" }}>
      <InstagramSidebar onCreateClick={onUploadClick} />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <div className="app-top-bar">{top}</div>
        <div className="page-scroll">{children}</div>
        {overlay}
      </main>
    </div>
  );
}
