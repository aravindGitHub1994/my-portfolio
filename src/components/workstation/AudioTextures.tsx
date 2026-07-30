"use client";

// Tier-2/3 texture audio (plan-0009 §6.2). One frame reader for every
// continuous or motion-coupled sound, mounted inside the journey Canvas.
//
// Everything here rides an existing rig's state rather than a clock of its
// own — the §6.2 acceptance is explicit that clack timing must come from
// the typing rig's events, and the same discipline applies to the rest:
// the drive chatter is paced by the boot sequencer (in `audio.ts`'s
// win98State observer), the hum tracks `screenLight`, the fan bed tracks
// `duskDeepen`, and the earbud leak is gated by real camera distance. A
// parallel timer would drift out of sync the moment a frame stalls.
//
// Cheap by construction: reads mutable singletons, allocates nothing per
// frame, and every audio write is epsilon-gated so a still frame costs
// nothing. With no AudioContext (no power press yet, or a harness scene)
// every call here is an early return inside `audio.ts`.

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import {
  playClack,
  setBusShed,
  setDuskTone,
  setEarbudLeak,
  setHumBrightness,
  tickEarbudMusic,
} from "@/lib/audio";
import { experienceState } from "@/lib/experienceState";
import { typingState } from "./character/typing";
import { screenLight } from "./scene/screenLight";
import { effectsState } from "./scene/sheddable";
import { HEAD_FOCUS } from "./choreography/cameraPath";

/**
 * Leak falloff, in world units from the head.
 *
 * Tuned against the real ch. 2 poses in `cameraPath.ts` rather than picked
 * by feel: the ch. 2 rest sits 1.28 from the head (→ ~0.72 level, present
 * but plainly a leak), the ch. 2→3 arc 1.46 (→ ~0.55, fading as the camera
 * swings away), and the ch. 3 wide shot 2.19 (→ silent).
 */
const LEAK_FAR = 2.0;
const LEAK_NEAR = 1.0;
/**
 * The leak belongs to the ch. 2 orbit — the beat whose framing note is
 * literally "the figure's profile (earbud/beard/forearm)".
 *
 * This chapter gate is load-bearing, not belt-and-braces: ch. 1's rest
 * pose sits 0.53 from the head — CLOSER than ch. 2's — because the screen
 * close-up is near the face. On distance alone the leak would be loudest
 * during the opening beat, where the earbud isn't even the subject.
 */
const LEAK_CHAPTER = 2;
/**
 * Minimum spacing between clacks, in seconds.
 *
 * A backstop, not the rhythm. The rhythm is the rig's: session 23 slowed
 * the eight fingers to a ~0.97 s mean interval (~8 taps/s) and gave the
 * keyboard bursts and pauses, because thinning a continuous stream *here*
 * can only ever produce a continuous stream — and heavy thinning makes it a
 * metronome, since a gate this side of the taps voices them at exactly its
 * own period. Fix the typing, and the sound follows for free; that is the
 * whole point of §6.2's "clacks come from tap events".
 *
 * What it catches now is fingers landing together, which eight independent
 * fingers do often: simulated over two minutes it drops 42 % of taps, and
 * the stream that survives is ~5 clacks/s inside a burst, ~3.1/s across the
 * ride, 39 % of it silence — against ~11/s of unbroken typing before.
 *
 * It does NOT reintroduce a timer: no clack ever fires without a real tap
 * event, so the sound cannot drift from the motion — some taps just go
 * unvoiced, exactly as a real keyboard's quieter presses do. 0 restores
 * 1:1; to change the *pace*, change `KEYS_BURST`/`KEYS_PAUSE`/`tapGap` in
 * `character/typing.ts`.
 */
const MIN_CLACK_GAP_S = 0.09;
/** Don't rewrite an audio param for changes under this. */
const EPS = 0.01;

export function AudioTextures() {
  const seenTaps = useRef(typingState.taps);
  const lastClackAt = useRef(-1);
  const lastLum = useRef(-1);
  const lastDusk = useRef(-1);
  const lastLeak = useRef(-1);
  const shedTexture = useRef(!effectsState.audioTexture);
  const shedMusic = useRef(!effectsState.audioMusic);

  useFrame(({ camera, clock }) => {
    // --- Key clacks, driven by the typing rig's tap counter (not a timer):
    //     a clack is only ever emitted in response to an observed tap.
    const taps = typingState.taps;
    if (taps !== seenTaps.current) {
      const elapsed = clock.elapsedTime;
      if (elapsed - lastClackAt.current >= MIN_CLACK_GAP_S) {
        playClack();
        lastClackAt.current = elapsed;
      }
      seenTaps.current = taps;
    }

    // --- Hum brightness tracks the screen's own luminance.
    const lum = screenLight.luminance;
    if (Math.abs(lum - lastLum.current) > EPS) {
      setHumBrightness(lum);
      lastLum.current = lum;
    }

    // --- Fan bed / room tone deepens with the dusk cue.
    const dusk = experienceState.duskDeepen;
    if (Math.abs(dusk - lastDusk.current) > EPS) {
      setDuskTone(dusk);
      lastDusk.current = dusk;
    }

    // --- Earbud leak: audible only when the ch. 2 orbit brings the camera
    //     near the figure's head. Measured against HEAD_FOCUS — the very
    //     vector ch. 2's key frames aim at — so the sound and the shot
    //     resolve the head to the same point by construction. It is a
    //     module constant (the path lerps into out-params, never into the
    //     keys), so it can be read directly without a defensive copy.
    let leak = 0;
    if (experienceState.chapterIndex === LEAK_CHAPTER) {
      const d = camera.position.distanceTo(HEAD_FOCUS);
      leak =
        d >= LEAK_FAR
          ? 0
          : d <= LEAK_NEAR
            ? 1
            : (LEAK_FAR - d) / (LEAK_FAR - LEAK_NEAR);
    }
    if (Math.abs(leak - lastLeak.current) > EPS) {
      setEarbudLeak(leak);
      lastLeak.current = leak;
    }
    tickEarbudMusic(leak > 0);

    // --- Mirror 7.2's shed flags onto the garnish buses. Edge-triggered:
    //     setBusShed ramps, so writing it every frame would never settle.
    const wantTexture = !effectsState.audioTexture;
    if (wantTexture !== shedTexture.current) {
      setBusShed("texture", wantTexture);
      shedTexture.current = wantTexture;
    }
    const wantMusic = !effectsState.audioMusic;
    if (wantMusic !== shedMusic.current) {
      setBusShed("music", wantMusic);
      shedMusic.current = wantMusic;
    }
  });

  return null;
}
