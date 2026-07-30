// The press (plan-0010 §2.3, ADR-013 §2/§3) — everything between the
// visitor's click and the machine waking up.
//
// Pure: no DOM, no three.js, no timer of its own. It is ticked with a
// delta and the arm rig's contact flag, and it reaches the outside world
// through two hooks — one supplied by the in-Canvas rig (how to move an
// arm this module cannot see), one by `PowerOn` (what to do the instant
// the fingertip lands). That split keeps the whole ordering readable in
// one file while leaving the boot controller's lifetime with the component
// that mounts it.
//
// The load-bearing beat: **nothing happens on the click except the arm
// starting to move.** The boot sequencer — and with it the degauss thunk,
// the POST lines and the LED, all of which hang off win98State's phase —
// starts on CONTACT, ~0.55 s later. Audio landing on the click instead of
// on the fingertip is the one thing that would make this read as a UI
// button rather than as a hand pressing a switch.
//
// It is also the gate on the behaviour scheduler (4.1). Without one, a
// mouse reach scheduled a second before the click sends the right arm
// across the desk just as the press needs it: `busy()` stops behaviours
// OVERLAPPING, but only this stops one starting first.

export type PowerPhase =
  /** No entry gesture in this scene — every `?scene=` harness, and the
   *  journey until `PowerOn` mounts. The figure behaves normally. */
  | "absent"
  /** `PowerOn` is mounted and waiting. The figure is held: hands on the
   *  keys, no taps, no behaviours — the machine is off. */
  | "armed"
  /** Clicked. The arm is on its way to the button; nothing else yet. */
  | "reaching"
  /** Fingertip on the button. The boot started on the frame we entered. */
  | "contact"
  /** Arm on its way home, POST running. */
  | "booting"
  /** Desktop settled, or skipped. The figure is released. */
  | "done";

export const powerPressState = {
  phase: "absent" as PowerPhase,
  /** 0..1 — how far the button mesh is pushed in. The rig scales this by
   *  its own travel constant; the machine stays unitless and pure. */
  depress: 0,
};

/** How long the fingertip stays on the button, and therefore the hold the
 *  arm driver is asked for. A momentary switch, not a held one: long
 *  enough to read as a press, short enough that the arm is already on its
 *  way home before the first POST line lands. */
export const PRESS_HOLD_S = 0.45;

/** Button travel, each way. Faster than anything else in the scene, because
 *  a switch snaps rather than eases. */
const DEPRESS_S = 0.07;

/** Failsafe. If contact is never reported the press must still boot the
 *  machine: `Figure` disables poses outright when the rig pivots are
 *  missing, and a scene with no figure in it reports nothing at all.
 *  Comfortably past the driver's 0.55 s ease-in, so it never pre-empts a
 *  working arm. */
const REACH_TIMEOUT_S = 1.4;

/** How the rig moves the arm. Registered by the in-Canvas component that
 *  can see the driver; absent in a scene with no figure. */
export interface PowerArmHooks {
  /** Send the right arm to the button and hold `holdS` seconds. */
  reach(holdS: number): void;
  /** Bring it home now — the skip path, which must never strand a hand
   *  mid-reach. */
  release(): void;
}

let arm: PowerArmHooks | null = null;
let onContact: (() => void) | null = null;
let t = 0;

/** Called by the rig on mount. Returns a detach fn (`attachShellCues`'s
 *  shape) so the singleton cannot outlive the component that filled it. */
export function attachPowerArm(hooks: PowerArmHooks): () => void {
  arm = hooks;
  return () => {
    if (arm === hooks) arm = null;
  };
}

/** Called by `PowerOn`: what to run the instant the fingertip lands. This
 *  is where the boot sequencer starts, which is why the thunk, the POST
 *  and the LED all arrive on contact without a second timeline to keep in
 *  sync with this one. */
export function attachPowerContact(fn: () => void): () => void {
  onContact = fn;
  return () => {
    if (onContact === fn) onContact = null;
  };
}

/** `PowerOn` mounted: the machine is off and the figure knows it. */
export function armPowerPress(): void {
  if (powerPressState.phase !== "absent") return;
  powerPressState.phase = "armed";
  powerPressState.depress = 0;
  t = 0;
}

/** The click. Deliberately does nothing but start the arm moving. */
export function requestPowerPress(): void {
  if (powerPressState.phase !== "armed") return;
  powerPressState.phase = "reaching";
  t = 0;
  arm?.reach(PRESS_HOLD_S);
}

/** Contact, out of band — the liveness net `PowerOn` holds in case the rig
 *  never ticks at all. A click that fails to boot the machine leaves the
 *  visitor staring at a dark room with nothing to do, so this path exists
 *  even though nothing is expected to use it. */
export function forcePowerContact(): void {
  if (powerPressState.phase !== "reaching") return;
  enterContact();
}

/** Returning visitor's `skip intro`, or any other jump straight to the
 *  desktop. The arm comes home rather than freezing wherever it was. */
export function skipPowerPress(): void {
  if (powerPressState.phase === "absent") return;
  if (powerPressState.phase === "reaching" || powerPressState.phase === "contact") {
    arm?.release();
  }
  powerPressState.phase = "done";
  powerPressState.depress = 0;
  t = 0;
}

/** The desktop settled. Releases the figure. */
export function notePowerPressBooted(): void {
  if (powerPressState.phase === "absent" || powerPressState.phase === "done") return;
  powerPressState.phase = "done";
  powerPressState.depress = 0;
}

/** `PowerOn` unmounted — back to "no entry gesture in this scene". */
export function resetPowerPress(): void {
  powerPressState.phase = "absent";
  powerPressState.depress = 0;
  t = 0;
}

/** Is the entry gesture holding the figure still? True from the moment
 *  `PowerOn` mounts until the desktop settles; false in every harness, so
 *  `?scene=full` behaves exactly as it did before 2.3. */
export function powerPressHoldsArms(): boolean {
  const { phase } = powerPressState;
  return phase !== "absent" && phase !== "done";
}

function enterContact(): void {
  powerPressState.phase = "contact";
  t = 0;
  onContact?.();
}

/** Advance the machine one frame. `armContact` is the rig's report that
 *  the right hand is actually ON the button — `armPoseState.R.contact`
 *  qualified by the pose, so a mouse reach's contact cannot trip a press.
 *
 *  Allocates nothing; safe to call every frame in every scene (it is a
 *  single comparison while the phase is "absent"). */
export function tickPowerPress(delta: number, armContact: boolean): void {
  const state = powerPressState;
  if (state.phase === "absent" || state.phase === "armed" || state.phase === "done") {
    return;
  }
  t += delta;

  if (state.phase === "reaching") {
    if (armContact || t >= REACH_TIMEOUT_S) enterContact();
    return;
  }

  const step = delta / DEPRESS_S;
  if (state.phase === "contact") {
    state.depress = Math.min(1, state.depress + step);
    // Leave on our own clock rather than on the arm's contact flag: they
    // are the same span by construction (the hold we asked for), and this
    // way the beat is identical whether or not a figure is in the scene.
    if (t >= PRESS_HOLD_S) {
      state.phase = "booting";
      t = 0;
    }
    return;
  }

  // "booting" — the switch springs back while the POST runs.
  state.depress = Math.max(0, state.depress - step);
}
