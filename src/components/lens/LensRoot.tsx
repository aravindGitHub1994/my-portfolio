"use client";

import { useCallback, useEffect, useState } from "react";
import LensScene from "./LensScene";
import { lensState, markLensReady } from "./lensState";
import { detectTier } from "@/lib/gpuTier";

// One watchdog prompt per page load (ADR-010 §2, reversing ADR-009 §3) —
// whichever way the user answers, they've ruled on fidelity and must not be
// asked again. Module-level so a high→low→high remount of FpsWatchdog can't
// reset it; read/written only inside the onSlow callback, never during
// render (react-compiler purity).
let watchdogFired = false;

/**
 * Opt-in downgrade prompt (ADR-010 §2): shown once when the FPS watchdog
 * detects sustained slow frames on an auto-selected high tier. Nothing
 * changes until the user answers — "Switch to basic" hot-swaps to low in
 * place, "Keep full quality" stays high. Non-modal, session-only;
 * deliberately no localStorage — every visit starts high and re-measures
 * real frames.
 */
function FidelityNotice({
  onConfirm,
  onDecline,
}: {
  onConfirm: () => void;
  onDecline: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Reduce visual quality?"
      className="pointer-events-auto fixed right-5 bottom-5 z-50 flex max-w-sm flex-col gap-3 rounded-lg border border-line bg-surface px-4 py-3 shadow-[0_8px_32px_-12px_var(--color-glow)]"
    >
      <p className="text-sm text-ink-muted">
        This page is running below full speed. Switch to the basic version
        for smoothness?
      </p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onConfirm}
          className="shrink-0 text-sm font-medium text-accent-bright transition-colors duration-200 hover:text-accent-soft focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          Switch to basic
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="shrink-0 text-sm text-ink-subtle transition-colors duration-200 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          Keep full quality
        </button>
      </div>
    </div>
  );
}

/**
 * Client-only root that owns the fidelity tier as state (ADR-009 §3) — it
 * reaches the page via LensCanvas's ssr:false dynamic import, so tier
 * detection (which probes a GL context) runs in the lazy useState
 * initializer on the client only, never in the prerender. On sustained slow
 * frames the scene's FPS watchdog prompts (ADR-010 §2); a confirmed switch
 * hot-swaps an auto-selected high down to low — the Canvas itself never
 * remounts, so scene continuity survives the swap.
 */
export default function LensRoot() {
  const [detection] = useState(detectTier);
  const [tier, setTier] = useState(detection.tier);
  const [noticeVisible, setNoticeVisible] = useState(false);

  // Mirror the tier into lensState so DOM-side effects (e.g. the shard
  // window assembly, ADR-010 §3) can tell whether beams exist.
  useEffect(() => {
    lensState.fidelityTier = tier;
  }, [tier]);

  useEffect(() => {
    console.info(
      `[lens] fidelity tier: ${detection.tier} (override with ?tier=)`,
    );
    // Without WebGL there is no canvas — unblock the loader anyway.
    if (detection.tier === "none") markLensReady();
  }, [detection]);

  // ADR-010 §2: the watchdog only ASKS — no tier change until the user
  // confirms. Declining keeps high and never re-prompts this load.
  const handleSlow = useCallback(() => {
    if (watchdogFired) return;
    watchdogFired = true;
    setNoticeVisible(true);
  }, []);

  if (tier === "none") return null;

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
      >
        <LensScene
          tier={tier}
          onSlow={tier === "high" && detection.auto ? handleSlow : undefined}
        />
      </div>
      {noticeVisible && (
        <FidelityNotice
          onConfirm={() => {
            setTier("low");
            setNoticeVisible(false);
          }}
          onDecline={() => setNoticeVisible(false)}
        />
      )}
    </>
  );
}
