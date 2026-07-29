"use client";

// Chapter 0 entry (plan-0009 §4.1, ADR-012 §5; recomposed by ADR-013 §3).
// The film opens on a macro of the tower's power button in a dark room.
// Pressing it is the visitor's one deliberate gesture — it unlocks audio
// (6.1) and starts the boot sequencer. Scroll stays parked (Lenis stopped)
// until the desktop settles; the boot auto-plays and never scrubs.
// Returning visitors (localStorage) get a skip affordance.
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

import { useEffect, useRef, useState } from "react";
import { useLenisRef } from "@/components/LenisProvider";
import { startBoot, type BootController } from "@/lib/bootSequencer";
import { unlockAudio } from "@/lib/audio";
import { experienceState } from "@/lib/experienceState";

const SEEN_KEY = "w98-intro-seen";

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

  // Park scroll at the top while the entry owns the frame.
  useEffect(() => {
    if (stage === "done") return;
    const lenis = lenisRef?.current;
    lenis?.scrollTo(0, { immediate: true });
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

  useEffect(() => {
    return () => boot.current?.cancel();
  }, []);

  const finish = () => setStage("done");

  const press = () => {
    if (stage !== "idle") return;
    window.localStorage.setItem(SEEN_KEY, "1");
    // Unlock BEFORE startBoot: the sequencer synchronously sets phase
    // "post", which is what fires the degauss/beep cues — with no context
    // yet they would land silently. Must also stay synchronous in the
    // handler (no await ahead of it) or the gesture goes stale and the
    // autoplay policy refuses the context.
    unlockAudio();
    setStage("booting");
    boot.current = startBoot();
    void boot.current.done.then(finish);
  };

  const skip = () => {
    window.localStorage.setItem(SEEN_KEY, "1");
    // Its own gesture (returning visitors can click skip without ever
    // pressing power) — the shell still needs audio. Idempotent.
    unlockAudio();
    if (boot.current) boot.current.skip();
    else startBoot().skip();
    finish();
  };

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
        <p className="font-mono text-xs tracking-widest text-ink uppercase [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
          press power
        </p>
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
