// Boot sequencer (plan-0009 §3.3): drives the win98State boot machine
// through off → post (line by line) → splash → desktop. Boot doubles as
// the loader (ADR-012 §8): each POST line has a minimum-time floor and
// can additionally await real async work — a line completes when its
// work does, so fast machines still get the beat and slow ones never
// show a dead prompt. Skippable at any moment.

import { POST_LINES, SPLASH_MIN_MS } from "./bootScript";
import {
  clearPostLines,
  pushPostLine,
  setBootPhase,
} from "./win98State";

export interface BootController {
  /** Stop driving the machine (unmount) — leaves the phase where it is. */
  cancel(): void;
  /** Jump straight to the desktop (the plan's skip affordance). */
  skip(): void;
  /** Resolves when the sequence reaches the desktop (or is cancelled). */
  done: Promise<void>;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Start the boot sequence. `workByLine` optionally maps a POST line index
 * to a promise of real loading work that must settle before the next
 * line appears (4.1 hooks texture bakes / character build here).
 */
export function startBoot(
  workByLine?: Map<number, Promise<unknown>>,
): BootController {
  let cancelled = false;

  const run = async () => {
    setBootPhase("post");
    clearPostLines();
    for (let index = 0; index < POST_LINES.length; index++) {
      if (cancelled) return;
      pushPostLine(POST_LINES[index].text);
      const work = workByLine?.get(index);
      await Promise.all([
        wait(POST_LINES[index].minMs),
        // Loader contract: a failed bake must not strand the boot.
        work ? Promise.resolve(work).catch(() => undefined) : undefined,
      ]);
    }
    if (cancelled) return;
    setBootPhase("splash");
    await wait(SPLASH_MIN_MS);
    if (cancelled) return;
    setBootPhase("desktop");
  };

  const done = run();

  return {
    cancel() {
      cancelled = true;
    },
    skip() {
      cancelled = true;
      setBootPhase("desktop");
    },
    done,
  };
}
