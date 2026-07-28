"use client";

// Minesweeper (plan-0009 §8.2, ADR-012 §6): original implementation,
// original art. ALL rules live in src/lib/minesweeper.ts — this file holds
// no game logic, only input and paint, which is why the rules could be
// proven by simulation instead of by clicking squares.
//
// Keyboard is a first-class input, not an afterthought: arrows move a
// visible cursor, Space/Enter reveals, F flags. The whole grid is ONE tab
// stop — 81 tabbable buttons would make the rest of the shell unreachable
// for a keyboard visitor, so cells carry tabIndex -1 and the container
// owns the keys.

import { useEffect, useRef, useState } from "react";
import {
  createBoard,
  minesRemaining,
  placeMines,
  reveal,
  toggleFlag,
  type Board,
} from "@/lib/minesweeper";
import { mulberry32 } from "@/lib/prng";
import { playEggStinger } from "@/lib/audio";
import { useShellLayout } from "../shell/layoutContext";

/** Era number colours (a convention, not an asset). */
const NUMBER_INK = [
  "",
  "#0000ff",
  "#007b00",
  "#ff0000",
  "#00007b",
  "#7b0000",
  "#007b7b",
  "#000000",
  "#7b7b7b",
];

const MAX_CLOCK = 999;
/** Hold this long on touch to plant a flag (no right button to press). */
const LONG_PRESS_MS = 450;

/** Original 16×16 flag, same rect-run language as pixelIcons. */
function Flag({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} shapeRendering="crispEdges" aria-hidden="true">
      <rect x={7} y={3} width={1} height={8} fill="#2a2a2a" />
      <rect x={4} y={11} width={8} height={2} fill="#2a2a2a" />
      <rect x={5} y={10} width={6} height={1} fill="#2a2a2a" />
      <rect x={3} y={3} width={4} height={3} fill="#d40000" />
      <rect x={4} y={2} width={3} height={1} fill="#d40000" />
    </svg>
  );
}

/** Original mine — a plain round charge with a highlight. */
function Mine({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} shapeRendering="crispEdges" aria-hidden="true">
      <rect x={7} y={2} width={2} height={12} fill="#1a1a1a" />
      <rect x={2} y={7} width={12} height={2} fill="#1a1a1a" />
      <rect x={4} y={4} width={8} height={8} fill="#1a1a1a" />
      <rect x={3} y={5} width={10} height={6} fill="#1a1a1a" />
      <rect x={5} y={3} width={6} height={10} fill="#1a1a1a" />
      <rect x={5} y={5} width={2} height={2} fill="#f4f4f4" />
    </svg>
  );
}

/** Three-digit era readout — red on black, zero-padded, clamps. */
function Readout({ value, label }: { value: number; label: string }) {
  const clamped = Math.max(-99, Math.min(MAX_CLOCK, value));
  const text =
    clamped < 0
      ? `-${String(Math.abs(clamped)).padStart(2, "0")}`
      : String(clamped).padStart(3, "0");
  return (
    <span
      className="w98-sunken bg-black px-1 font-w98-mono text-[15px] leading-tight tabular-nums"
      style={{ color: "#ff2a2a" }}
      aria-label={`${label}: ${value}`}
      role="status"
    >
      {text}
    </span>
  );
}

export function Minesweeper() {
  const { touch } = useShellLayout();
  const [board, setBoard] = useState<Board>(() => createBoard());
  const [cursor, setCursor] = useState(0);
  const [clock, setClock] = useState(0);
  const grid = useRef<HTMLDivElement>(null);
  const press = useRef<number | null>(null);

  const size = board.size;
  const cell = touch ? 30 : 16;
  const playing = board.status === "playing";

  // The clock is the game's own, not a display of wall time: it starts on
  // the first reveal and freezes the moment the board resolves.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(
      () => setClock((c) => Math.min(c + 1, MAX_CLOCK)),
      1000,
    );
    return () => window.clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (board.status === "won") playEggStinger();
  }, [board.status]);

  const openAt = (index: number) => {
    setCursor(index);
    setBoard((b) =>
      // Mines are placed on the FIRST reveal, around wherever the visitor
      // chose — that is first-click safety, and it is why the board starts
      // life empty. Seeding here (not in render) keeps the component pure.
      reveal(
        b.status === "ready"
          ? placeMines(b, index, mulberry32(Date.now() >>> 0))
          : b,
        index,
      ),
    );
  };

  const flagAt = (index: number) => {
    setCursor(index);
    setBoard((b) => toggleFlag(b, index));
  };

  const reset = () => {
    setBoard(createBoard());
    setClock(0);
    setCursor(0);
    grid.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const r = Math.floor(cursor / size);
    const c = cursor % size;
    let next: number | null = null;
    if (e.key === "ArrowUp") next = (r > 0 ? r - 1 : r) * size + c;
    else if (e.key === "ArrowDown") next = (r < size - 1 ? r + 1 : r) * size + c;
    else if (e.key === "ArrowLeft") next = r * size + (c > 0 ? c - 1 : c);
    else if (e.key === "ArrowRight") next = r * size + (c < size - 1 ? c + 1 : c);
    else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      openAt(cursor);
      return;
    } else if (e.key === "f" || e.key === "F") {
      e.preventDefault();
      flagAt(cursor);
      return;
    } else return;
    e.preventDefault();
    setCursor(next);
  };

  // Touch has no right button; a long press is the era-free equivalent.
  const startPress = (index: number) => {
    if (!touch) return;
    press.current = window.setTimeout(() => {
      press.current = null;
      flagAt(index);
    }, LONG_PRESS_MS);
  };
  const endPress = (index: number, fire: boolean) => {
    if (!touch) return;
    if (press.current === null) return; // long press already flagged it
    window.clearTimeout(press.current);
    press.current = null;
    if (fire) openAt(index);
  };

  useEffect(() => () => {
    if (press.current !== null) window.clearTimeout(press.current);
  }, []);

  const face =
    board.status === "lost" ? "x_x" : board.status === "won" ? "^_^" : ":-)";

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Counter · reset · clock */}
      <div className="w98-sunken flex w-full items-center justify-between px-1 py-1">
        <Readout value={minesRemaining(board)} label="Mines remaining" />
        <button
          type="button"
          className="w98-btn font-w98 leading-none"
          style={{ height: touch ? 32 : 22, minWidth: touch ? 32 : 24, fontSize: touch ? 12 : 9 }}
          onClick={reset}
          aria-label="New game"
        >
          {face}
        </button>
        <Readout value={clock} label="Time" />
      </div>

      {/* Board — one tab stop, arrow-driven cursor inside. */}
      <div
        ref={grid}
        className="w98-sunken grid p-[2px]"
        style={{ gridTemplateColumns: `repeat(${size}, ${cell}px)` }}
        tabIndex={0}
        role="grid"
        aria-label={`Minesweeper board, ${size} by ${size}. Arrow keys move, Space reveals, F flags.`}
        onKeyDown={onKeyDown}
      >
        {board.cells.map((state, i) => {
          const isCursor = i === cursor;
          const revealed = state === "revealed";
          const mine = board.mines[i];
          const count = board.adjacent[i];
          return (
            <button
              key={i}
              type="button"
              tabIndex={-1}
              className={revealed ? "" : "w98-btn"}
              style={{
                width: cell,
                height: cell,
                fontSize: touch ? 15 : 9,
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-w98)",
                fontWeight: 700,
                color: revealed && !mine ? NUMBER_INK[count] : undefined,
                // The detonating mine is the one the era painted red.
                background:
                  revealed && mine && board.detonated === i
                    ? "#d40000"
                    : revealed
                      ? "var(--color-w98-chrome)"
                      : undefined,
                borderTop: revealed ? "1px solid var(--color-w98-chrome-dark)" : undefined,
                borderLeft: revealed ? "1px solid var(--color-w98-chrome-dark)" : undefined,
                outline: isCursor ? "1px dotted var(--color-w98-ink)" : undefined,
                outlineOffset: -2,
              }}
              aria-label={`Row ${Math.floor(i / size) + 1}, column ${(i % size) + 1}${
                state === "flagged" ? ", flagged" : revealed ? `, ${mine ? "mine" : `${count}`}` : ", hidden"
              }`}
              onClick={() => !touch && openAt(i)}
              onContextMenu={(e) => {
                e.preventDefault();
                flagAt(i);
              }}
              onPointerDown={() => startPress(i)}
              onPointerUp={() => endPress(i, true)}
              onPointerCancel={() => endPress(i, false)}
              onPointerLeave={() => endPress(i, false)}
            >
              {state === "flagged" ? (
                <Flag size={cell - 3} />
              ) : revealed && mine ? (
                <Mine size={cell - 3} />
              ) : revealed && count > 0 ? (
                count
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="font-w98 text-[8px] text-w98-ink" aria-live="polite">
        {board.status === "won"
          ? "Cleared. The board was solvable all along."
          : board.status === "lost"
            ? "Boom. Press the face to try again."
            : touch
              ? "Tap to clear · hold to flag"
              : "Click to clear · right-click or F to flag"}
      </p>
    </div>
  );
}
