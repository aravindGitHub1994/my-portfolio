"use client";

// Ch. 1 title beats (plan-0009 §4.1): name + role typed "into the
// machine" as a DOM overlay keyed to scrub progress. A rAF writes
// opacity straight to the element from experienceState — no React state
// in the frame path, reverse-scrub symmetric by construction.

import { useEffect, useRef } from "react";
import { SITE } from "@/lib/nav";
import { REST_POINTS } from "@/lib/chapters";
import { experienceState } from "@/lib/experienceState";

export function TitleBeats() {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const node = el.current;
      if (node) {
        // Fade in early in ch. 1, hold, fade before the ch. 1 rest.
        // Normalized across ch. 1's OWN span, not from progress 0: chapter
        // 0 now owns scroll span (ADR-013 §2) and the titles must not
        // creep in over the power-button macro. This read correct before
        // only because REST_POINTS[0] happened to be 0.
        const start = REST_POINTS[0];
        const p =
          (experienceState.scrollProgress - start) / (REST_POINTS[1] - start);
        const opacity =
          p < 0.12
            ? p / 0.12
            : p > 0.8
              ? Math.max(0, (1 - p) / 0.2)
              : 1;
        node.style.opacity = experienceState.docked
          ? "0"
          : String(Math.min(Math.max(opacity, 0), 1));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={el}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-[14vh] z-30 text-center"
      style={{ opacity: 0 }}
    >
      <p className="font-w98-mono text-3xl text-ink md:text-5xl">
        {SITE.name}
      </p>
      <p className="mt-2 font-mono text-sm tracking-widest text-ink-muted uppercase">
        {SITE.role}
      </p>
    </div>
  );
}
