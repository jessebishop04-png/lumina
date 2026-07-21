import gsap from "gsap";

const THEME_BG = {
  dark: "#0a0a0a",
  light: "#ffffff",
} as const;

let activeTween: gsap.core.Tween | null = null;

export function getThemeToggleOrigin(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

export function animateThemeTransition(
  origin: { x: number; y: number },
  nextTheme: "dark" | "light",
  onCommit: () => void,
): Promise<void> {
  if (typeof window === "undefined") {
    onCommit();
    return Promise.resolve();
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    onCommit();
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    activeTween?.kill();
    activeTween = null;

    const { x, y } = origin;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const maxRadius = Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 2;
    const color = THEME_BG[nextTheme];
    const maskId = `theme-reveal-${Date.now()}`;

    document.documentElement.classList.add("theme-transitioning");

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "theme-transition-overlay");
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("preserveAspectRatio", "none");

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
    mask.setAttribute("id", maskId);

    const maskBackdrop = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    maskBackdrop.setAttribute("width", String(w));
    maskBackdrop.setAttribute("height", String(h));
    maskBackdrop.setAttribute("fill", "black");

    const maskCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    maskCircle.setAttribute("cx", String(x));
    maskCircle.setAttribute("cy", String(y));
    maskCircle.setAttribute("r", "0");
    maskCircle.setAttribute("fill", "white");

    mask.appendChild(maskBackdrop);
    mask.appendChild(maskCircle);
    defs.appendChild(mask);
    svg.appendChild(defs);

    const fill = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    fill.setAttribute("width", String(w));
    fill.setAttribute("height", String(h));
    fill.setAttribute("fill", color);
    fill.setAttribute("mask", `url(#${maskId})`);
    svg.appendChild(fill);

    document.body.appendChild(svg);

    const finish = () => {
      fill.removeAttribute("mask");
      onCommit();
      requestAnimationFrame(() => {
        svg.remove();
        document.documentElement.classList.remove("theme-transitioning");
        activeTween = null;
        resolve();
      });
    };

    activeTween = gsap.to(maskCircle, {
      attr: { r: maxRadius },
      duration: 0.7,
      ease: "none",
      overwrite: true,
      onComplete: finish,
    });
  });
}
