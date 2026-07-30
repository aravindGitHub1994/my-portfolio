"use client";

// Gallery (plan-0010 §6.4, ADR-013 §9): the 23 photographs gate 6.2 cleared,
// as a period thumbnail grid that opens into a single-photo viewer. Every
// string, id, dimension and the grid order live in `src/lib/pictures.ts` —
// this file is input and paint only, the Minesweeper split.
//
// Chrome is borrowed rather than reinvented, as the plan asks: the toolbar and
// `w98-sunken` status line are Explorer's, and the viewer's sunken image well
// is `IEFrame`'s. Original art only, no Microsoft-derived chrome (ADR-012 §10).
//
// Three decisions worth not re-deriving:
//
//   1. **One tab stop for the grid, not 23.** Cells carry `tabIndex -1` and
//      the container owns the arrow keys — Minesweeper's precedent, and for
//      the same reason: 23 tabbable thumbnails would bury the rest of the
//      shell for a keyboard visitor.
//   2. **A single click opens a photograph**, where Explorer wants a
//      double-click. A thumbnail is a picture, not a file icon, and this is
//      also what makes the app work on touch without a second code path
//      (`Icon.tsx` already treats one tap as an open).
//   3. **Escape means "back", then "close".** `Window.tsx` closes the focused
//      window on Escape; in the viewer that key is the way back to the grid,
//      so the viewer stops it there. From the grid it bubbles and the window
//      closes, which is the plan's acceptance criterion.
//
// Nothing is fetched until the window opens: the whole app is behind
// `register54`'s chunk (ADR-012 §8), so these `<img>` tags do not exist in the
// document until a visitor asks for them, and the thumbnails are `lazy` on top
// of that. `next/image` is unavailable under a static export (ADR-001).

import { useEffect, useRef, useState } from "react";
import {
  GROUP_LABELS,
  PICTURES,
  THUMB_H,
  THUMB_W,
  pictureLabel,
  pictureSrc,
  thumbSrc,
} from "@/lib/pictures";
import { useShellLayout } from "../shell/layoutContext";

/** Grid geometry in shell virtual units. Thumbnails ship 4:3 and cropped, so
 *  the cells are even by construction — a ragged period grid reads as a broken
 *  layout rather than as variety. Touch gets fewer, larger cells: the touch
 *  shell is only ~340 units wide and every cell is also a tap target. */
const DESKTOP_GRID = { cols: 5, cellW: 80 };
const TOUCH_GRID = { cols: 3, cellW: 96 };
/** Grid gap and inset, in virtual units. Both are numbers here rather than
 *  `gap-1`/`p-2` classes because `revealRow` computes the scroll offset from
 *  them — a padding the math does not know about leaves the bottom row a few
 *  units short of visible, which is exactly what it did first time. */
const GAP = 4;
const PAD = 8;

export function Gallery() {
  const { touch, touchUnit } = useShellLayout();
  /** Index into PICTURES the grid cursor sits on (selection). */
  const [cursor, setCursor] = useState(0);
  /** Index being viewed, or null while the grid is up. */
  const [open, setOpen] = useState<number | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const viewer = useRef<HTMLDivElement>(null);

  const { cols, cellW } = touch ? TOUCH_GRID : DESKTOP_GRID;
  const cellH = Math.round((cellW * THUMB_H) / THUMB_W);
  const count = PICTURES.length;

  // Whichever surface is up owns the keys, so it owns focus. Moving it here
  // rather than into the handlers keeps the two transitions symmetrical.
  useEffect(() => {
    if (open === null) grid.current?.focus();
    else viewer.current?.focus();
  }, [open]);

  const show = (index: number) => {
    setCursor(index);
    setOpen(index);
  };

  const step = (delta: number) => {
    if (open === null) return;
    const next = Math.min(Math.max(open + delta, 0), count - 1);
    setCursor(next);
    setOpen(next);
  };

  /** Keep the cursor cell visible. The scroll is computed rather than delegated
   *  to `scrollIntoView`, which is free to scroll ancestors — and one of this
   *  window's ancestors is the journey page. */
  const revealRow = (index: number) => {
    const box = grid.current;
    if (!box) return;
    const top = PAD + Math.floor(index / cols) * (cellH + GAP);
    // Scrolling up brings the inset with it, so the top row lands off the
    // frame rather than flush against it.
    if (top < box.scrollTop + PAD) box.scrollTop = Math.max(top - PAD, 0);
    else if (top + cellH > box.scrollTop + box.clientHeight) {
      box.scrollTop = top + cellH - box.clientHeight;
    }
  };

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    let next: number | null = null;
    if (e.key === "ArrowRight") next = Math.min(cursor + 1, count - 1);
    else if (e.key === "ArrowLeft") next = Math.max(cursor - 1, 0);
    else if (e.key === "ArrowDown") next = Math.min(cursor + cols, count - 1);
    else if (e.key === "ArrowUp") next = Math.max(cursor - cols, 0);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = count - 1;
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      show(cursor);
      return;
    } else return; // Escape included: it belongs to the window.
    e.preventDefault();
    setCursor(next);
    revealRow(next);
  };

  const onViewerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") step(1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") step(-1);
    else if (e.key === "Home") show(0);
    else if (e.key === "End") show(count - 1);
    else if (e.key === "Escape") {
      // "Back to the grid", not "close the window" — see the header.
      e.stopPropagation();
      setOpen(null);
      return;
    } else return;
    e.preventDefault();
  };

  const btnStyle = touch
    ? { height: touchUnit, minWidth: touchUnit, fontSize: 12 }
    : { height: 18, fontSize: 8 };

  const current = open === null ? PICTURES[cursor] : PICTURES[open];
  const status = pictureLabel(current);

  return (
    <div className="-m-2 flex h-[calc(100%+16px)] flex-col">
      {/* Toolbar — Explorer's, with the viewer's controls in place of Back/Up. */}
      <div className="flex shrink-0 items-center gap-1 p-1">
        {open === null ? (
          <>
            <span className="font-w98 text-[8px] text-w98-ink">Folder</span>
            <span className="w98-sunken flex-1 truncate bg-w98-field px-1 py-0.5 font-w98-mono text-[11px] leading-none text-w98-ink">
              C:\My Pictures
            </span>
          </>
        ) : (
          <>
            <button
              type="button"
              className="w98-btn px-2 font-w98"
              style={btnStyle}
              onClick={() => setOpen(null)}
            >
              Back
            </button>
            <button
              type="button"
              className="w98-btn px-2 font-w98"
              style={{ ...btnStyle, opacity: open === 0 ? 0.5 : 1 }}
              disabled={open === 0}
              aria-label="Previous photograph"
              onClick={() => step(-1)}
            >
              &lt;
            </button>
            <button
              type="button"
              className="w98-btn px-2 font-w98"
              style={{ ...btnStyle, opacity: open === count - 1 ? 0.5 : 1 }}
              disabled={open === count - 1}
              aria-label="Next photograph"
              onClick={() => step(1)}
            >
              &gt;
            </button>
            <span className="ml-1 truncate font-w98 text-[8px] text-w98-ink">
              {GROUP_LABELS[current.group]}
            </span>
          </>
        )}
      </div>

      {open === null ? (
        /* The grid — one tab stop, arrow-driven cursor inside. */
        <div
          ref={grid}
          className="w98-field grid min-h-0 flex-1 justify-start overflow-auto"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${cellW}px)`,
            gridAutoRows: cellH,
            alignContent: "start",
            gap: GAP,
            padding: PAD,
          }}
          tabIndex={0}
          role="grid"
          aria-label={`My Pictures, ${count} photographs in ${cols} columns. Arrow keys move, Enter opens.`}
          onKeyDown={onGridKeyDown}
        >
          {PICTURES.map((picture, i) => (
            <button
              key={picture.id}
              type="button"
              tabIndex={-1}
              className="w98-sunken block overflow-hidden p-0"
              style={{
                width: cellW,
                height: cellH,
                outline:
                  i === cursor ? "1px dotted var(--color-w98-ink)" : undefined,
                outlineOffset: -3,
              }}
              aria-label={`${i + 1} of ${count}: ${pictureLabel(picture)}`}
              onClick={() => show(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static export (ADR-001): next/image needs a server */}
              <img
                src={thumbSrc(picture.id)}
                alt=""
                width={THUMB_W}
                height={THUMB_H}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="block h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : (
        /* The viewer — the photograph, whole, in a sunken well. */
        <div
          ref={viewer}
          className="w98-field flex min-h-0 flex-1 items-center justify-center overflow-hidden p-1"
          tabIndex={0}
          role="group"
          aria-label={`Photograph ${open + 1} of ${count}. Left and right arrows change photograph, Escape returns to the grid.`}
          onKeyDown={onViewerKeyDown}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- static export (ADR-001): next/image needs a server */}
          <img
            key={current.id}
            src={pictureSrc(current.id)}
            alt={pictureLabel(current)}
            width={current.width}
            height={current.height}
            loading="lazy"
            decoding="async"
            draggable={false}
            // The element IS the well and `object-contain` letterboxes the
            // photograph inside it. Sizing it by `max-w/max-h` instead leaves
            // the used width to the flex algorithm, which is how you get a
            // box that is browser-dependent for no benefit — the width and
            // height attributes above already declare the ratio, so nothing
            // shifts while the file is in flight.
            className="h-full w-full object-contain"
          />
        </div>
      )}

      {/* Status bar — the caption always renders (gate 6.2 §1.3). */}
      <div className="mt-[2px] flex shrink-0 items-stretch gap-[2px]">
        <span
          className="w98-sunken min-w-0 flex-1 truncate px-1 py-0.5 font-w98 text-[8px] text-w98-ink"
          aria-live="polite"
        >
          {status}
        </span>
        {/* The count clears the resize grip on its right — the grip is drawn
            over this row's corner, and "23 object(s)" underneath it reads as
            "23 object". */}
        <span className="w98-sunken shrink-0 py-0.5 pr-4 pl-1 font-w98 text-[8px] text-w98-ink">
          {open === null ? `${count} object(s)` : `${open + 1} of ${count}`}
        </span>
      </div>
    </div>
  );
}
