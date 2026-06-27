"use client";

import { useEffect, useRef } from "react";

/**
 * Fixed, full-viewport radial-gradient glow that follows the pointer,
 * giving the page a subtle "torchlight" feel. Mounted once in the root
 * layout, above the page content but below interactive elements
 * (pointer-events disabled throughout). Disabled entirely on touch
 * devices (no meaningful pointer to track) and on prefers-reduced-motion.
 */
export function CursorSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (reduceMotion || isTouch) return;

    let raf = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    const apply = () => {
      node.style.background = `radial-gradient(600px circle at ${x}px ${y}px, rgba(212,175,55,0.10), transparent 60%)`;
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          apply();
          raf = 0;
        });
      }
    };

    apply();
    node.style.opacity = "1";
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 opacity-0 transition-opacity duration-500 motion-reduce:hidden"
    />
  );
}
