"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";

/**
 * macOS-Safari-style browser frame for a project preview (ADR-008 §1):
 * traffic lights, a URL pill carrying the card's fictional product domain,
 * and an always-on raised shadow so the window sits slightly proud of the
 * page. The frame tilts in 3D toward the pointer (Apple-TV-card style) and
 * springs flat on leave.
 *
 * The chrome is plain DOM/CSS and ships on every tier; only the tilt is
 * gated — fine pointer and no reduced-motion preference, like Magnetic.
 * Pointer geometry is measured on the untransformed perspective parent, not
 * the rotating frame, so the rect stays stable mid-tilt. The chrome is
 * decorative (aria-hidden, select-none); the preview inside keeps its own
 * role, accessible name, and keyboard behaviour untouched.
 */

/** Max tilt at the frame's edges, in degrees. */
const MAX_TILT = 6;

export function SafariWindow({
  domain,
  children,
  className = "",
}: {
  /** Fictional product domain for the URL pill (ADR-008 §1) — never real. */
  domain?: string;
  children: ReactNode;
  className?: string;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stageEl = stage.current;
    const frameEl = frame.current;
    if (!stageEl || !frameEl) return;
    if (
      !window.matchMedia("(pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const rxTo = gsap.quickTo(frameEl, "rotationX", {
      duration: 0.5,
      ease: "power3",
    });
    const ryTo = gsap.quickTo(frameEl, "rotationY", {
      duration: 0.5,
      ease: "power3",
    });

    const onMove = (e: PointerEvent) => {
      const r = stageEl.getBoundingClientRect();
      // -1..1 from centre; the edge under the pointer lifts toward the viewer.
      const px = ((e.clientX - r.left) / r.width) * 2 - 1;
      const py = ((e.clientY - r.top) / r.height) * 2 - 1;
      rxTo(py * MAX_TILT);
      ryTo(-px * MAX_TILT);
    };
    const onLeave = () => {
      gsap.to(frameEl, {
        rotationX: 0,
        rotationY: 0,
        duration: 0.9,
        ease: "elastic.out(1, 0.4)",
      });
    };

    stageEl.addEventListener("pointermove", onMove);
    stageEl.addEventListener("pointerleave", onLeave);
    return () => {
      stageEl.removeEventListener("pointermove", onMove);
      stageEl.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(frameEl);
    };
  }, []);

  return (
    <div ref={stage} className={`[perspective:1200px] ${className}`}>
      <div
        ref={frame}
        className="safari-window overflow-hidden rounded-lg border border-line bg-surface shadow-2xl shadow-black/50 will-change-transform"
      >
        {/* Title bar — pure decor. Traffic-light hexes are macOS chrome
            constants, not design tokens, hence the one-off arbitrary values. */}
        <div
          aria-hidden="true"
          className="grid select-none grid-cols-[1fr_minmax(0,2.5fr)_1fr] items-center gap-2 border-b border-line bg-surface-2/60 px-3.5 py-2.5"
        >
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          {domain ? (
            <div className="mx-auto flex min-w-0 max-w-full items-center gap-1.5 rounded-md bg-bg/60 px-3 py-1">
              {/* Padlock */}
              <svg
                viewBox="0 0 24 24"
                className="h-2.5 w-2.5 shrink-0 fill-ink-subtle"
              >
                <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z" />
              </svg>
              <span className="truncate font-mono text-[11px] leading-4 text-ink-subtle">
                {domain}
              </span>
            </div>
          ) : (
            <span />
          )}
          <span />
        </div>

        {/* Window viewport — the curtain preview renders here unchanged. */}
        <div className="safari-viewport">{children}</div>
      </div>
    </div>
  );
}
