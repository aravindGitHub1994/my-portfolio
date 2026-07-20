// BSOD gag copy (plan-0009 §8.1). ALL ORIGINAL TEXT — no real crash
// strings, no Microsoft wording, no module/exception names lifted from the
// era (ADR-012 §10). The joke is a machine being solemn about nothing:
// period cadence, zero period vocabulary.
//
// Lives here rather than in either renderer because both the DOM screen
// (Bsod.tsx) and the canvas painter draw it, and a gag that reads
// differently docked vs. undocked is a bug the ADR-012 §4 parity rule
// exists to prevent. Pure data, no DOM.

/** Inverted band across the top — the only "chrome" a BSOD has. */
export const BSOD_TITLE = "Workstation";

/**
 * The body, one line per entry (blank strings are deliberate spacing).
 * `reason` is the trigger's own first line — what the visitor just did.
 */
export function bsodLines(reason: string): string[] {
  return [
    reason,
    "",
    "The workstation has stopped. This is not your fault, though it",
    "is, narrowly, your doing.",
    "",
    "* Nothing has been lost. There was never anything to lose.",
    "* The folder you were rude to has already forgiven you.",
    "* Everything you had open is still open, on the other side.",
  ];
}

/** Footer prompt — the recovery affordance, worded for both input modes. */
export const BSOD_PROMPT = "Press any key to continue _";

/** Shown for a beat after the visitor dismisses the crash (the wink). */
export const BSOD_RESTORE_LINE = "Restoring your desktop...";

/** How long the restore beat holds before the desktop returns. */
export const BSOD_RESTORE_MS = 1100;
