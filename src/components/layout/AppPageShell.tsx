"use client";

import type { ReactNode } from "react";
import { InstagramSidebar } from "@/components/layout/InstagramSidebar";

interface AppPageShellProps {
  top: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  overlay?: ReactNode;
}

export function AppPageShell({ top, children, sidebar, footer, overlay }: AppPageShellProps) {
  return (
    <div className="app-layout">
      <InstagramSidebar />

      <main className="app-layout-main">
        <div className="app-top-bar">{top}</div>
        {sidebar ? (
          <div className="app-page-with-sidebar">
            {sidebar}
            <div className="page-scroll">{children}</div>
          </div>
        ) : (
          <div className="page-scroll">{children}</div>
        )}
        {footer ? <div className="app-bottom-bar">{footer}</div> : null}
        {overlay}
      </main>
    </div>
  );
}
