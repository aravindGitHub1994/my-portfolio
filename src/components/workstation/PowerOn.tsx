"use client";

// Chapter 0 entry overlay (plan-0009 §4.1, ADR-012 §5): the site opens
// dark; pressing the glowing power button is the visitor's one deliberate
// gesture — it unlocks audio (6.1) and starts the boot
// sequencer. Scroll stays parked (Lenis stopped) until the desktop
// settles; ch. 0 auto-plays and never scrubs. Returning visitors
// (localStorage) get a skip affordance.

import { useEffect, useRef, useState } from "react";
import { useLenisRef } from "@/components/LenisProvider";
import { startBoot, type BootController } from "@/lib/bootSequencer";
import { unlockAudio } from "@/lib/audio";

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

  // Park scroll at the top while the entry owns the frame.
  useEffect(() => {
    if (stage === "done") return;
    const lenis = lenisRef?.current;
    lenis?.scrollTo(0, { immediate: true });
    lenis?.stop();
    return () => lenis?.start();
  }, [lenisRef, stage]);

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

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center transition-opacity duration-700 ${
        stage === "booting" ? "pointer-events-none opacity-0" : "bg-bg/95"
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        <button
          type="button"
          autoFocus
          onClick={press}
          aria-label="Press power"
          className="group flex h-24 w-24 items-center justify-center rounded-full border border-line-strong bg-surface transition-shadow duration-500 hover:shadow-[0_0_45px_var(--color-glow)] focus-visible:shadow-[0_0_45px_var(--color-glow)]"
        >
          {/* Power glyph — ring + stem. */}
          <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
            <g
              fill="none"
              stroke="var(--color-accent-bright)"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 3v8" />
              <path d="M6.6 6.2a8 8 0 1 0 10.8 0" />
            </g>
          </svg>
        </button>
        <p className="font-mono text-xs tracking-widest text-ink-subtle uppercase">
          press power
        </p>
        {returning && (
          <button
            type="button"
            onClick={skip}
            className="font-mono text-xs text-ink-muted underline underline-offset-4 hover:text-ink"
          >
            skip intro
          </button>
        )}
      </div>
    </div>
  );
}
