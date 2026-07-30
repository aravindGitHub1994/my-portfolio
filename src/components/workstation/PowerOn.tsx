"use client";

// Chapter 0 entry (plan-0009 §4.1, ADR-012 §5; recomposed by ADR-013 §3
// and again by ADR-014 §1). The film opens high and wide from behind the
// figure's right, on a dark room with the machine still off — the button
// is a small thing across the room, not a macro, and the ring below is
// what makes it findable.
// Pressing it is the visitor's one deliberate gesture — it unlocks audio
// (6.1) and starts the boot sequencer. Scroll stays parked (Lenis stopped)
// until the desktop settles; the boot auto-plays and never scrubs.
// Every visitor is *told* how to skip (gate 3.3 §4.3), and as of ADR-014 §6
// what they are told depends on their pointer class: a coarse pointer has
// no key to press, so it is offered a tap and the pointer skip is armed at
// `idle` for it. The returning visitor's `skip intro` link is gone.
//
// The affordance is a DOM `<button>` pinned over the projected 3D button
// rather than a raycast on the mesh: `unlockAudio()` has to run
// synchronously inside a real user gesture or the autoplay policy refuses
// the AudioContext, and the canvas sits at `-z-10` so clicks never reach
// it anyway. Keeping it in the DOM also keeps the accessible name, the
// focus ring and Enter/Space activation for free.
//
// There is no scrim any more. "A dark room and one glowing button" is the
// shot; covering it with 95 % opaque page background was the old
// composition, from when the camera opened on the glass instead.
//
// As of 2.3 the click no longer boots the machine. It starts a reach; the
// figure's right hand crosses into frame, and the boot — with it the
// degauss thunk, the POST and the LED — starts when the fingertip lands.
// `src/lib/powerPress.ts` owns that ordering; this component keeps only
// what it is uniquely able to own: the real user gesture (`unlockAudio`
// must run synchronously inside one) and the boot controller's lifetime.

import { useEffect, useRef, useState } from "react";
import { useLenisRef } from "@/components/LenisProvider";
import { startBoot, type BootController } from "@/lib/bootSequencer";
import { BOOT_TOTAL_MIN_MS, SPLASH_MIN_MS } from "@/lib/bootScript";
import { unlockAudio } from "@/lib/audio";
import { experienceState } from "@/lib/experienceState";
import { REST_POINTS } from "@/lib/chapters";
import { SITE } from "@/lib/nav";
import { coarsePointer } from "@/lib/shellLayout";
import {
  armPowerPress,
  attachPowerContact,
  forcePowerContact,
  notePowerPressBooted,
  requestPowerPress,
  resetPowerPress,
  skipPowerPress,
} from "@/lib/powerPress";

/** Marks that a visitor has been through the opening. **Write-only as of
 *  ADR-014 §6** — the returning visitor's `skip intro` link was the only
 *  thing that ever branched on it, and the owner asked for that link gone
 *  (gate 10.1 §1). Kept because it is the page's only record that the
 *  intro has been seen, and because every QA checklist in `docs/qa/` opens
 *  by clearing it; clearing it now changes nothing, which 7.1 records. */
const SEEN_KEY = "w98-intro-seen";

/** Liveness net. The press machine is ticked from inside the Canvas, so a
 *  scene that failed to mount its room would leave a click doing nothing
 *  at all — the worst failure this page has, since the visitor is looking
 *  at a dark room with no other affordance. Far past the arm's own 1.4 s
 *  reach timeout, so it only ever fires if nothing is ticking. */
const PRESS_WATCHDOG_MS = 3000;

// --- The boot pan -----------------------------------------------------
//
// Owner's call (session 18), overriding ADR-013 §2's "chapter 0 never
// scrubs during the boot": held literally, the camera stayed on the button
// for the whole boot and the POST, the drive chatter and the splash all
// played off-camera. §2 was written before there was anything on the glass
// worth seeing. So the camera now holds a beat on the lit LED and then
// pans off the button onto phosphor, and the lines are read rather than
// merely heard.
//
// It is an auto-play, not a scrub: it moves the *page*, through Lenis,
// with `force` (Lenis is stopped, so the visitor still cannot drive it).
// That means no new mechanism at all — ScrollTrigger sees the scroll,
// publishes progress, and the existing camera path does the rest. It also
// leaves the visitor genuinely parked at REST_POINTS[0] when scroll is
// handed back, rather than at a position the camera has been faking away
// from.
//
// Both numbers are fractions of the POST phase rather than absolute
// seconds, so the shot keeps its proportions if `bootScript` ever grows a
// line. The camera is on the glass by ~55 % of the POST, leaving the rest
// of the lines and the whole splash in frame.
//
// **Both numbers are settled.** They are a shot, and no agent can judge a
// shot, so they were put to the owner twice: implicitly at gate 2.4 and by
// name at gate 3.3 §4.2, where the answer was "the current config is good".
// They are chosen values now, not placeholders — do not retune them without
// a fresh ask.
const POST_MS = BOOT_TOTAL_MIN_MS - SPLASH_MIN_MS;
/** Beat on the lit LED before the camera moves — the payoff of the press
 *  wants a moment to land before the frame changes. ~300 ms. */
const PAN_HOLD_MS = POST_MS * 0.11;
/** Travel time, seconds. ~1.2 s. */
const PAN_DURATION_S = (POST_MS * 0.44) / 1000;

// --- The title card ---------------------------------------------------
//
// ADR-014 §9 moved the name and role off chapter 1 (where `TitleBeats`
// played them across a scrub) onto the entry frame, and made the name
// outlive the controls: the ring and the copy go with the overlay's
// existing 700 ms fade, the card holds a beat and dissolves over the first
// POST lines.
//
// **The dwell is bounded by the splash, not by taste.** §3a's objection was
// to text sitting on top of the POST *and the splash*; what makes this a
// narrowing rather than a reversal is that the splash stays uncovered. So
// the hard constraint is `TITLE_HOLD_MS + TITLE_FADE_MS <= POST_MS` —
// stated against the POST phase alone, deliberately ignoring the ~0.55 s
// of arm reach between the press and the boot actually starting. That
// makes the guarantee independent of how long the reach takes, including
// the `PRESS_WATCHDOG_MS` path where contact is forced 3 s late.
//
// Measured from the press, at POST_MS = 2740 ms: controls gone at 0.70 s,
// contact ~0.55 s, pan 0.85 → 2.06 s, card gone at 2.11 s, splash 3.29 s.
// That leaves 1.18 s of headroom. If the owner wants the name to hold
// longer at gate 2.4, that headroom is the honest lever — plan-0011 risk 6
// says covering the splash is not.
//
// Fractions of POST_MS, matching PAN_HOLD_MS and PAN_DURATION_S, so the
// card keeps its proportions if `bootScript` ever grows a line.
const TITLE_HOLD_MS = POST_MS * 0.22;
const TITLE_FADE_MS = POST_MS * 0.55;

export function PowerOn() {
  const lenisRef = useLenisRef();
  const [stage, setStage] = useState<"idle" | "booting" | "done">("idle");
  // Pointer class decides both the announced copy and whether the pointer
  // skip is live at `idle` (ADR-014 §6). Read once in a lazy initializer,
  // the same mechanism `ScrollHint.tsx:57` uses for the same branch: this
  // whole tree is behind `WorkstationRoot`'s `ssr: false` import, so there
  // is no hydration pass to mismatch, and reading it in an effect instead
  // would paint the wrong line of copy first and swap it — a flash of
  // "any key skips the intro" on a device with no keys.
  const [coarse] = useState(coarsePointer);
  const boot = useRef<BootController | null>(null);
  const ring = useRef<HTMLButtonElement>(null);
  const watchdog = useRef(0);
  const pan = useRef(0);

  // Park scroll at the top while the entry owns the frame. Lenis stays
  // stopped for the whole boot — the visitor cannot drive — but the reset
  // to 0 happens only BEFORE the press: once the boot pan is running,
  // snapping back to the top would fight it every render.
  useEffect(() => {
    if (stage === "done") return;
    const lenis = lenisRef?.current;
    if (stage === "idle") lenis?.scrollTo(0, { immediate: true });
    lenis?.stop();
    return () => lenis?.start();
  }, [lenisRef, stage]);

  // Follow the projected button. A rAF writing `transform` straight to the
  // element, the TitleBeats/ScrollHint pattern — the anchor changes every
  // frame the camera moves, and re-rendering to place a ring would be
  // sixty renders a second for one CSS property.
  useEffect(() => {
    if (stage === "done") return;
    let raf = 0;
    const tick = () => {
      const node = ring.current;
      if (node) {
        const anchor = experienceState.powerAnchor;
        node.style.transform = `translate(${anchor.x * window.innerWidth}px, ${
          anchor.y * window.innerHeight
        }px) translate(-50%, -50%)`;
        // Scroll is parked, so the button cannot leave the frame before it
        // is pressed; this is a guard, not a behaviour.
        node.style.opacity = anchor.onScreen ? "1" : "0";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage]);

  // Tell the figure the machine is off: hands on the keys, no taps, no
  // behaviours, until the desktop settles (2.3). Also what stops a mouse
  // reach firing a second before the click and stealing the arm the press
  // needs. Reset on unmount, so a `?scene=` harness is never held.
  useEffect(() => {
    armPowerPress();
    return resetPowerPress;
  }, []);

  /** Where chapter 0 comes to rest, in page pixels — the monitor medium the
   *  boot pan is heading for (ADR-014 §2). Read from the runway geometry
   *  `Choreography` publishes (the DockSwap pattern) rather than re-derived,
   *  so the two can never disagree about the mapping. */
  const chapterZeroPx = () => {
    const { runwayStart, runwaySpan } = experienceState;
    return runwaySpan > 0 ? runwayStart + REST_POINTS[0] * runwaySpan : -1;
  };

  // The boot starts on CONTACT, not on the click — the press machine calls
  // this the frame the fingertip lands. The controller stays here because
  // its lifetime is this component's: cancel on unmount, skip on skip.
  useEffect(() => {
    return attachPowerContact(() => {
      boot.current = startBoot();
      void boot.current.done.then(() => {
        notePowerPressBooted();
        setStage("done");
      });
      // …and the shot: hold on the lit LED, then pan onto the glass so the
      // POST is read. `force` because Lenis is stopped and must stay
      // stopped — this moves the page, the visitor still cannot.
      pan.current = window.setTimeout(() => {
        const px = chapterZeroPx();
        const lenis = lenisRef?.current;
        // No Lenis, or the runway has not published yet: skip the move
        // rather than jump-cut. The boot still plays; only the shot is
        // lost, which is the right way round.
        if (!lenis || px < 0) return;
        lenis.scrollTo(px, { duration: PAN_DURATION_S, force: true });
      }, PAN_HOLD_MS);
    });
  }, [lenisRef]);

  useEffect(() => {
    return () => {
      boot.current?.cancel();
      window.clearTimeout(watchdog.current);
      window.clearTimeout(pan.current);
    };
  }, []);


  const press = () => {
    if (stage !== "idle") return;
    window.localStorage.setItem(SEEN_KEY, "1");
    // Unlock FIRST, and synchronously: this is the only real user gesture
    // the page gets, and an await ahead of it makes the gesture stale and
    // the autoplay policy refuse the context. It has to happen here rather
    // than at contact for exactly that reason — the boot's own cues fire
    // ~0.55 s later, by which time the context is long since running.
    unlockAudio();
    setStage("booting");
    requestPowerPress();
    // Nothing else. The arm swings in; contact does the rest.
    watchdog.current = window.setTimeout(forcePowerContact, PRESS_WATCHDOG_MS);
  };

  const skip = () => {
    window.localStorage.setItem(SEEN_KEY, "1");
    // Its own gesture — a skip can happen without power ever being
    // pressed, and the shell still needs audio. Idempotent.
    unlockAudio();
    window.clearTimeout(watchdog.current);
    window.clearTimeout(pan.current);
    // Brings the arm home rather than freezing it mid-reach, and releases
    // the figure — the skip path must not strand a hand over the tower.
    skipPowerPress();
    if (boot.current) boot.current.skip();
    else startBoot().skip();
    // Land where the boot pan was going. A skip from mid-pan otherwise
    // hands scroll back at an arbitrary point inside chapter 0, and the
    // first wheel notch would then start from a frame nobody composed.
    const px = chapterZeroPx();
    if (px >= 0) {
      lenisRef?.current?.scrollTo(px, { immediate: true, force: true });
    }
    setStage("done");
  };

  // Any key or click skips the boot (owner's call, session 18 — plan-0010
  // §2.3 lists the path but it had never existed; the only skip at the time
  // was a returning visitor's link, which ADR-014 §6 has since deleted).
  //
  // **It no longer hides.** Gate 3.3 §4.3 asked whether the hatch should
  // announce itself and the owner said yes, on the entry frame — so the
  // copy is at the bottom of the shot below, and *not* over the boot, where
  // a line of text would sit on top of the POST and the splash for fifteen
  // seconds and undo what 2.2 bought.
  //
  // Announcing it there is what forces the key path to be live at `idle`
  // too: copy that promises a skip has to be true where it is read. So the
  // keys are armed from the moment the entry mounts. The same principle,
  // applied to a device with no keys, is what arms the POINTER at `idle`
  // for a coarse pointer — see the effect below.
  const skipRef = useRef<() => void>(() => {});
  // Assigned in an effect, not during render — `skip` closes over this
  // render's `stage`, and the compiler rules forbid mutating during render.
  useEffect(() => {
    skipRef.current = skip;
  });
  useEffect(() => {
    if (stage === "done") return;
    const onKey = (e: KeyboardEvent) => {
      // Modifiers and Tab are navigation, not intent — skipping on Tab
      // would punish the keyboard visitor for orienting themselves.
      if (e.key === "Tab" || e.altKey || e.ctrlKey || e.metaKey) return;
      if (["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;
      // F1–F12 belong to the browser. Cheap to exclude, and it saves the
      // reviewer from their own gate: the 3.3 checklist opens DevTools on
      // the entry frame, and F12 throwing the opening away is a trap.
      if (/^F\d{1,2}$/.test(e.key)) return;
      // Enter and Space on a focused control are that control's. The power
      // button is `autoFocus`ed, so those two keys are how a keyboard
      // visitor presses power — reading them as "skip" would take the
      // opening away from the one person who asked to see it.
      const target = e.target as Element | null;
      if ((e.key === "Enter" || e.key === " ") && target?.closest("button, a"))
        return;
      skipRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage]);
  // **On a FINE pointer the pointer half stays boot-only, and stays
  // unannounced.** Before the press the frame is "a dark room and one
  // glowing button" and the ring is the only thing in it that answers a
  // pointer; a stray click on the backdrop losing the whole opening would
  // be a worse trade than the one §4.3 asked for. Only the announced key
  // path is live at `idle`. That reasoning is unchanged and is now
  // explicitly scoped to a mouse.
  //
  // **On a COARSE pointer it inverts (ADR-014 §6).** There is no key, so
  // the announced copy above promises something the visitor cannot do, and
  // the returning visitor's link — the element the owner asked to delete —
  // was their only way out of the entry frame. §3a's own principle, *copy
  // that promises a skip has to be true where it is read*, is what forces
  // the pointer to be armed at `idle` here. So §3a is preserved where it
  // was aimed and narrowed where it does not apply.
  useEffect(() => {
    if (stage === "done") return;
    if (stage === "idle" && !coarse) return;
    const onPointer = (e: PointerEvent) => {
      // The mute toggle is reachable throughout the boot by design; a
      // click on it is that control's, not a skip.
      const target = e.target as Element | null;
      if (target?.closest("button, a, [role='button']")) return;
      skipRef.current();
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [stage, coarse]);

  if (stage === "done") return null;

  const fading = stage === "booting";

  return (
    // **The root carries no transition of its own (ADR-014 §9).** It used
    // to, and one `transition-opacity` on a common ancestor cannot give two
    // children different durations — which is exactly what the title card
    // needs. Anything reading this element's computed opacity to decide
    // whether the entry is up is now wrong; read `stage` or the children.
    <div className="pointer-events-none fixed inset-0 z-40">
      {/* The title card. Top of frame because the ring does NOT sit still:
          it tracks the projected 3D button, which after ADR-014 §1's
          recomposition lands mid-frame (NDC y -0.085 landscape, -0.052
          portrait — i.e. 53-54 % down). Top is the one band no framing puts
          it in. `aria-hidden`, following `TitleBeats`' precedent and
          ADR-012 §9: the canvas is cinematic, the content surface is the
          DOM floor. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[10vh] px-6 text-center text-balance"
        style={{
          opacity: fading ? 0 : 1,
          transitionProperty: "opacity",
          // Linear, not an ease: this is a film dissolve, and an ease-out
          // would spend most of the budget near-invisible.
          transitionTimingFunction: "linear",
          transitionDuration: `${TITLE_FADE_MS}ms`,
          transitionDelay: fading ? `${TITLE_HOLD_MS}ms` : "0ms",
        }}
      >
        <p className="font-w98-mono text-3xl text-ink [text-shadow:0_1px_3px_rgba(0,0,0,0.9)] md:text-5xl">
          {SITE.name}
        </p>
        {/* 11 px, not `text-xs`, below `sm`: at `tracking-widest` this line
            is 39 characters, which is 328 px at 12 px against the 312 px a
            360 px viewport leaves after `px-6` — a five-per-cent overflow
            and therefore a two-word orphan on line two. 11 px brings it to
            300 px and it sits on one line. `text-balance` stays as the net
            for anything narrower. */}
        <p className="mt-2 font-mono text-[11px] tracking-widest text-ink-muted uppercase [text-shadow:0_1px_3px_rgba(0,0,0,0.9)] sm:text-sm">
          {SITE.role}
        </p>
      </div>

      {/* The controls keep the overlay's original 700 ms fade. */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          fading ? "opacity-0" : "opacity-100"
        }`}
      >
      <button
        ref={ring}
        type="button"
        autoFocus
        onClick={press}
        aria-label="Press power"
        disabled={fading}
        // `left-0 top-0` + a transform is what lets the rAF place it
        // without touching layout. 96 px keeps the touch target well over
        // the 44 px floor even though the ring reads smaller.
        className="group pointer-events-auto absolute top-0 left-0 flex h-24 w-24 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-bright"
      >
        {/* The ring itself — a halo over the 3D button, not a panel. */}
        <span
          aria-hidden="true"
          className="power-ring block h-14 w-14 rounded-full border-2 border-accent-bright/80"
        />
      </button>

      {/* The instruction and its escape hatch stay parked at the bottom of
          the frame: they are page furniture, and letting them ride the
          projected anchor would jitter text against the scene. One thing to
          do, one way out of it — two lines, and as of ADR-014 §6 that is
          all, for every visitor and every pointer class. */}
      <div className="absolute inset-x-0 bottom-[12vh] flex flex-col items-center">
        <div className="flex flex-col items-center gap-1.5">
          <p className="font-mono text-xs tracking-widest text-ink uppercase [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
            press power
          </p>
          {/* Gate 3.3 §4.3 — the owner's call: the skip announces itself,
              here on the entry frame rather than over the boot. Muted and
              lower-case so it reads as the way out, not as the invitation.
              ADR-014 §6: the promise has to be true where it is read, and
              a touch visitor has no key. */}
          <p className="font-mono text-xs text-ink-muted [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
            {coarse ? "tap anywhere to skip" : "any key skips the intro"}
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
