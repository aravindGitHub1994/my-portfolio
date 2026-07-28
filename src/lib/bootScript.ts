// Boot script content (plan-0009 §3.3, ADR-012 §5 ch. 0): the BIOS POST
// counts the owner's real stats as hardware. Every number interpolates
// from stats.ts (single source of truth — no hardcoded figures); the gag
// phrasing lives here. Pure data, no DOM.

import { APPROACH_STATS } from "./stats";

export interface BootLine {
  text: string;
  /** Minimum on-screen time before the next line (work can extend it). */
  minMs: number;
}

function figure(index: number): string {
  const stat = APPROACH_STATS[index];
  return `${stat.value}${stat.suffix ?? ""}`;
}

// Index map into APPROACH_STATS (order documented there):
// 0 client accounts · 1 GMC sub-accounts · 2 websites · 3 consultants ·
// 4 projects · 5 capability areas.
export const POST_LINES: BootLine[] = [
  { text: "WORKSTATION-98 BIOS  v1.0", minMs: 280 },
  { text: "CPU: Self-taught analyst @ 1998 MHz", minMs: 240 },
  { text: `Memory: ${figure(0)} client accounts .......... OK`, minMs: 340 },
  { text: `Detecting drives: ${figure(1)} GMC sub-accounts found`, minMs: 340 },
  { text: `System bus: ${figure(2)} websites on one tagging bus`, minMs: 300 },
  { text: `Peripherals: ${figure(3)} consultants supported`, minMs: 300 },
  {
    text: `Loading portfolio: ${figure(4)} projects, ${figure(5)} capability areas`,
    minMs: 320,
  },
  { text: "", minMs: 140 },
  { text: "Starting Workstation 98 ...", minMs: 480 },
];

/** Splash hold before the desktop settles. */
export const SPLASH_MIN_MS = 1500;

/** Total auto-play floor (≈ 4.2 s — the plan's ≈5 s beat with headroom). */
export const BOOT_TOTAL_MIN_MS =
  POST_LINES.reduce((sum, line) => sum + line.minMs, 0) + SPLASH_MIN_MS;
