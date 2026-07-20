// Audio engine (plan-0009 §6.1, ADR-012 §7 / §10).
//
// Every sound is SYNTHESIZED in WebAudio — the palette ships zero sample
// files. That is the IP posture, not a shortcut: there is no clip to
// mis-source, so "evocations, not Microsoft samples" holds by construction
// and the audio payload is 0 bytes against the slice's 1.5 MB budget. The
// startup chime is an original composition in the era's spirit (a rising
// major-ninth figure on FM bells), deliberately not a transcription of any
// shipped operating-system sound.
//
// Contracts this module keeps:
//  - **No context before the gesture.** The AudioContext is constructed
//    inside `unlockAudio()`, which only the ch. 0 power press calls.
//    Nothing here touches `window` at module scope, so the prerender and
//    the ssr:false boundary both stay safe.
//  - **No engine at all for static-floor visitors.** Guaranteed upstream:
//    the only `unlockAudio()` caller lives under WorkstationExperience,
//    which returns null for tier "static"/"none" before mounting anything.
//  - **Mute persists** in localStorage and is applied to the master bus
//    the moment the context exists.
//  - This module may import `win98State` but never the reverse — the store
//    stays pure/DOM-free per its own header contract.

import { mulberry32 } from "./prng";
import { subscribeWin98, win98State, type BootPhase } from "./win98State";

const MUTE_KEY = "w98-muted";

/** Bus trims — the room bed sits far under the UI so it never masks speech-
 *  adjacent cues, and machine noise sits between them. */
const BUS_GAIN = { ui: 0.5, machine: 0.42, room: 0.16 } as const;

/** Hum level while docked vs. free. Docked is reading, not cinema (§6.1). */
const HUM_FREE = 1;
const HUM_DUCKED = 0.35;
const HUM_DUCK_RAMP = 0.5;

type Bus = keyof typeof BUS_GAIN;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let buses: Record<Bus, GainNode> | null = null;
let humGain: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let detachCues: (() => void) | null = null;

let muted = false;
const muteListeners = new Set<() => void>();

// ------------------------------------------------------------------ mute

/** Read the persisted mute preference. Safe before unlock; browser-only. */
export function loadMutePreference(): boolean {
  try {
    muted = window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    // Private-mode / blocked storage: default to audible, never throw.
    muted = false;
  }
  return muted;
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(next: boolean): void {
  muted = next;
  try {
    window.localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  } catch {
    // Preference simply won't persist; the session still honours it.
  }
  applyMute();
  for (const listener of muteListeners) listener();
}

export function toggleMuted(): void {
  setMuted(!muted);
}

/** Subscribe to mute changes (the toggle control's useSyncExternalStore). */
export function subscribeMute(listener: () => void): () => void {
  muteListeners.add(listener);
  return () => muteListeners.delete(listener);
}

function applyMute(): void {
  if (!master || !ctx) return;
  // Short ramp rather than a hard set — an instant gain step on a running
  // hum is an audible click.
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.02);
}

// ---------------------------------------------------------------- unlock

/**
 * Build the graph and start the room bed. Called from the ch. 0 power
 * press — the visitor's one deliberate gesture, which is what satisfies
 * the autoplay policy. Idempotent: a second press just resumes.
 */
export function unlockAudio(): void {
  if (ctx) {
    void ctx.resume();
    return;
  }
  const Ctor =
    window.AudioContext ??
    (window as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  // No WebAudio (old Safari, locked-down browser): the experience is
  // silent but must not break.
  if (!Ctor) return;

  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 1;
  master.connect(ctx.destination);

  buses = {
    ui: ctx.createGain(),
    machine: ctx.createGain(),
    room: ctx.createGain(),
  };
  for (const name of Object.keys(buses) as Bus[]) {
    buses[name].gain.value = BUS_GAIN[name];
    buses[name].connect(master);
  }

  noiseBuffer = makeNoiseBuffer(ctx);
  startHum();
  // Context can start "suspended" even from a gesture on some browsers.
  void ctx.resume();
}

/** Tear down (experience unmount). Safe to call when never unlocked. */
export function disposeAudio(): void {
  detachCues?.();
  detachCues = null;
  humGain = null;
  buses = null;
  master = null;
  noiseBuffer = null;
  void ctx?.close();
  ctx = null;
}

// ------------------------------------------------------------- synthesis

/** One second of deterministic white noise, reused by every noisy cue. */
function makeNoiseBuffer(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const data = buffer.getChannelData(0);
  // Seeded, per the repo's no-Math.random house rule — also makes the
  // texture identical run to run, which QA can rely on.
  const rand = mulberry32(0x9815);
  for (let i = 0; i < data.length; i++) data[i] = rand() * 2 - 1;
  return buffer;
}

/** A gain envelope: attack to `peak`, then exponential-ish decay to zero. */
function envelope(
  bus: Bus,
  start: number,
  peak: number,
  attack: number,
  decay: number,
): GainNode | null {
  if (!ctx || !buses) return null;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peak, start + attack);
  // setTargetAtTime tails smoothly; stop the source well past the audible
  // floor so no click survives.
  gain.gain.setTargetAtTime(0.0001, start + attack, decay / 3);
  gain.connect(buses[bus]);
  return gain;
}

interface ToneSpec {
  bus: Bus;
  freq: number;
  /** Optional glide target — the pitch-drop cues use this. */
  toFreq?: number;
  type?: OscillatorType;
  peak?: number;
  attack?: number;
  decay?: number;
  /** Seconds from now. */
  delay?: number;
}

function tone({
  bus,
  freq,
  toFreq,
  type = "sine",
  peak = 0.6,
  attack = 0.004,
  decay = 0.18,
  delay = 0,
}: ToneSpec): void {
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const gain = envelope(bus, start, peak, attack, decay);
  if (!gain) return;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (toFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(toFreq, start + attack + decay);
  }
  osc.connect(gain);
  osc.start(start);
  osc.stop(start + attack + decay + 0.4);
}

interface NoiseSpec {
  bus: Bus;
  peak?: number;
  attack?: number;
  decay?: number;
  delay?: number;
  filter?: BiquadFilterType;
  freq?: number;
  q?: number;
}

function noise({
  bus,
  peak = 0.4,
  attack = 0.002,
  decay = 0.08,
  delay = 0,
  filter = "lowpass",
  freq = 1200,
  q = 1,
}: NoiseSpec): void {
  if (!ctx || !noiseBuffer) return;
  const start = ctx.currentTime + delay;
  const gain = envelope(bus, start, peak, attack, decay);
  if (!gain) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const biquad = ctx.createBiquadFilter();
  biquad.type = filter;
  biquad.frequency.value = freq;
  biquad.Q.value = q;
  src.connect(biquad).connect(gain);
  src.start(start);
  src.stop(start + attack + decay + 0.4);
}

/** FM bell voice — the chime's timbre. Modulator at a non-integer ratio
 *  gives the struck-metal edge without a sample. */
function bell(freq: number, delay: number, peak: number, decay: number): void {
  if (!ctx || !buses) return;
  const start = ctx.currentTime + delay;
  const gain = envelope("machine", start, peak, 0.01, decay);
  if (!gain) return;
  const carrier = ctx.createOscillator();
  carrier.frequency.value = freq;
  const mod = ctx.createOscillator();
  mod.frequency.value = freq * 1.41;
  const modDepth = ctx.createGain();
  modDepth.gain.setValueAtTime(freq * 1.2, start);
  modDepth.gain.setTargetAtTime(0.0001, start, decay / 4);
  mod.connect(modDepth).connect(carrier.frequency);
  carrier.connect(gain);
  carrier.start(start);
  mod.start(start);
  carrier.stop(start + decay + 0.6);
  mod.stop(start + decay + 0.6);
}

// ------------------------------------------------------------ tier-1 cues

/** Degauss thunk — the CRT's magnetic shudder as it wakes. */
export function playDegauss(): void {
  tone({ bus: "machine", freq: 92, toFreq: 38, type: "triangle", peak: 0.85, decay: 0.5 });
  noise({ bus: "machine", peak: 0.5, decay: 0.3, filter: "lowpass", freq: 240 });
}

/** Single POST beep — square, sharp, unmistakably a BIOS. */
export function playBiosBeep(): void {
  tone({ bus: "machine", freq: 1046, type: "square", peak: 0.28, attack: 0.002, decay: 0.1 });
}

/** Startup chime — original rising figure, F–A–C–G' on FM bells. */
export function playStartupChime(): void {
  bell(349.23, 0.0, 0.5, 1.1); // F4
  bell(440.0, 0.12, 0.45, 1.2); // A4
  bell(523.25, 0.24, 0.42, 1.4); // C5
  bell(783.99, 0.38, 0.5, 2.0); // G5 — the ninth, left ringing
}

/** UI click — the shell's mouse tick. */
export function playClick(): void {
  noise({ bus: "ui", peak: 0.22, attack: 0.001, decay: 0.014, filter: "bandpass", freq: 2600, q: 0.8 });
}

export function playWindowOpen(): void {
  tone({ bus: "ui", freq: 420, toFreq: 660, type: "triangle", peak: 0.18, decay: 0.1 });
}

export function playWindowClose(): void {
  tone({ bus: "ui", freq: 620, toFreq: 380, type: "triangle", peak: 0.16, decay: 0.09 });
}

/** Error ding — two-tone, the "you did a wrong" bell. */
export function playErrorDing(): void {
  bell(880, 0, 0.4, 0.5);
  bell(659.25, 0.09, 0.36, 0.8);
}

/** Shutdown — the chime's shape inverted and slowed. */
export function playShutdown(): void {
  bell(523.25, 0.0, 0.42, 1.0);
  bell(392.0, 0.16, 0.4, 1.2);
  bell(261.63, 0.34, 0.45, 1.9);
}

// --------------------------------------------------------------- room bed

/** Low CRT hum bed: mains 60 Hz + its 120 Hz harmonic, plus a whisper of
 *  filtered noise for the room. Runs for the life of the context; level is
 *  what changes (ducking), never the node graph. */
function startHum(): void {
  if (!ctx || !buses) return;
  humGain = ctx.createGain();
  humGain.gain.value = HUM_FREE;
  humGain.connect(buses.room);

  for (const [freq, level] of [
    [60, 0.5],
    [120, 0.22],
  ] as const) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.value = level;
    osc.connect(gain).connect(humGain);
    osc.start();
  }

  if (noiseBuffer) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    src.connect(lp).connect(gain).connect(humGain);
    src.start();
  }
}

/** Duck the room bed while docked (§6.1) — reading music, not cinema. */
export function setHumDucked(ducked: boolean): void {
  if (!ctx || !humGain) return;
  humGain.gain.setTargetAtTime(
    ducked ? HUM_DUCKED : HUM_FREE,
    ctx.currentTime,
    HUM_DUCK_RAMP,
  );
}

// ------------------------------------------------------------- shell cues

/**
 * Wire boot-phase and window cues by *observing* win98State rather than
 * calling into it from every mutation site — the store keeps its purity
 * and no app/shell component grows an audio import. Returns a detach fn.
 */
export function attachShellCues(): () => void {
  let lastPhase: BootPhase = win98State.phase;
  let lastWindowIds = win98State.windows.map((w) => w.id).join("|");
  let lastWindowCount = win98State.windows.length;

  const unsubscribe = subscribeWin98(() => {
    const { phase, windows } = win98State;

    if (phase !== lastPhase) {
      // POST begins with the tube waking: thunk, then the BIOS beep on the
      // first line's beat (bootSequencer pushes it immediately after).
      if (phase === "post") {
        playDegauss();
        window.setTimeout(playBiosBeep, 220);
      } else if (phase === "splash") {
        playStartupChime();
      } else if (phase === "shutdown") {
        playShutdown();
      }
      lastPhase = phase;
    }

    // Compare identity, not just length: close-then-open inside one
    // notify batch would net to zero on a count-only check.
    const ids = windows.map((w) => w.id).join("|");
    if (ids !== lastWindowIds) {
      if (windows.length > lastWindowCount) playWindowOpen();
      else if (windows.length < lastWindowCount) playWindowClose();
      lastWindowIds = ids;
      lastWindowCount = windows.length;
    }
  });

  detachCues = unsubscribe;
  return unsubscribe;
}
