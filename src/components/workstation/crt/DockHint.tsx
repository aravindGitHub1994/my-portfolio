"use client";

// The dock's "Getting Started" dialog (gate 9.2 fix): once the shell is
// live, say plainly that the icons are the portfolio. QA found visitors
// reaching the desk and not knowing the desk was the point.
//
// It is drawn in the shell's own virtual units as a sibling of `Desktop`
// inside DockSwap's scaled wrapper, so it inherits the CRT-quad scale and
// is pixel-consistent with the real windows — same `w98-*` chrome classes,
// same bar height and type sizes as `win98/shell/Window.tsx`.
//
// Deliberately NOT a win98State window: it exists only in the docked view,
// so it never reaches the painter, and ADR-012 §4's one-store/two-renderer
// parity is untouched. That is the precedent the "keep scrolling" hint in
// DockSwap already set.

import { playClick } from "@/lib/audio";
import type { ShellLayout } from "@/lib/shellLayout";

/** Desktop dialog width in virtual units — wide enough for the icon names
 *  to sit on one line, narrow enough to leave the desktop readable. */
const WIDTH = 268;

export function DockHint({
  layout,
  onDismiss,
}: {
  layout: ShellLayout;
  onDismiss: () => void;
}) {
  const { touch, touchUnit, taskbarH, width, height } = layout;

  // Same chrome metrics Window.tsx uses, for the same reason: era-sized
  // controls inside a thumb-driven shell read as a mistake, not a detail.
  const barH = touch ? touchUnit + 4 : 18;
  const closeBtn = touch
    ? { height: touchUnit, width: touchUnit, fontSize: 13 }
    : { height: 13, width: 14, fontSize: 7 };
  const bodySize = touch ? 12 : 9;

  // Bottom-right on the desktop: clear of both icon columns (col 0/1 hug
  // the left edge) and above the taskbar. On touch the shell is portrait
  // and there is no room to be picky — it spans the width.
  const box = touch
    ? { left: 12, right: 12, bottom: taskbarH + 12 }
    : {
        left: Math.max(12, width - WIDTH - 16),
        width: WIDTH,
        bottom: taskbarH + 16,
      };

  const open = touch ? "Tap" : "Double-click";

  return (
    <section
      className="w98-raised absolute flex flex-col p-[3px]"
      style={{ ...box, maxHeight: height - taskbarH - 24 }}
      aria-label="Getting started"
      onKeyDown={(e) => {
        if (e.key === "Escape") onDismiss();
      }}
      // Desktop's delegated UI tick (6.1) is bound to the shell stage, and
      // this dialog is that stage's sibling — without this its buttons
      // would be the only silent ones in the shell.
      onPointerDown={(e) => {
        if (e.target instanceof Element && e.target.closest("button")) {
          playClick();
        }
      }}
    >
      <header
        className="w98-titlebar flex shrink-0 items-center gap-1 px-0.5"
        style={{ height: barH }}
      >
        <span
          className="flex-1 truncate font-w98 leading-none"
          style={{ fontSize: touch ? 12 : 8 }}
        >
          Getting Started
        </span>
        <button
          type="button"
          className="w98-btn font-w98 leading-none"
          style={closeBtn}
          aria-label="Close Getting Started"
          onClick={onDismiss}
        >
          x
        </button>
      </header>

      <div
        className="w98-field mt-[2px] min-h-0 flex-1 overflow-auto p-2 font-w98 text-w98-ink"
        style={{ fontSize: bodySize, lineHeight: 1.6 }}
      >
        <p>You&apos;re at the desk now.</p>
        <p className="mt-2">
          {open} an icon to open it — My Projects, resume.doc and
          ABOUT_ME.txt are the tour.
        </p>
        <p className="mt-2">Close everything and keep scrolling to move on.</p>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className="w98-btn font-w98 leading-none"
            style={
              touch
                ? { height: touchUnit, minWidth: touchUnit * 2, fontSize: 12 }
                : { height: 17, minWidth: 54, fontSize: 9 }
            }
            onClick={onDismiss}
          >
            OK
          </button>
        </div>
      </div>
    </section>
  );
}
