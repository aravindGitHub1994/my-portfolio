"use client";

// Master mute control (plan-0009 §6.1). Deliberately mounted at the
// experience root rather than in the Win98 system tray: the first sounds
// land during ch. 0 boot, long before the ch. 4 dock exists, so a tray
// speaker would leave a visitor unable to silence the very cue that
// startled them. Small, fixed, out of the frame's way — and it is the one
// piece of chrome allowed to sit above the CRT.

import { useSyncExternalStore } from "react";
import { isMuted, subscribeMute, toggleMuted } from "@/lib/audio";

export function MuteToggle() {
  // ssr:false tree — but getServerSnapshot is still required by the hook's
  // signature, and "muted" is the safe pre-hydration answer (silent).
  const muted = useSyncExternalStore(
    subscribeMute,
    isMuted,
    () => true,
  );

  return (
    <button
      type="button"
      onClick={toggleMuted}
      aria-pressed={muted}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      title={muted ? "Unmute sound" : "Mute sound"}
      className="fixed right-4 bottom-4 z-50 flex h-8 w-8 items-center justify-center rounded-sm border border-line text-ink-subtle opacity-40 transition-opacity hover:opacity-100 focus-visible:opacity-100"
    >
      <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Speaker cone — shared by both states. */}
          <path d="M3 6.2h2.2L8 3.8v8.4L5.2 9.8H3z" />
          {muted ? (
            <path d="M10.6 6.2l3 3.6M13.6 6.2l-3 3.6" />
          ) : (
            <>
              <path d="M10.4 6a2.8 2.8 0 0 1 0 4" />
              <path d="M12.3 4.4a5.2 5.2 0 0 1 0 7.2" />
            </>
          )}
        </g>
      </svg>
    </button>
  );
}
