// Shell layout (plan-0009 §7.1, ADR-012 §9): the ONE decision of "is this
// a thumb-driven shell, and what virtual space does it get?". Pure function
// of viewport + pointer class — no DOM reads in here, so both the DOM shell
// and the dock aligner can call it and can never disagree.
//
// The key choice: on touch the shell does NOT keep the 640×480 virtual
// space and shrink it to fit a phone. Fitting 640 units into 360 css px
// gives scale 0.56, which renders the era's 8px chrome type at ~4.5 css px
// — illegible. Instead the *scale* is held near the desktop dock's own
// (~1.0–1.4 css px per virtual unit) and the VIRTUAL SPACE becomes portrait:
// ~340 units wide by whatever the viewport is tall. Every existing size in
// the shell then keeps its intended apparent size, and only the chrome that
// has to be thumb-sized (title bar, buttons, taskbar) reads `touchUnit`.
//
// DESKTOP_W/H stay exactly what they were — they are the painter's CRT
// texture size (4:3, cinematic) and are untouched by any of this.

import { DESKTOP_H, DESKTOP_W } from "./win98State";

/** WCAG 2.5.5 / ADR-012 §9 "large touch targets", in css px. */
export const TOUCH_TARGET_PX = 44;

/** Desktop taskbar height in virtual units. Lives here rather than in the
 *  Taskbar component because `Window` needs it to size a maximized window,
 *  and the two drifting apart is how you get a window under the clock. */
export const DESKTOP_TASKBAR_H = 28;

/** Virtual width the touch shell aims for — one layout across all phones. */
const TOUCH_VIRTUAL_W = 340;
/** Scale band: below 1 the chrome type gets too small, above 1.4 the
 *  virtual space gets so coarse that window content stops fitting. */
const TOUCH_SCALE_MIN = 1;
const TOUCH_SCALE_MAX = 1.4;

/** A narrow window on a mouse machine still gets the touch shell — that is
 *  what makes the 360×640 / 390×844 acceptance reachable headless, where
 *  the pointer reports fine. */
const NARROW_MAX_W = 760;
/** A coarse pointer on a big screen (desk touchscreen) keeps the desktop
 *  shell: it has the room, and hover was never the only affordance. */
const COARSE_MAX_W = 1024;

export interface ShellLayout {
  /** Thumb-driven shell: solo maximized windows, big chrome, tap-to-open. */
  touch: boolean;
  /** Virtual-unit → css-px factor (Window drag divides client px by this). */
  scale: number;
  /** Shell virtual space. Desktop keeps DESKTOP_W/H exactly. */
  width: number;
  height: number;
  /** TOUCH_TARGET_PX expressed in virtual units — 0 when not touch, so a
   *  falsy check is enough at every call site. */
  touchUnit: number;
  /** Taskbar/app-bar height in virtual units. Maximized windows subtract it. */
  taskbarH: number;
}

export function isTouchShell(viewportWidth: number, coarsePointer: boolean) {
  return viewportWidth < (coarsePointer ? COARSE_MAX_W : NARROW_MAX_W);
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

/**
 * Resolve the shell's virtual space for a viewport. `scale` for the desktop
 * branch is supplied by the caller (the dock's analytic CRT-quad scale);
 * the touch branch derives its own, because it is full-screen and owes the
 * CRT quad nothing (ADR-012 §9 says mobile windows are full-screen).
 */
export function desktopLayout(scale = 1): ShellLayout {
  return {
    touch: false,
    scale,
    width: DESKTOP_W,
    height: DESKTOP_H,
    touchUnit: 0,
    taskbarH: DESKTOP_TASKBAR_H,
  };
}

export function computeShellLayout(
  viewportWidth: number,
  viewportHeight: number,
  coarsePointer: boolean,
  desktopScale = 1,
): ShellLayout {
  if (!isTouchShell(viewportWidth, coarsePointer)) {
    return desktopLayout(desktopScale);
  }
  const scale = clamp(
    viewportWidth / TOUCH_VIRTUAL_W,
    TOUCH_SCALE_MIN,
    TOUCH_SCALE_MAX,
  );
  const touchUnit = Math.round(TOUCH_TARGET_PX / scale);
  return {
    touch: true,
    scale,
    width: Math.round(viewportWidth / scale),
    height: Math.round(viewportHeight / scale),
    touchUnit,
    // App bar: one full touch target plus the raised border's breathing
    // room, so a thumb aiming at a task button can't catch the edge.
    taskbarH: touchUnit + 6,
  };
}

/** Client-side read of the current pointer class. Effects only. */
export function coarsePointer(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches
  );
}
