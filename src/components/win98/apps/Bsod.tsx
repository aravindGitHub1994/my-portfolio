"use client";

// The 8.1 BSOD gag, DOM side (painter parity lives in painter.ts —
// paintBsod; both read src/lib/bsodScript.ts so the copy cannot drift).
//
// Recovery is deliberately over-served: a window-level keydown (ANY key,
// which is the whole promise of the footer line), plus pointerdown on the
// screen itself for touch, where there is no key to press. The plan's
// acceptance names both, and a joke you can't leave is not a joke.
//
// Sizing comes from the caller, not DESKTOP_W/H: on touch the shell's
// virtual space is portrait and narrower than 640 (7.1's shellLayout), so a
// hardcoded era-width block would hang off the side of the phone shell.
// The body wraps rather than sitting in a <pre> for the same reason.

import { useEffect, useState } from "react";
import {
  BSOD_PROMPT,
  BSOD_RESTORE_LINE,
  BSOD_RESTORE_MS,
  BSOD_TITLE,
  bsodLines,
} from "@/lib/bsodScript";
import { rebootFromCrash, win98State } from "@/lib/win98State";
import { playEggStinger } from "@/lib/audio";
import { useWin98Version } from "../shell/useWin98";

export function Bsod({
  width,
  height,
  touch = false,
}: {
  width: number;
  height: number;
  touch?: boolean;
}) {
  useWin98Version();
  const { bsodReason } = win98State;
  // Local, not store: the restore beat is a view flourish on the way out,
  // and the painter has no equivalent stage to stay in parity with.
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (restoring) return;
    const dismiss = () => {
      setRestoring(true);
      // The wink is audible too — playEggStinger has been waiting since 6.2
      // for exactly this. It fires on RECOVERY, never on the crash: the
      // bright ascending bell is a reward figure and would read as
      // celebrating the visitor's misfortune on the way in.
      playEggStinger();
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [restoring]);

  useEffect(() => {
    if (!restoring) return;
    const timer = window.setTimeout(rebootFromCrash, BSOD_RESTORE_MS);
    return () => window.clearTimeout(timer);
  }, [restoring]);

  const size = touch ? 11 : 15;

  return (
    <div
      className="flex flex-col items-center justify-center overflow-hidden bg-w98-crash px-6 font-w98-mono text-w98-ink-invert"
      style={{ width, height, fontSize: size, lineHeight: 1.5 }}
      role="alertdialog"
      aria-label="The workstation has stopped"
      onPointerDown={() => !restoring && setRestoring(true)}
    >
      {restoring ? (
        <p aria-live="assertive">{BSOD_RESTORE_LINE}</p>
      ) : (
        <>
          <p className="mb-6 bg-w98-chrome px-2 text-w98-crash">
            {BSOD_TITLE}
          </p>
          <div className="w-full max-w-[520px]">
            {bsodLines(bsodReason ?? "").map((line, i) =>
              // Blank entries are the script's spacing; keep them as gaps
              // rather than collapsing, or the stanzas run together.
              line === "" ? (
                <div key={i} style={{ height: size }} />
              ) : (
                <p key={i}>{line}</p>
              ),
            )}
          </div>
          <p className="mt-8">{BSOD_PROMPT}</p>
        </>
      )}
    </div>
  );
}
