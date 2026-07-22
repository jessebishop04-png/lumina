"use client";

import type { ReactNode } from "react";
import { InstagramSidebar } from "@/components/layout/InstagramSidebar";

export default function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-layout">
      <InstagramSidebar />
      <main className="app-layout-main">{children}</main>
    </div>
  );
}
