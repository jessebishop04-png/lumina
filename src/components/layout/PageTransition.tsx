"use client";

import gsap from "gsap";
import { usePathname } from "next/navigation";
import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const EXIT = {
  opacity: 0,
  y: 6,
  duration: 0.14,
  ease: "power2.in",
} as const;

const ENTER_FROM = { opacity: 0, y: -4 };
const ENTER_TO = {
  opacity: 1,
  y: 0,
  duration: 0.22,
  ease: "power2.out",
} as const;

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);
  const activeTweenRef = useRef<gsap.core.Tween | null>(null);
  const displayedPathRef = useRef(pathname);
  const isAnimatingRef = useRef(false);
  const isFirstMountRef = useRef(true);
  const pendingChildrenRef = useRef(children);
  const [renderedChildren, setRenderedChildren] = useState(children);

  pendingChildrenRef.current = children;

  useEffect(() => {
    if (pathname === displayedPathRef.current && !isAnimatingRef.current) {
      setRenderedChildren(children);
    }
  }, [children, pathname]);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const killActive = () => {
      activeTweenRef.current?.kill();
      activeTweenRef.current = null;
    };

    const setVisible = () => {
      gsap.set(el, { opacity: 1, y: 0, clearProps: "transform" });
    };

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      displayedPathRef.current = pathname;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: reduce)", () => {
        setVisible();
      });
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(el, ENTER_FROM, ENTER_TO);
      });

      return () => {
        mm.revert();
        killActive();
      };
    }

    if (pathname === displayedPathRef.current) return;

    killActive();

    const commitSwap = () => {
      setRenderedChildren(pendingChildrenRef.current);
      displayedPathRef.current = pathname;
    };

    const finish = () => {
      isAnimatingRef.current = false;
      activeTweenRef.current = null;
    };

    const runEnter = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!contentRef.current) {
            finish();
            return;
          }

          activeTweenRef.current = gsap.fromTo(contentRef.current, ENTER_FROM, {
            ...ENTER_TO,
            onComplete: finish,
          });
        });
      });
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      commitSwap();
      setVisible();
      finish();
      return killActive;
    }

    isAnimatingRef.current = true;

    activeTweenRef.current = gsap.to(el, {
      ...EXIT,
      onComplete: () => {
        commitSwap();
        runEnter();
      },
    });

    return killActive;
  }, [pathname]);

  const rootClass = className ? `page-transition ${className}` : "page-transition";

  return (
    <div className={rootClass}>
      <div ref={contentRef} className="page-transition-content">
        {renderedChildren}
      </div>
    </div>
  );
}
