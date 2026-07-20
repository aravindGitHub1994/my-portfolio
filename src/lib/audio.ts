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
 *  adjacent cues, and machine noise sits between them.
 *
 *  `texture` (6.2 tier-2: key clacks, drive chatter, fan bed) and `music`
 *  (6.2 tier-3: the earbud leak) are the SHEDDABLE pair — 7.2's watchdog
 *  drops them via `setBusShed` before anything touches the tier-1 cues,
 *  mirroring how effectsState sheds visual garnish first. */
const BUS_GAIN = {
  ui: 0.5,
  machine: 0.42,
  room: 0.16,
  texture: 0.34,
  music: 0.22,
} as const;

/** Hum level while docked vs. free. Docked is reading, not cinema (§6.1). */
const HUM_FREE = 1;
const HUM_DUCKED = 0.35;
const HUM_DUCK_RAMP = 0.5;

type Bus = keyof typeof BUS_GAIN;
/** Only these may be shed by 7.2 — tier-1 cues are never optional. */
export type SheddableBus = "texture" | "music";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let buses: Record<Bus, GainNode> | null = null;
let humGain: GainNode | null = null;
let humTone: BiquadFilterNode | null = null;
let fanGain: GainNode | null = null;
let leakGain: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let detachCues: (() => void) | null = null;

/** Next earbud note time, in ctx time. The frame reader schedules ahead. */
let leakNextAt = 0;
let leakStep = 0;

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

  // Built from BUS_GAIN's keys rather than listed twice — adding a bus is
  // then a one-line change and cannot leave a node uncreated.
  buses = {} as Record<Bus, GainNode>;
  for (const name of Object.keys(BUS_GAIN) as Bus[]) {
    const gain = ctx.createGain();
    gain.gain.value = BUS_GAIN[name];
    gain.connect(master);
    buses[name] = gain;
  }

  noiseBuffer = makeNoiseBuffer(ctx);
  startHum();
  startTextureBeds();
  // Context can start "suspended" even from a gesture on some browsers.
  void ctx.resume();
}

/** Tear down (experience unmount). Safe to call when never unlocked. */
export function disposeAudio(): void {
  detachCues?.();
  detachCues = null;
  humGain = null;
  humTone = null;
  fanGain = null;
  leakGain = null;
  leakNextAt = 0;
  leakStep = 0;
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
    // Room hiss routed through the tone filter the screen brightness
    // modulates (6.2) — a brighter raster reads as a slightly brighter
    // bed. The sines above stay unfiltered so the 60 Hz floor is constant.
    humTone = ctx.createBiquadFilter();
    humTone.type = "lowpass";
    humTone.frequency.value = 420;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    src.connect(humTone).connect(gain).connect(humGain);
    src.start();
  }
}

/** Tier-2/3 continuous beds (6.2). Both live on sheddable buses. */
function startTextureBeds(): void {
  if (!ctx || !buses || !noiseBuffer) return;

  // Dusk fan bed — low, slow, felt more than heard; level rides duskDeepen.
  fanGain = ctx.createGain();
  fanGain.gain.value = 0.25;
  fanGain.connect(buses.texture);
  const fan = ctx.createBufferSource();
  fan.buffer = noiseBuffer;
  fan.loop = true;
  const fanFilter = ctx.createBiquadFilter();
  fanFilter.type = "lowpass";
  fanFilter.frequency.value = 190;
  const fanTrim = ctx.createGain();
  fanTrim.gain.value = 0.35;
  fan.connect(fanFilter).connect(fanTrim).connect(fanGain);
  fan.start();

  // Earbud leak — everything the scheduler plays goes through a hard
  // lowpass, which is what makes it read as sound escaping someone else's
  // earbuds rather than music in the room.
  leakGain = ctx.createGain();
  leakGain.gain.value = 0;
  const leakFilter = ctx.createBiquadFilter();
  leakFilter.type = "lowpass";
  leakFilter.frequency.value = 900;
  leakGain.connect(leakFilter).connect(buses.music);
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

// -------------------------------------------------- tier-2/3 texture (6.2)

/**
 * Shed or restore a garnish bus (7.2's watchdog). Tier-1 cues have no
 * equivalent — they are never optional, which is why only `texture` and
 * `music` are typed as sheddable.
 */
export function setBusShed(bus: SheddableBus, shed: boolean): void {
  if (!ctx || !buses) return;
  buses[bus].gain.setTargetAtTime(
    shed ? 0 : BUS_GAIN[bus],
    ctx.currentTime,
    0.25,
  );
}

/** Seeded variation so repeated cues aren't machine-identical. */
const textureRand = mulberry32(0x6c1a);

/**
 * One key clack. Called on the typing rig's tap events (never a parallel
 * timer — 6.2 acceptance): the caller watches `typingState.taps` and fires
 * once per increment, so the sound cannot drift from the finger motion.
 */
export function playClack(): void {
  const r = textureRand();
  // Two layers: the keycap's plastic knock and the switch's click.
  tone({
    bus: "texture",
    freq: 150 + r * 60,
    toFreq: 70,
    type: "triangle",
    peak: 0.3,
    attack: 0.001,
    decay: 0.035,
  });
  noise({
    bus: "texture",
    peak: 0.16,
    attack: 0.001,
    decay: 0.018,
    filter: "bandpass",
    freq: 1900 + r * 900,
    q: 1.4,
  });
}

/**
 * Hard-drive seek chatter — paced by the 3.3 boot lines (one burst per
 * POST line), not by a timer of its own, so the drive "works" exactly when
 * the sequencer says the machine is working.
 */
export function playHddSeek(): void {
  const bursts = 2 + Math.floor(textureRand() * 3);
  for (let i = 0; i < bursts; i++) {
    noise({
      bus: "texture",
      peak: 0.12,
      attack: 0.001,
      decay: 0.02 + textureRand() * 0.03,
      delay: i * (0.045 + textureRand() * 0.05),
      filter: "bandpass",
      freq: 700 + textureRand() * 1500,
      q: 2.5,
    });
  }
}

/**
 * Egg stinger for the 8.x easter eggs — a short bright arpeggio. Provided
 * now so P8 has the cue ready; nothing calls it yet.
 */
export function playEggStinger(): void {
  bell(1174.66, 0, 0.3, 0.4);
  bell(1567.98, 0.07, 0.28, 0.5);
  bell(2093.0, 0.14, 0.24, 0.7);
}

/**
 * Hum shifts with screen brightness (6.2): a brighter raster draws more
 * beam current, so the flyback sings a little louder and brighter. Driven
 * per frame from `screenLight.luminance`.
 */
export function setHumBrightness(luminance: number): void {
  if (!ctx || !humTone) return;
  const k = Math.min(Math.max(luminance, 0), 1);
  // Gentle range — this is a bed, not an effect the visitor should notice
  // as "reacting". setTargetAtTime smooths the per-frame writes.
  humTone.frequency.setTargetAtTime(300 + k * 520, ctx.currentTime, 0.3);
}

/** Dusk room tone + fan bed, driven by `experienceState.duskDeepen`. */
export function setDuskTone(deepen: number): void {
  if (!ctx || !fanGain) return;
  const k = Math.min(Math.max(deepen, 0), 1);
  fanGain.gain.setTargetAtTime(0.25 + k * 0.55, ctx.currentTime, 0.6);
}

/** The earbud leak's carrier level — 0 silences it (and stops scheduling). */
export function setEarbudLeak(level: number): void {
  if (!ctx || !leakGain) return;
  leakGain.gain.setTargetAtTime(
    Math.min(Math.max(level, 0), 1),
    ctx.currentTime,
    0.4,
  );
}

/** An original minor figure — what leaks out of someone else's earbuds is
 *  a contour, not a tune, so this is deliberately sparse and heavily
 *  filtered by the graph it plays into. */
const LEAK_NOTES = [220, 261.63, 329.63, 261.63, 246.94, 329.63, 392, 329.63];
const LEAK_STEP_S = 0.42;

/**
 * Lookahead scheduler for the leak, ticked from the scene frame loop. Rides
 * the frame clock rather than a `setInterval` so it cannot run on while the
 * tab is throttled and the visuals are frozen.
 */
export function tickEarbudMusic(audible: boolean): void {
  if (!ctx || !leakGain) return;
  const now = ctx.currentTime;
  if (!audible) {
    // Re-anchor so an inaudible stretch doesn't burst-schedule on return.
    leakNextAt = now;
    return;
  }
  if (leakNextAt < now) leakNextAt = now;
  // Schedule at most ~1 s ahead.
  while (leakNextAt < now + 1) {
    const freq = LEAK_NOTES[leakStep % LEAK_NOTES.length];
    const start = leakNextAt;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.5, start + 0.02);
    gain.gain.setTargetAtTime(0.0001, start + 0.02, 0.09);
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    osc.connect(gain).connect(leakGain);
    osc.start(start);
    osc.stop(start + 0.6);
    leakStep++;
    leakNextAt += LEAK_STEP_S;
  }
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
  let lastPostCount = win98State.postLines.length;

  const unsubscribe = subscribeWin98(() => {
    const { phase, windows, postLines } = win98State;

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

    // Drive chatter (6.2) paced by the POST lines themselves — one burst
    // per line the sequencer pushes, so the drive works when the machine
    // says it is working. clearPostLines() resets rather than fires.
    if (postLines.length !== lastPostCount) {
      if (postLines.length > lastPostCount) playHddSeek();
      lastPostCount = postLines.length;
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
