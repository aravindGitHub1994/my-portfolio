"use client";

// Taskbar (plan-0009 §3.2): Start button (frame mark, no Windows flag —
// ADR-012 §10), one button per window, fixed dusk clock (painter parity).

import {
  focusWindow,
  minimizeWindow,
  setStartMenuOpen,
  win98State,
} from "@/lib/win98State";
import { PixelIcon } from "../pixelIcons";
import { useShellLayout } from "./layoutContext";

/** The site's own 2×2 frame mark (poster/painter pastiche). */
function FrameMark() {
  return (
    <svg viewBox="0 0 12 12" width={11} height={11} aria-hidden="true">
      <g stroke="currentColor" strokeWidth={1.6} fill="none">
        <rect x={1} y={1} width={10} height={10} />
        <path d="M6 1 V11 M1 6 H11" />
      </g>
    </svg>
  );
}

export function Taskbar() {
  const { windows, focusId, startMenuOpen } = win98State;
  const { touch, touchUnit, taskbarH } = useShellLayout();
  // One control height for the whole bar, so Start, task buttons and the
  // clock stay on a single baseline at either size.
  const ctrlH = touch ? touchUnit - 6 : 20;
  return (
    // div, not <footer>: globals.css hides ALL footers while the
    // experience is mounted (the floor-hiding rule) — a footer taskbar
    // vanishes with them.
    <div
      role="toolbar"
      aria-label="Taskbar"
      className="w98-raised absolute bottom-0 left-0 z-40 flex w-full items-center gap-1 px-1"
      style={{ height: taskbarH }}
    >
      <button
        type="button"
        className="w98-btn flex items-center gap-1 px-1.5 font-w98"
        style={{ height: ctrlH, fontSize: touch ? 12 : 9 }}
        data-pressed={startMenuOpen}
        aria-expanded={startMenuOpen}
        onClick={() => setStartMenuOpen(!startMenuOpen)}
      >
        <FrameMark />
        Start
      </button>
      <div
        className="mx-0.5 w-px bg-w98-chrome-dark"
        style={{ height: ctrlH - 2 }}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-1 gap-1">
        {windows.map((win) => {
          const active = focusId === win.id && !win.minimized;
          return (
            <button
              key={win.id}
              type="button"
              className="w98-btn flex max-w-[120px] flex-1 items-center gap-1 px-1 font-w98"
              style={{ height: ctrlH, fontSize: touch ? 11 : 8 }}
              data-pressed={active}
              onClick={() =>
                active ? minimizeWindow(win.id) : focusWindow(win.id)
              }
            >
              <PixelIcon glyph={win.glyph} size={touch ? 16 : 12} />
              <span className="truncate">{win.title}</span>
            </button>
          );
        })}
      </div>
      {/* The clock is the first thing to go at 340 virtual units — it is
          set dressing, and the task buttons are the bar's actual job. */}
      {!touch && (
        <time className="w98-sunken flex h-[20px] items-center px-2 font-w98 text-[8px] text-w98-ink">
          6:47 PM
        </time>
      )}
    </div>
  );
}
