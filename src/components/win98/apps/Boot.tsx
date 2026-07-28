"use client";

// DOM boot/shutdown screens (plan-0009 §3.3): the painter phases,
// mirrored in real DOM for docked replay parity (ADR-012 §4 — both
// renderers read the same win98State). Optional onSkip fires on any
// key/click — 4.1's entry overlay decides whether skipping is offered.

import { win98State, DESKTOP_H, DESKTOP_W } from "@/lib/win98State";
import { useWin98Version } from "../shell/useWin98";

function FrameMark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 12 12" width={size} height={size} aria-hidden="true">
      <g stroke="currentColor" strokeWidth={1.4} fill="none">
        <rect x={1} y={1} width={10} height={10} />
        <path d="M6 1 V11 M1 6 H11" />
      </g>
    </svg>
  );
}

export function Boot({ onSkip }: { onSkip?: () => void }) {
  useWin98Version();
  const { phase, postLines } = win98State;

  const interactive = onSkip
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick: onSkip,
        onKeyDown: (e: React.KeyboardEvent) => {
          e.preventDefault();
          onSkip();
        },
        "aria-label": "Skip boot sequence",
      }
    : {};

  return (
    <div
      className="relative overflow-hidden bg-black"
      style={{ width: DESKTOP_W, height: DESKTOP_H }}
      {...interactive}
    >
      {phase === "post" && (
        <pre className="m-0 px-6 py-8 font-w98-mono text-base leading-6 text-w98-chrome">
          {postLines.join("\n")}
          <span aria-hidden="true">█</span>
        </pre>
      )}

      {phase === "splash" && (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-4 text-w98-ink-invert"
          style={{
            background:
              "linear-gradient(180deg, var(--color-w98-title-a), var(--color-w98-title-b))",
          }}
        >
          <FrameMark size={56} />
          <p className="font-w98 text-2xl">workstation</p>
          <p className="font-w98 text-4xl">98</p>
        </div>
      )}

      {phase === "shutdown" && (
        <p className="flex h-full w-full items-center justify-center px-8 text-center font-w98-mono text-2xl text-w98-amber">
          It&apos;s now safe to turn off your computer.
        </p>
      )}
    </div>
  );
}
