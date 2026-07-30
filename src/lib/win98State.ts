// Win98 shell state (plan-0009 §3.1, ADR-012 Architecture): ONE store
// consumed by both renderers — the cinematic canvas painter (3.1) and the
// docked DOM shell (3.2) — so the 4.2 dock swap is a view change, not a
// state handoff. Module singleton + subscribe: mutations notify listeners
// so redraws are event-driven, never per-frame. No three.js/DOM imports —
// transitions stay pure and unit-testable without a canvas.

export type BootPhase =
  | "off"
  | "post"
  | "splash"
  | "desktop"
  | "shutdown"
  | "bsod";

/** Legal forward order of the boot machine (shutdown and bsod are jumps,
 *  not steps — neither appears here, so nextBootPhase refuses to walk into
 *  or out of them and the 8.1 gag can only be entered/left deliberately). */
export const BOOT_ORDER: readonly BootPhase[] = [
  "off",
  "post",
  "splash",
  "desktop",
];

/** Pure transition: next phase along the boot path, or null at the end. */
export function nextBootPhase(phase: BootPhase): BootPhase | null {
  const index = BOOT_ORDER.indexOf(phase);
  if (index < 0 || index === BOOT_ORDER.length - 1) return null;
  return BOOT_ORDER[index + 1];
}

export type IconGlyph =
  | "computer"
  | "folder"
  | "document"
  | "notepad"
  | "envelope"
  | "globe"
  | "bin"
  | "mine"
  | "gallery";

export interface Win98Icon {
  id: string;
  label: string;
  glyph: IconGlyph;
  /** Desktop grid cell — column then row, top-left origin. */
  col: number;
  row: number;
}

export interface Win98Window {
  id: string;
  /** App identity the 5.x windows key their content off. */
  appId: string;
  title: string;
  glyph: IconGlyph;
  /** Geometry in DESKTOP_W×DESKTOP_H virtual units (both renderers scale). */
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
}

/** Virtual desktop space shared by painter and DOM shell. */
export const DESKTOP_W = 640;
export const DESKTOP_H = 480;

/** Desktop icon set per the ADR-012 §6 metaphor map. Apps wire in 5.x/8.x. */
const DEFAULT_ICONS: Win98Icon[] = [
  { id: "my-computer", label: "My Computer", glyph: "computer", col: 0, row: 0 },
  { id: "my-projects", label: "My Projects", glyph: "folder", col: 0, row: 1 },
  { id: "resume-doc", label: "resume.doc", glyph: "document", col: 0, row: 2 },
  { id: "about-me", label: "ABOUT_ME.txt", glyph: "notepad", col: 0, row: 3 },
  { id: "outlook", label: "Outlook Express", glyph: "envelope", col: 0, row: 4 },
  { id: "my-pictures", label: "My Pictures", glyph: "gallery", col: 0, row: 5 },
  { id: "linkedin", label: "LinkedIn", glyph: "globe", col: 1, row: 0 },
  { id: "github", label: "GitHub", glyph: "globe", col: 1, row: 1 },
  { id: "minesweeper", label: "Minesweeper", glyph: "mine", col: 1, row: 2 },
  { id: "recycle-bin", label: "Recycle Bin", glyph: "bin", col: 1, row: 5 },
];

export interface Win98State {
  phase: BootPhase;
  /** POST lines currently on screen (3.3 sequencer pushes them). */
  postLines: string[];
  icons: Win98Icon[];
  /** Z-order list — LAST entry is topmost. */
  windows: Win98Window[];
  /** Focused window id (normally the topmost non-minimized one). */
  focusId: string | null;
  startMenuOpen: boolean;
  /** What the visitor did to earn the 8.1 crash — the BSOD's opening line.
   *  Null whenever the phase isn't "bsod". */
  bsodReason: string | null;
  /** Touch shells run ONE window at a time, maximized (ADR-012 §9). Lives
   *  in the store, not the view, so opening from anywhere (icon, Start
   *  menu, an app's own link) obeys it without each call site knowing. */
  solo: boolean;
  /** Bumped on every mutation — 3.2's useSyncExternalStore snapshot key. */
  version: number;
}

export const win98State: Win98State = {
  phase: "off",
  postLines: [],
  icons: DEFAULT_ICONS,
  windows: [],
  focusId: null,
  startMenuOpen: false,
  bsodReason: null,
  solo: false,
  version: 0,
};

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeWin98(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  win98State.version++;
  for (const listener of listeners) listener();
}

// ---------------------------------------------------------------- actions

/** Step the boot machine one phase forward (no-op past "desktop"). */
export function advanceBoot(): void {
  const next = nextBootPhase(win98State.phase);
  if (!next) return;
  win98State.phase = next;
  notify();
}

/** Jump straight to a phase (3.3's sequencer and the BSOD gag use this). */
export function setBootPhase(phase: BootPhase): void {
  if (win98State.phase === phase) return;
  win98State.phase = phase;
  if (phase !== "desktop") {
    win98State.startMenuOpen = false;
  }
  notify();
}

/**
 * Crash into the 8.1 BSOD gag. `reason` is the deadpan line naming what the
 * visitor just did; the screen reads it rather than each trigger owning its
 * own copy of the crash chrome.
 *
 * The open windows are deliberately LEFT in the store — the gag's whole joke
 * is that nothing was actually lost, and rebootFromCrash returns to the exact
 * desktop the visitor crashed. Re-crashing while already crashed is a no-op,
 * so a held key can't stack reasons.
 */
export function crashWorkstation(reason: string): void {
  if (win98State.phase === "bsod") return;
  win98State.bsodReason = reason;
  setBootPhase("bsod");
}

/** Leave the BSOD, restoring the desktop exactly as it was. */
export function rebootFromCrash(): void {
  if (win98State.phase !== "bsod") return;
  win98State.bsodReason = null;
  setBootPhase("desktop");
}

export function pushPostLine(line: string): void {
  win98State.postLines.push(line);
  notify();
}

export function clearPostLines(): void {
  if (win98State.postLines.length === 0) return;
  win98State.postLines.length = 0;
  notify();
}

const CASCADE_STEP = 26;

/**
 * Solo enforcement (7.1): the newly-raised window is maximized and every
 * other one is minimized. Minimized rather than closed, so the taskbar
 * still lists them and nothing a visitor opened is silently destroyed.
 * Mutates without notifying — callers already do.
 */
function applySolo(keepId: string): void {
  for (const win of win98State.windows) {
    if (win.id === keepId) {
      win.minimized = false;
      win.maximized = true;
    } else {
      win.minimized = true;
    }
  }
}

/**
 * Enter/leave one-window-at-a-time mode. Leaving does NOT restore the
 * windows it minimized — the taskbar is the way back, exactly as it is
 * after a manual minimize.
 */
export function setSoloWindows(solo: boolean): void {
  if (win98State.solo === solo) return;
  win98State.solo = solo;
  if (solo) {
    const top = topVisibleWindow();
    if (top) applySolo(top.id);
  }
  notify();
}

export function openWindow(
  spec: Omit<Win98Window, "x" | "y" | "minimized" | "maximized"> &
    Partial<Pick<Win98Window, "x" | "y">>,
): void {
  const existing = win98State.windows.find((w) => w.id === spec.id);
  if (existing) {
    existing.minimized = false;
    focusWindow(spec.id);
    return;
  }
  const n = win98State.windows.length;
  win98State.windows.push({
    minimized: false,
    maximized: win98State.solo,
    x: spec.x ?? 56 + ((n * CASCADE_STEP) % 140),
    y: spec.y ?? 40 + ((n * CASCADE_STEP) % 110),
    ...spec,
  });
  if (win98State.solo) applySolo(spec.id);
  win98State.focusId = spec.id;
  win98State.startMenuOpen = false;
  notify();
}

export function closeWindow(id: string): void {
  const index = win98State.windows.findIndex((w) => w.id === id);
  if (index < 0) return;
  win98State.windows.splice(index, 1);
  if (win98State.focusId === id) {
    const top = topVisibleWindow();
    win98State.focusId = top ? top.id : null;
  }
  notify();
}

/** Raise to top of z-order and focus (restores if minimized). */
export function focusWindow(id: string): void {
  const index = win98State.windows.findIndex((w) => w.id === id);
  if (index < 0) return;
  const [win] = win98State.windows.splice(index, 1);
  win.minimized = false;
  win98State.windows.push(win);
  if (win98State.solo) applySolo(id);
  win98State.focusId = id;
  notify();
}

export function minimizeWindow(id: string): void {
  const win = win98State.windows.find((w) => w.id === id);
  if (!win || win.minimized) return;
  win.minimized = true;
  if (win98State.focusId === id) {
    const top = topVisibleWindow();
    win98State.focusId = top ? top.id : null;
  }
  notify();
}

export function toggleMaximizeWindow(id: string): void {
  // Solo windows are maximized by definition — the title-bar double-click
  // must not be able to un-maximize one into a floating window a thumb
  // then has to drag.
  if (win98State.solo) return;
  const win = win98State.windows.find((w) => w.id === id);
  if (!win) return;
  win.maximized = !win.maximized;
  notify();
}

export function moveWindow(id: string, x: number, y: number): void {
  const win = win98State.windows.find((w) => w.id === id);
  if (!win) return;
  win.x = x;
  win.y = y;
  notify();
}

/** Smallest usable window (title bar + a sliver of content). */
export const WINDOW_MIN_W = 160;
export const WINDOW_MIN_H = 110;

export function resizeWindow(id: string, width: number, height: number): void {
  const win = win98State.windows.find((w) => w.id === id);
  if (!win) return;
  win.width = Math.min(Math.max(width, WINDOW_MIN_W), DESKTOP_W);
  win.height = Math.min(Math.max(height, WINDOW_MIN_H), DESKTOP_H);
  notify();
}

export function setStartMenuOpen(open: boolean): void {
  if (win98State.startMenuOpen === open) return;
  win98State.startMenuOpen = open;
  notify();
}

/**
 * Re-notify without a state mutation — a lazy app chunk arriving (5.x)
 * re-renders open windows so the registered content replaces the
 * hourglass placeholder.
 */
export function touchWin98(): void {
  notify();
}

/** Topmost window that isn't minimized, or null. */
export function topVisibleWindow(): Win98Window | null {
  for (let i = win98State.windows.length - 1; i >= 0; i--) {
    if (!win98State.windows[i].minimized) return win98State.windows[i];
  }
  return null;
}

/** Every window closed or minimized — 4.2's "keep scrolling" hint cue. */
export function allWindowsIdle(): boolean {
  return topVisibleWindow() === null;
}
