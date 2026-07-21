"use client";

import type { ReactNode } from "react";
import { PageTransition } from "@/components/layout/PageTransition";

export function PageTransitionShell({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
