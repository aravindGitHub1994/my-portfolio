// Dynamic resolution scaling (plan-0009 §7.1). Render fewer pixels when
// frames get long, more when there is headroom — the cheapest quality
// knob there is, and the only one that costs the visitor nothing visible
// on a phone screen at arm's length.
//
// Pure controller, no three/DOM imports: it takes frame deltas and
// returns a scale. The R3F reader (`DynamicResolution.tsx`) is the only
// thing that touches the renderer, exactly as `audio.ts` is the only
// WebAudio surface. That split is what makes the hysteresis testable
// without a GPU.
//
// DRS moves the *pixel ratio*, never the canvas element's CSS size, so
// nothing above it in the document reflows — §7.1's "scales without
// layout thrash" is a property of that choice, not of the tuning.

/** ADR-012 §9 / plan §7.1 band. Below 0.6 the CRT text stops resolving. */
export const DRS_MIN = 0.6;
export const DRS_MAX = 1;

/** Step per adjustment. Small enough that a change reads as a focus
 *  shift rather than a resolution pop. */
const DRS_STEP = 0.1;

/** Frame budget. 60 fps is the aspiration; the 30 fps floor is 7.2's. */
export const TARGET_FRAME_MS = 1000 / 60;

/** Long/short thresholds as multiples of the budget. The gap between
 *  them is the dead band — without it the controller oscillates around
 *  the target forever, which is far more visible than a stable 0.8. */
const SLOW_RATIO = 1.25;
const FAST_RATIO = 0.7;

/** EMA weight — roughly a 20-frame memory. Slow enough that one janky
 *  frame (a chunk landing, a texture upload) cannot drop the scale. */
const EMA_ALPHA = 0.05;

/** Frames to wait after a change before judging again, so the EMA is
 *  measuring the NEW scale and not the one that triggered the change. */
const COOLDOWN_FRAMES = 45;

/** Deltas above this are treated as a stall, not a slow frame: a
 *  backgrounded tab or a blocking main-thread task says nothing about
 *  GPU load, and folding it into the EMA would drop the scale on
 *  return. */
const STALL_MS = 250;

export interface DrsState {
  scale: number;
  /** Exponential moving average of frame time, ms. -1 until first sample. */
  emaMs: number;
  cooldown: number;
}

export function createDrsState(initialScale = DRS_MAX): DrsState {
  return { scale: initialScale, emaMs: -1, cooldown: COOLDOWN_FRAMES };
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

/**
 * Fold one frame into the controller. Returns true when `state.scale`
 * changed and the caller should push it to the renderer — callers should
 * NOT set the pixel ratio every frame.
 */
export function sampleDrs(
  state: DrsState,
  deltaMs: number,
  targetMs = TARGET_FRAME_MS,
): boolean {
  if (deltaMs <= 0 || deltaMs > STALL_MS) return false;

  // Seed from the BUDGET, not the first delta. The first frame after mount
  // carries shader compilation and texture uploads, so seeding from it
  // starts the average ~10x too high and spends a visible dip-and-recover
  // discovering that the device was fine all along. Starting at target
  // costs a genuinely slow device only the convergence it already owes.
  if (state.emaMs < 0) state.emaMs = targetMs;
  state.emaMs += EMA_ALPHA * (deltaMs - state.emaMs);

  if (state.cooldown > 0) {
    state.cooldown--;
    return false;
  }

  const before = state.scale;
  if (state.emaMs > targetMs * SLOW_RATIO) {
    state.scale = clamp(state.scale - DRS_STEP, DRS_MIN, DRS_MAX);
  } else if (state.emaMs < targetMs * FAST_RATIO) {
    state.scale = clamp(state.scale + DRS_STEP, DRS_MIN, DRS_MAX);
  }

  // Float steps land on values like 0.7999999999999999; the renderer does
  // not care, but the equality check below does.
  state.scale = Math.round(state.scale * 100) / 100;
  if (state.scale === before) return false;

  state.cooldown = COOLDOWN_FRAMES;
  return true;
}
