"use client";

import { useSyncExternalStore } from "react";
import { TECH_ICONS } from "@/lib/techIcons";

/** SSR-safe subscription to the reduced-motion preference (no setState-in-effect). */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/**
 * Ring of tool-icon glyphs that orbits the hero portrait. Each icon sits on a
 * fixed angle around the ring and counter-rotates against the ring's own
 * rotation so the glyphs stay upright while they travel. The two keyframes
 * this needs (`orbit-spin` / its reverse) aren't in the shared globals.css
 * design system, so they're scoped locally via a `<style>` tag rather than
 * touching the global stylesheet. Rotation halts on prefers-reduced-motion,
 * leaving the icons in a static, evenly-spaced ring.
 */
export function OrbitRing() {
  const reduceMotion = usePrefersReducedMotion();

  const count = TECH_ICONS.length;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-8 select-none sm:-inset-10"
    >
      <style>{`
        @keyframes orbit-ring-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbit-ring-spin-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
      `}</style>
      {/* Faint ring guide so the orbit path reads even when icons are sparse */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full border border-line"
      />
      <div
        className="absolute inset-0"
        style={
          reduceMotion
            ? undefined
            : { animation: "orbit-ring-spin 28s linear infinite" }
        }
      >
        {TECH_ICONS.map((icon, i) => {
          const angle = (360 / count) * i;
          return (
            <div
              key={icon.name}
              className="absolute inset-0 origin-center"
              style={{ transform: `rotate(${angle}deg)` }}
            >
              <div
                className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
                style={
                  reduceMotion
                    ? undefined
                    : { animation: "orbit-ring-spin-reverse 28s linear infinite" }
                }
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface/90 text-ink-muted shadow-[0_0_18px_-4px_var(--color-glow)] transition-colors hover:border-gold/60 hover:text-gold sm:h-10 sm:w-10"
                  title={icon.name}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d={icon.path} />
                  </svg>
                  <span className="sr-only">{icon.name}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
