"use client";

// Chapter 0 entry (plan-0009 §4.1, ADR-012 §5; recomposed by ADR-013 §3).
// The film opens on a macro of the tower's power button in a dark room.
// Pressing it is the visitor's one deliberate gesture — it unlocks audio
// (6.1) and starts the boot sequencer. Scroll stays parked (Lenis stopped)
// until the desktop settles; the boot auto-plays and never scrubs.
// Returning visitors (localStorage) get a skip affordance, and as of gate
// 3.3 §4.3 every visitor is *told* that any key skips the intro.
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
import {
  armPowerPress,
  attachPowerContact,
  forcePowerContact,
  notePowerPressBooted,
  requestPowerPress,
  resetPowerPress,
  skipPowerPress,
} from "@/lib/powerPress";

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
// **These two are a shot, and no agent can judge a shot — they are the
// first thing to retune at gate 2.4.**
const POST_MS = BOOT_TOTAL_MIN_MS - SPLASH_MIN_MS;
/** Beat on the lit LED before the camera moves — the payoff of the press
 *  wants a moment to land before the frame changes. ~300 ms. */
const PAN_HOLD_MS = POST_MS * 0.11;
/** Travel time, seconds. ~1.2 s. */
const PAN_DURATION_S = (POST_MS * 0.44) / 1000;

export function PowerOn() {
  const lenisRef = useLenisRef();
  const [stage, setStage] = useState<"idle" | "booting" | "done">("idle");
  // ssr:false tree — localStorage is safe in the lazy initializer (the
  // same pattern as WorkstationExperience's detectTier).
  const [returning] = useState(
    () => window.localStorage.getItem(SEEN_KEY) === "1",
  );
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

  /** Where chapter 0 comes to rest, in page pixels — the phosphor close-up
   *  the boot pan is heading for. Read from the runway geometry
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
    // Its own gesture (returning visitors can click skip without ever
    // pressing power) — the shell still needs audio. Idempotent.
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
  // §2.3 lists the path but it had never existed; the only skip was the
  // returning visitor's link, and that is disabled the moment the overlay
  // fades).
  //
  // **It no longer hides.** Gate 3.3 §4.3 asked whether the hatch should
  // announce itself and the owner said yes, on the entry frame — so the
  // copy is at the bottom of the shot below, and *not* over the boot, where
  // a line of text would sit on top of the POST and the splash for fifteen
  // seconds and undo what 2.2 bought.
  //
  // Announcing it there is what forces the key path to be live at `idle`
  // too: copy that promises a skip has to be true where it is read. So the
  // keys are armed from the moment the entry mounts, and the same `skip()`
  // the returning visitor's link calls does the work — a first-time key
  // skip is the never-pressed path that link already exercised.
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
  // The pointer half stays boot-only, and stays unannounced. Before the
  // press the frame is "a dark room and one glowing button" and the ring is
  // the only thing in it that answers a pointer; a stray click on the
  // backdrop losing the whole opening would be a worse trade than the one
  // §4.3 asked for. Only the announced key path is live at `idle`.
  useEffect(() => {
    if (stage !== "booting") return;
    const onPointer = (e: PointerEvent) => {
      // The mute toggle is reachable throughout the boot by design; a
      // click on it is that control's, not a skip.
      const target = e.target as Element | null;
      if (target?.closest("button, a, [role='button']")) return;
      skipRef.current();
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [stage]);

  if (stage === "done") return null;

  const fading = stage === "booting";

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-40 transition-opacity duration-700 ${
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

      {/* Instruction and the returning-visitor skip stay parked at the
          bottom of the frame: they are page furniture, and letting them
          ride the projected anchor would jitter text against the scene. */}
      <div className="absolute inset-x-0 bottom-[12vh] flex flex-col items-center gap-3">
        {/* The instruction and its escape hatch are one block, tighter than
            the gap to the returning visitor's link: one thing to do, one
            way out of it. */}
        <div className="flex flex-col items-center gap-1.5">
          <p className="font-mono text-xs tracking-widest text-ink uppercase [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
            press power
          </p>
          {/* Gate 3.3 §4.3 — the owner's call: the skip announces itself,
              here on the entry frame rather than over the boot. Muted and
              lower-case so it reads as the way out, not as the invitation. */}
          <p className="font-mono text-xs text-ink-muted [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
            any key skips the intro
          </p>
        </div>
        {returning && (
          <button
            type="button"
            onClick={skip}
            disabled={fading}
            className="pointer-events-auto font-mono text-xs text-ink-muted underline underline-offset-4 [text-shadow:0_1px_3px_rgba(0,0,0,0.9)] hover:text-ink"
          >
            skip intro
          </button>
        )}
      </div>
    </div>
  );
}
