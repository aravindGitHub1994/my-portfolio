"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";

/**
 * Fixed, full-viewport radial-gradient glow that follows the pointer,
 * giving the page a subtle "torchlight in the dark" feel. Night-only
 * (disabled in day mode per ADR-003 — the metaphor doesn't apply in daylight).
 * Also disabled on touch devices and prefers-reduced-motion.
 */
export function CursorSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  // Follow the committed (painted) theme, not the target: during an animated
  // toggle the spotlight must come/go in lockstep with the page at the mid-arc
  // flip, not eagerly at click (ADR-004).
  const { committed } = useTheme();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Night-only metaphor — reset visibility and bail in day mode.
    if (committed === "day") {
      node.style.opacity = "0";
      node.style.background = "";
      return;
    }

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
  }, [committed]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 opacity-0 transition-opacity duration-500 motion-reduce:hidden"
    />
  );
}
