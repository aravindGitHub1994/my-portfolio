"use client";

import { useCallback, useEffect, useState } from "react";
import LensScene from "./LensScene";
import { markLensReady } from "./lensState";
import { detectTier } from "@/lib/gpuTier";

// One auto-downgrade per page load (ADR-009 §3) — after "Back to full" the
// user has overruled the watchdog, and it must not drop the tier a second
// time. Module-level so the high→low→high remount of FpsWatchdog can't reset
// it; read/written only inside the onSlow callback, never during render
// (react-compiler purity).
let watchdogFired = false;

/**
 * Downgrade notice (ADR-009 §3): shown once when the FPS watchdog drops an
 * auto-selected high tier to low. "Back to full" restores high (the watchdog
 * won't fire again); × keeps low. Deliberately no localStorage — every visit
 * starts high and re-measures real frames.
 */
function FidelityNotice({
  onRestore,
  onDismiss,
}: {
  onRestore: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Visual quality reduced"
      className="pointer-events-auto fixed right-5 bottom-5 z-50 flex max-w-sm items-center gap-4 rounded-lg border border-line bg-surface px-4 py-3 shadow-[0_8px_32px_-12px_var(--color-glow)]"
    >
      <p className="text-sm text-ink-muted">
        Switched to the basic version for smoothness.
      </p>
      <button
        type="button"
        onClick={onRestore}
        className="shrink-0 text-sm font-medium text-accent-bright transition-colors duration-200 hover:text-accent-soft focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        Back to full
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="-m-1 shrink-0 p-1 text-ink-subtle transition-colors duration-200 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M2 2l10 10M12 2L2 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Client-only root that owns the fidelity tier as state (ADR-009 §3) — it
 * reaches the page via LensCanvas's ssr:false dynamic import, so tier
 * detection (which probes a GL context) runs in the lazy useState
 * initializer on the client only, never in the prerender. The scene's FPS
 * watchdog can hot-swap an auto-selected high down to low — the Canvas
 * itself never remounts, so scene continuity survives the swap.
 */
export default function LensRoot() {
  const [detection] = useState(detectTier);
  const [tier, setTier] = useState(detection.tier);
  const [noticeVisible, setNoticeVisible] = useState(false);

  useEffect(() => {
    console.info(
      `[lens] fidelity tier: ${detection.tier} (override with ?tier=)`,
    );
    // Without WebGL there is no canvas — unblock the loader anyway.
    if (detection.tier === "none") markLensReady();
  }, [detection]);

  const handleSlow = useCallback(() => {
    if (watchdogFired) return;
    watchdogFired = true;
    setTier("low");
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
          onRestore={() => {
            setTier("high");
            setNoticeVisible(false);
          }}
          onDismiss={() => setNoticeVisible(false)}
        />
      )}
    </>
  );
}
