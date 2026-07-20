"use client";

// The dock swap (plan-0009 §4.2, ADR-012 §4): at chapter 4's rest point
// the camera sits square-on to the CRT and the painter texture cross-fades
// to the live DOM shell, pixel-aligned over the glass. Scroll suspends
// while docked (Lenis stopped — the dock contract); scroll intent with
// every window closed/minimized undocks and resumes the journey. The shell
// reads the same win98State singleton as the painter, so state persists
// across dock cycles by construction and both sides of the fade show the
// same frame.
//
// Lifecycle is an explicit phase machine — "idle" (unmounted) → "in"
// (mounted at opacity 0) → "shown" → "out" (reverse fade) → "idle".
// Invariant: docked is released the moment the undock *intent* fires
// (entering "out"), never from a timer — so no unmount path can strand
// the journey with Lenis stopped.

import { useEffect, useRef, useState } from "react";
import { useLenisRef } from "@/components/LenisProvider";
import { experienceState } from "@/lib/experienceState";
import { REST_POINTS } from "@/lib/chapters";
import { allWindowsIdle, DESKTOP_H } from "@/lib/win98State";
import { setHumDucked } from "@/lib/audio";
import { useWin98Version } from "@/components/win98/shell/useWin98";
import { Desktop } from "@/components/win98/shell/Desktop";
import { coarsePointer } from "@/lib/shellLayout";
import { computeDockRect, type DockRect } from "./dockAlignment";

/** Engage when |progress − rest| falls inside this... */
const ENGAGE_EPS = 0.004;
/** ...and only re-arm after it has left by this much (hysteresis, so the
 *  post-undock snap can't immediately re-dock). */
const REARM_EPS = 0.02;
/** Cross-fade duration — the §4.2 budget is ≤ 150 ms. */
const FADE_MS = 150;
/** rAF can stall right at the engage moment (docking pauses the frame
 *  pipeline; throttled/background tabs stall it entirely — QA found the
 *  fade never ran headless). If the fade-in frame hasn't fired by this
 *  point, show without the transition; both frames are identical anyway. */
const FADE_FALLBACK_MS = 100;
/** Painter rows — the CSS scanline overlay locks to the same period the
 *  CRT shader uses so the fade doesn't change the line pitch. */
const SCANLINE_ROWS = DESKTOP_H;
/** The journey's stepping keys (Choreography ignores them while docked) —
 *  a keyboard visitor needs the same exit wheel/touch users get. */
const UNDOCK_KEYS = [
  "ArrowDown",
  "ArrowRight",
  "ArrowUp",
  "ArrowLeft",
  "PageDown",
  "PageUp",
  " ",
  "Escape",
];

type Phase = "idle" | "in" | "shown" | "out";

export function DockSwap() {
  const lenisRef = useLenisRef();
  // Re-render on any shell mutation — the "keep scrolling" hint tracks
  // allWindowsIdle() live.
  useWin98Version();
  const [phase, setPhase] = useState<Phase>("idle");
  const [rect, setRect] = useState<DockRect | null>(null);
  const overlay = useRef<HTMLDivElement | null>(null);

  // rAF watcher on the mutable scrub progress (never React state): engage
  // at the dock rest point with hysteresis. Owns the docked flag's
  // lifecycle, so it also restores scroll if the experience unmounts
  // mid-dock.
  useEffect(() => {
    // Live by mount time (ssr:false tree, LenisProvider's effect already
    // ran) — the same capture PowerOn uses.
    const lenis = lenisRef?.current;
    let raf = 0;
    let armed = true;
    const tick = () => {
      const away = Math.abs(experienceState.scrollProgress - REST_POINTS[4]);
      if (!experienceState.docked) {
        if (!armed && away > REARM_EPS) armed = true;
        else if (armed && away < ENGAGE_EPS) {
          armed = false;
          experienceState.docked = true;
          // Room bed ducks while docked (§6.1): reading, not cinema. Rides
          // the docked flag itself so it can never desync from the dock.
          setHumDucked(true);
          lenis?.stop();
          setRect(
      computeDockRect(window.innerWidth, window.innerHeight, coarsePointer()),
    );
          setPhase("in");
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (experienceState.docked) {
        experienceState.docked = false;
        setHumDucked(false);
        lenis?.start();
      }
    };
  }, [lenisRef]);

  // "in" → "shown" one frame after mount so the opacity transition runs —
  // with a timeout fallback for the stalled-rAF case above. Whichever
  // fires first wins; both are cleaned up.
  useEffect(() => {
    if (phase !== "in") return;
    const show = () => setPhase("shown");
    const raf = requestAnimationFrame(show);
    const fallback = setTimeout(show, FADE_FALLBACK_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
  }, [phase]);

  // "out" → "idle" after the reverse fade. The dock was already released
  // on the undock intent, so a late (throttled) timer just delays DOM
  // cleanup of an invisible, pointer-inert overlay — never the journey.
  useEffect(() => {
    if (phase !== "out") return;
    const timer = setTimeout(() => setPhase("idle"), FADE_MS + 50);
    return () => clearTimeout(timer);
  }, [phase]);

  // The dock contract's exit: scroll intent while every window is closed
  // or minimized undocks. Windows-open input stays with the shell. Keys
  // mirror Choreography's stepping set so keyboard visitors aren't
  // stranded — but never when the event originated inside the shell
  // (Space on a focused Start button must stay a click).
  useEffect(() => {
    if (phase !== "shown") return;
    const undock = () => {
      if (!experienceState.docked || !allWindowsIdle()) return;
      experienceState.docked = false;
      setHumDucked(false);
      lenisRef?.current?.start();
      setPhase("out");
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!UNDOCK_KEYS.includes(e.key)) return;
      if (
        e.target instanceof Node &&
        overlay.current?.contains(e.target) &&
        e.target !== overlay.current
      )
        return;
      undock();
    };
    window.addEventListener("wheel", undock, { passive: true });
    window.addEventListener("touchmove", undock, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("wheel", undock);
      window.removeEventListener("touchmove", undock);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [phase, lenisRef]);

  // Alignment is analytic from the viewport — recompute on resize (DPR
  // changes fire resize too).
  useEffect(() => {
    if (phase === "idle") return;
    const onResize = () =>
      setRect(
      computeDockRect(window.innerWidth, window.innerHeight, coarsePointer()),
    );
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [phase]);

  if (phase === "idle" || !rect) return null;

  const shown = phase === "shown";
  const idle = allWindowsIdle();
  // One painter row in CSS px — the scanline period.
  const rowPx = rect.height / SCANLINE_ROWS;

  return (
    <div
      ref={overlay}
      className="fixed inset-0 z-30"
      style={{
        opacity: shown ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease-out`,
        pointerEvents: shown ? "auto" : "none",
      }}
    >
      <div
        className="absolute overflow-hidden"
        style={{
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        }}
      >
        {/* The live shell in its virtual units, stretched to the screen
            quad exactly as the painter texture is. Window drag divides by
            a single scale — scaleY, per the 4.2 note (~5% x drag error,
            accepted until 4.3). On touch the space is portrait and the
            two scales are equal, so that error is desktop-only. */}
        <div
          style={{
            width: rect.virtualW,
            height: rect.virtualH,
            transform: `scale(${rect.scaleX}, ${rect.scaleY})`,
            transformOrigin: "top left",
          }}
        >
          <Desktop scale={rect.scaleY} />
        </div>

        {/* CSS CRT layer (§4 color/tone match): scanlines at the shader's
            period/amplitude (uScanline 0.22 → 0.11 peak darkening)... */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(to bottom, rgba(0,0,0,0.11) 0px, rgba(0,0,0,0.11) ${rowPx / 2}px, transparent ${rowPx / 2}px, transparent ${rowPx}px)`,
          }}
        />
        {/* ...and the corner vignette (shader floor 0.55 → 45% edge
            darkening; center clamps clean). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0) 62%, rgba(0,0,0,0.45) 100%)",
          }}
        />
      </div>

      {/* Everything closed/minimized → surface the way onward. */}
      <p
        className="pointer-events-none absolute inset-x-0 bottom-[6vh] text-center font-mono text-xs tracking-widest text-ink-subtle uppercase"
        style={{
          opacity: idle ? 1 : 0,
          transition: "opacity 400ms ease",
        }}
      >
        keep scrolling
      </p>
    </div>
  );
}
