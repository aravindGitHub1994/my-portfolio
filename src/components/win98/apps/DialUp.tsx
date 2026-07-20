"use client";

// Dial-Up Networking (plan-0009 §5.3, ADR-012 §6): the LinkedIn/GitHub
// desktop shortcuts don't just open a link — they "connect" first. A
// short scripted handshake, then the real profile.
//
// Deliberately NOT a timer-driven window.open(): by the time the gag
// finishes the user gesture is stale, so every popup blocker would eat
// it and the visitor would get a blocked-popup bar instead of a
// profile. Instead the connect step reveals (and focuses) a real
// anchor — one keystroke away, blocker-proof, and keyboard-native.
//
// Original chrome and original copy only (ADR-012 §10); the number is
// 555-01xx, the reserved-for-fiction range.

import { useEffect, useRef, useState } from "react";
import { SOCIAL_LINKS } from "@/lib/nav";
import { closeWindow, type Win98Window } from "@/lib/win98State";

/** Script beats and how long each holds, in ms. */
const STEPS: readonly { line: string; ms: number }[] = [
  { line: "Dialing 555-0198...", ms: 900 },
  { line: "Handshaking...", ms: 800 },
  { line: "Verifying username and password...", ms: 700 },
];

/** Index of the terminal (connected) step — one past the script. */
const CONNECTED = STEPS.length;

export function DialUp({ win }: { win: Win98Window }) {
  const [step, setStep] = useState(0);
  const link = useRef<HTMLAnchorElement>(null);

  // appId is "dialup-<label>"; resolve against nav.ts rather than
  // hardcoding a URL here, so the links have exactly one source.
  const key = win.appId.replace(/^dialup-/, "").toLowerCase();
  const target = SOCIAL_LINKS.find((l) => l.label.toLowerCase() === key);

  // One timeout per beat — re-armed by the step change, cleaned up on
  // unmount so a closed window can't keep advancing.
  useEffect(() => {
    if (step >= CONNECTED) return;
    const timer = setTimeout(() => setStep((s) => s + 1), STEPS[step].ms);
    return () => clearTimeout(timer);
  }, [step]);

  // Land focus on the link the moment it appears: the connect beat ends
  // with the visitor's next Enter already pointed at the profile.
  useEffect(() => {
    if (step >= CONNECTED) link.current?.focus();
  }, [step]);

  const connected = step >= CONNECTED;
  const status = connected ? "Connected at 56.6 Kbps." : STEPS[step].line;
  // Blocks fill as the handshake proceeds — period progress bar.
  const filled = Math.round(((step + (connected ? 1 : 0)) / (CONNECTED + 1)) * 12);

  if (!target) {
    // No matching entry in nav.ts — say so plainly rather than render a
    // dead button.
    return (
      <p className="font-w98 text-[9px] text-w98-ink">
        No dial-up entry is configured for this connection.
      </p>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <p className="font-w98 text-[8px] text-w98-ink" aria-live="polite">
        {status}
      </p>

      <div
        className="w98-sunken bg-w98-field p-[2px]"
        aria-hidden="true"
      >
        <div className="flex gap-[2px]">
          {Array.from({ length: 12 }, (_, i) => (
            <span
              key={i}
              className="h-[10px] flex-1"
              style={{
                background:
                  i < filled ? "var(--color-w98-select)" : "transparent",
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2">
        {connected ? (
          <a
            ref={link}
            href={target.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w98-btn h-[20px] px-3 font-w98 text-[8px] leading-[20px] text-w98-ink no-underline"
          >
            Open {target.label}
          </a>
        ) : (
          <button
            type="button"
            className="w98-btn h-[20px] px-3 font-w98 text-[8px]"
            onClick={() => setStep(CONNECTED)}
          >
            Skip
          </button>
        )}
        <button
          type="button"
          className="w98-btn h-[20px] px-3 font-w98 text-[8px]"
          onClick={() => closeWindow(win.id)}
        >
          {connected ? "Disconnect" : "Cancel"}
        </button>
      </div>
    </div>
  );
}
