"use client";

// The static-floor offer (plan-0009 §7.2 — ADR-010 §2's opt-in principle,
// restated in ADR-012 §8). The ladder's terminal rung, and the ONLY rung
// that speaks: everything above it is garnish the visitor never chose, but
// leaving for the 2D floor is a different experience and gets asked.
//
// Written as a plain fixed panel rather than a period dialog on purpose.
// This is the site talking about itself, not the fiction talking — and it
// can fire during ch. 0 boot, before a Win98 desktop exists to host a
// dialog. Same register as MuteToggle, which is chrome for the same reason.
//
// It steals focus, because a message that fires while the visitor is
// scrolling and cannot be reached by keyboard is not an offer.

import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  declineFloor,
  fidelityState,
  getFidelityVersion,
  subscribeFidelity,
} from "./fidelity";
import { rememberFloorChoice } from "@/lib/gpuTier";

export function FidelityPrompt({ onAccept }: { onAccept: () => void }) {
  useSyncExternalStore(subscribeFidelity, getFidelityVersion, () => 0);
  const offering = fidelityState.offering;
  const decline = useRef<HTMLButtonElement>(null);

  // Focus the *decline* button: it is the non-destructive answer, so a
  // visitor who hits Enter on reflex keeps what they have. Escape does the
  // same — dismissing a dialog should never be the choice that changes
  // things.
  useEffect(() => {
    if (!offering) return;
    decline.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") declineFloor();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [offering]);

  if (!offering) return null;

  const accept = () => {
    rememberFloorChoice();
    onAccept();
  };

  return (
    <div
      role="alertdialog"
      aria-modal="false"
      aria-labelledby="fidelity-prompt-title"
      aria-describedby="fidelity-prompt-body"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-sm border border-line-strong bg-surface p-4 text-ink shadow-lg sm:right-4 sm:left-auto"
    >
      <p id="fidelity-prompt-title" className="text-sm font-medium">
        This is running slowly
      </p>
      <p id="fidelity-prompt-body" className="mt-1 text-sm text-ink-muted">
        Your device is struggling with the 3D scene. Want the fast, plain
        version instead? Everything here is on that page too.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={accept}
          className="rounded-sm border border-line px-3 py-1.5 text-sm hover:bg-surface-2 focus-visible:bg-surface-2"
        >
          Switch to plain
        </button>
        <button
          ref={decline}
          type="button"
          onClick={() => declineFloor()}
          className="rounded-sm border border-line px-3 py-1.5 text-sm hover:bg-surface-2 focus-visible:bg-surface-2"
        >
          Keep the 3D
        </button>
      </div>
    </div>
  );
}
