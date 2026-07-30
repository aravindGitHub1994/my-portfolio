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

import { useCallback, useEffect, useRef, useState } from "react";
import { useLenisRef } from "@/components/LenisProvider";
import { experienceState } from "@/lib/experienceState";
import { DOCK_REST_INDEX, REST_POINTS } from "@/lib/chapters";
import { allWindowsIdle, DESKTOP_H, subscribeWin98 } from "@/lib/win98State";
import { setHumDucked } from "@/lib/audio";
import { useWin98Version } from "@/components/win98/shell/useWin98";
import { Desktop } from "@/components/win98/shell/Desktop";
import {
  coarsePointer,
  computeShellLayout,
  type ShellLayout,
} from "@/lib/shellLayout";
import { computeDockRect, type DockRect } from "./dockAlignment";
import { DockHint } from "./DockHint";

/** Engage when |progress − rest| falls inside this... */
const ENGAGE_EPS = 0.012;
/** ...and only re-arm after it has left by this much (hysteresis, so the
 *  post-undock scroll can't immediately re-dock). Must stay comfortably
 *  larger than ENGAGE_EPS or an undock re-docks itself. */
const REARM_EPS = 0.05;
/** Glide from wherever the latch caught the visitor to the exact square-on
 *  dock pose, in seconds. The camera samples scrub progress raw (no
 *  damping), so this IS the camera move. */
const LATCH_S = 0.3;
/** Already this close to the pose — the slow-approach case — so glide
 *  nothing and reveal on the spot. */
const LATCH_SKIP_EPS = 0.002;
/** Safety net for the glide's onComplete: a throttled tab may never fire
 *  it, and the visitor must never be left with scroll stopped and no
 *  shell. Same defence as FADE_FALLBACK_MS below, one stage earlier. */
const LATCH_FALLBACK_MS = 450;
/**
 * Momentum guard. A hard flick is not one wheel event — it is a burst that
 * keeps arriving for a second or more after the dock has already caught
 * it, and every one of those events used to read as undock intent. The
 * visitor saw the desktop flash past and reported it as the dock being
 * skipped; the dock had in fact latched and been ejected by their own
 * leftover scroll.
 *
 * Two rules, because either alone has a hole: nothing undocks for a beat
 * after the latch, AND an undock must come from a scroll that follows a
 * genuine pause. Momentum arrives on the frame pipeline, tens of ms apart
 * and for as long as it lasts; a human deciding to leave has stopped
 * scrolling first — they were reading. The pause threshold is set well
 * above any inter-event gap a burst produces and well below the pause
 * anyone takes to look at a desktop, so it does not need to be precise.
 *
 * A third rule bounds the second one — see MOMENTUM_MAX_MS.
 */
const UNDOCK_GRACE_MS = 800;
const SCROLL_QUIET_MS = 350;
/**
 * How long leftover momentum can plausibly last. Past this, scroll intent
 * undocks whether or not it followed a pause.
 *
 * The pause rule cannot be the only rule, and the way it fails was reported
 * from the *backward* pass (session 19). A visitor returning from SIGN-OFF
 * is travelling, not arriving: they cross ch. 4, the dock latches them, and
 * they carry on scrolling — so every event they produce lands within
 * SCROLL_QUIET_MS of the one before it, every one of them reads as the
 * docking burst's own momentum, and the dock never releases. It looked like
 * the undock was broken. The visitor who "fixed" it by clicking the desktop
 * and then scrolling had really fixed it by *pausing* around the click.
 *
 * Momentum decays: a fling is spent inside about a second, and nothing
 * generates wheel events after it. Scrolling that is still arriving this
 * long after the latch is a person, so it is taken at its word. Forward
 * visitors are unaffected — they stop to read, so the pause rule still
 * releases them on their first notch, well inside this window.
 */
const MOMENTUM_MAX_MS = 1500;
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

/** The CRT quad and the shell's virtual space, read together from one
 *  viewport sample so they can never come from different ones. */
interface DockView {
  rect: DockRect;
  layout: ShellLayout;
}

function readDockView(): DockView {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const coarse = coarsePointer();
  const rect = computeDockRect(w, h, coarse);
  // Same pure function, same arguments Desktop's own effect will use —
  // so the dialog beside the shell measures the identical virtual space.
  return { rect, layout: computeShellLayout(w, h, coarse, rect.scaleY) };
}

export function DockSwap() {
  const lenisRef = useLenisRef();
  // Re-render on any shell mutation — the "keep scrolling" hint tracks
  // allWindowsIdle() live.
  useWin98Version();
  const [phase, setPhase] = useState<Phase>("idle");
  const [dock, setDock] = useState<DockView | null>(null);
  // The instructions dialog is a once-per-visit thing, and DockSwap lives
  // for the whole visit — so component state is the module flag. Not
  // localStorage on purpose: a fourth persisted key would silently
  // invalidate the 9.2 checklist's "reset your browser state" list.
  const [hintSeen, setHintSeen] = useState(false);
  const overlay = useRef<HTMLDivElement | null>(null);
  /** When the latch fired — the undock's grace period counts from here. */
  const dockedAt = useRef(0);
  /** Gap between the last two pointer-scroll events, in ms. */
  const scrollGap = useRef({ last: 0, gap: Number.POSITIVE_INFINITY });

  // Time every wheel/touch scroll for the whole component's life, not just
  // while docked: the burst that undocks is the same burst that docked, so
  // a listener attached at "shown" would see its first event as a fresh
  // gesture. Registered at mount, therefore ahead of the undock listener
  // in the queue — by the time that one runs, this has already recorded
  // the gap it reads.
  useEffect(() => {
    const mark = () => {
      const now = performance.now();
      scrollGap.current.gap = now - scrollGap.current.last;
      scrollGap.current.last = now;
    };
    window.addEventListener("wheel", mark, { passive: true });
    window.addEventListener("touchmove", mark, { passive: true });
    return () => {
      window.removeEventListener("wheel", mark);
      window.removeEventListener("touchmove", mark);
    };
  }, []);

  // rAF watcher on the mutable scrub progress (never React state): engage
  // at the dock rest point with hysteresis. Owns the docked flag's
  // lifecycle, so it also restores scroll if the experience unmounts
  // mid-dock.
  useEffect(() => {
    // Live by mount time (ssr:false tree, LenisProvider's effect already
    // ran) — the same capture PowerOn uses.
    const lenis = lenisRef?.current;
    const rest = REST_POINTS[DOCK_REST_INDEX];
    let raf = 0;
    let armed = true;
    let previous = experienceState.scrollProgress;
    let latchTimer = 0;
    let revealed = true;

    // Second half of the latch: the camera is square-on, so measure the
    // quad and start the cross-fade. Idempotent — the glide's onComplete
    // and its fallback timer race deliberately.
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      clearTimeout(latchTimer);
      setDock(readDockView());
      setPhase("in");
    };

    const engage = (away: number) => {
      armed = false;
      dockedAt.current = performance.now();
      experienceState.docked = true;
      // Room bed ducks while docked (§6.1): reading, not cinema. Rides
      // the docked flag itself so it can never desync from the dock.
      setHumDucked(true);
      lenis?.stop();
      revealed = false;
      // Pull the last of the way to the exact dock pose before the DOM
      // arrives. dockAlignment computes the quad for the square-on
      // keyframe and JourneyCamera samples progress raw, so revealing
      // from wherever a fast scroll happened to latch would land the
      // shell over a mis-posed CRT. `force` is Lenis for "scroll even if
      // stopped", so the stop above still holds off the visitor's input.
      const span = experienceState.runwaySpan;
      if (!lenis || span <= 0 || away < LATCH_SKIP_EPS) {
        reveal();
        return;
      }
      latchTimer = window.setTimeout(reveal, LATCH_FALLBACK_MS);
      lenis.scrollTo(experienceState.runwayStart + rest * span, {
        force: true,
        duration: LATCH_S,
        onComplete: reveal,
      });
    };

    const tick = () => {
      const progress = experienceState.scrollProgress;
      const away = Math.abs(progress - rest);
      if (!experienceState.docked) {
        if (!armed && away > REARM_EPS) armed = true;
        // Proximity catches the slow approach; the crossing test catches
        // everything else. A wheel flick moves further in one frame than
        // any sane engage band is wide, which is how the dock used to be
        // skipped outright — and skipping the dock skips the portfolio.
        else if (
          armed &&
          (away < ENGAGE_EPS || (progress - rest) * (previous - rest) < 0)
        ) {
          engage(away);
        }
      }
      previous = progress;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(latchTimer);
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
      // Nothing leaves during the grace — see UNDOCK_GRACE_MS.
      if (performance.now() - dockedAt.current < UNDOCK_GRACE_MS) return;
      experienceState.docked = false;
      setHumDucked(false);
      lenisRef?.current?.start();
      setPhase("out");
    };
    const onScrollIntent = () => {
      // Still inside the burst that got us here — not intent. Only while
      // there is momentum left to mistake it for, though: past
      // MOMENTUM_MAX_MS the pause is no longer required, or a visitor who
      // keeps scrolling is held by the very rule meant to protect them.
      if (
        performance.now() - dockedAt.current < MOMENTUM_MAX_MS &&
        scrollGap.current.gap < SCROLL_QUIET_MS
      )
        return;
      undock();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      // A held key auto-repeats every ~30 ms; that is one press, and it is
      // the keyboard's version of the same momentum problem.
      if (e.repeat) return;
      if (!UNDOCK_KEYS.includes(e.key)) return;
      if (
        e.target instanceof Node &&
        overlay.current?.contains(e.target) &&
        e.target !== overlay.current
      )
        return;
      undock();
    };
    window.addEventListener("wheel", onScrollIntent, { passive: true });
    window.addEventListener("touchmove", onScrollIntent, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("wheel", onScrollIntent);
      window.removeEventListener("touchmove", onScrollIntent);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [phase, lenisRef]);

  // Alignment is analytic from the viewport — recompute on resize (DPR
  // changes fire resize too).
  useEffect(() => {
    if (phase === "idle") return;
    const onResize = () => setDock(readDockView());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [phase]);

  // Opening anything retires the dialog for good — it asked the visitor to
  // do exactly that, and closing the window again should not bring the
  // instruction back like a scold. Driven off the store's own subscription
  // rather than a render-derived effect, and the subscription lifts as
  // soon as it has fired.
  useEffect(() => {
    if (hintSeen) return;
    return subscribeWin98(() => {
      if (!allWindowsIdle()) setHintSeen(true);
    });
  }, [hintSeen]);

  const dismissHint = useCallback(() => setHintSeen(true), []);

  const idle = allWindowsIdle();

  if (phase === "idle" || !dock) return null;

  const { rect, layout } = dock;
  const shown = phase === "shown";
  const hintOpen = shown && !hintSeen && idle;
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
            position: "relative",
            width: rect.virtualW,
            height: rect.virtualH,
            transform: `scale(${rect.scaleX}, ${rect.scaleY})`,
            transformOrigin: "top left",
          }}
        >
          <Desktop scale={rect.scaleY} />
          {/* Inside the scaled box, so the dialog is drawn in the same
              virtual units as the windows it is talking about. */}
          {hintOpen && (
            <DockHint layout={layout} onDismiss={dismissHint} />
          )}
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

      {/* Everything closed/minimized → surface the way onward. Held back
          while the dialog is up: its last line already says this, and two
          copies of one instruction read as a bug. */}
      <p
        className="pointer-events-none absolute inset-x-0 bottom-[6vh] text-center font-mono text-xs tracking-widest text-ink-subtle uppercase"
        style={{
          opacity: idle && !hintOpen ? 1 : 0,
          transition: "opacity 400ms ease",
        }}
      >
        keep scrolling
      </p>
    </div>
  );
}
