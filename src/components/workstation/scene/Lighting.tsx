"use client";

// Dusk rig (plan-0009 §2.2, ADR-012 §2): cool blue-hour directional +
// soft ambient from the window side (+X), and the warm CRT key light —
// intensity AND color driven each frame from screenLight (written by the
// screen feed / harness test pattern). Refs only in the frame loop.

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { AmbientLight, DirectionalLight, PointLight } from "three";
import { experienceState } from "@/lib/experienceState";
import { screenLight } from "./screenLight";
import { effectsState } from "./sheddable";
import { LAMP_LIGHT_POSITION } from "../builders/lamp";

/** Base + luminance-scaled intensity of the CRT cast. */
const CAST_BASE = 0.5;
const CAST_SCALE = 3.4;
/** Hard ceiling on the cast — boot-flicker peaks floodlit the room
 *  (gate-2.3 defect 2); brightest moods now share one tamed maximum. */
const CAST_MAX = 2.6;
/** Smoothing factor per second when castFlicker is shed. */
const SMOOTH_RATE = 4;

/**
 * The corner lamp's undimmed intensity (ADR-014 §5).
 *
 * **Bounded by the thing `duskDeepen` exists for.** At chapter 5 the fills
 * are scaled by `dusk = 1 - 0.55`, i.e. 0.45, and the CRT cast is not
 * scaled at all — that is what makes the screen the last light standing.
 * So the lamp is only allowed to be as bright as keeps that true against
 * the cast's *floor*: `LAMP_BASE * 0.45 < CAST_BASE` (0.45 < 0.5). Stated
 * against `CAST_BASE` rather than the cast's actual chapter-5 value, so it
 * holds even with a black screen, which is the only version of the claim
 * that cannot be broken by a change to what the desktop looks like.
 *
 * A practical that stayed lit through the dusk was offered to the owner and
 * declined for exactly this reason (ADR-014 §5) — so it dims with the rest.
 */
const LAMP_BASE = 1.0;
/** Reaches its corner and not much further: the desk is ~2.1 m away and
 *  this is a corner practical, not a room light. */
const LAMP_DISTANCE = 2.2;
const LAMP_DECAY = 1.6;

export function Lighting({
  screenPosition = [-0.22, 1.06, -0.5] as [number, number, number],
}: {
  screenPosition?: [number, number, number];
}) {
  const cast = useRef<PointLight>(null);
  const ambient = useRef<AmbientLight>(null);
  const shaft = useRef<DirectionalLight>(null);
  const bounce = useRef<DirectionalLight>(null);
  const lamp = useRef<PointLight>(null);

  useFrame((_, delta) => {
    const light = cast.current;
    if (!light) return;
    const target = Math.min(
      CAST_BASE + screenLight.luminance * CAST_SCALE,
      CAST_MAX,
    );
    if (effectsState.castFlicker) {
      light.intensity = target;
      light.color.copy(screenLight.tint);
    } else {
      // Shed tier: ease toward the target so the room never strobes.
      const k = Math.min(1, SMOOTH_RATE * delta);
      light.intensity += (target - light.intensity) * k;
      light.color.lerp(screenLight.tint, k);
    }

    // Ch. 5 dusk deepening (4.1): the cool fill sinks with the scrub;
    // the CRT cast is untouched, so the screen becomes the last light.
    const dusk = 1 - 0.55 * experienceState.duskDeepen;
    if (ambient.current) ambient.current.intensity = 0.5 * dusk;
    if (shaft.current) shaft.current.intensity = 0.85 * dusk;
    if (bounce.current) bounce.current.intensity = 0.25 * dusk;
    // ADR-014 §5: the corner lamp sinks with the others. It is NOT a shed
    // rung — a corner going dark is a conspicuous pop, and a garnish rung
    // has to shed invisibly.
    if (lamp.current) lamp.current.intensity = LAMP_BASE * dusk;
  });

  return (
    <>
      <ambientLight ref={ambient} color="#2c3d5c" intensity={0.5} />
      {/* Blue-hour shaft through the +X window. */}
      <directionalLight
        ref={shaft}
        color="#7a9bd8"
        position={[2.5, 2.2, 0.6]}
        intensity={0.85}
      />
      {/* Faint bounce so the room's dark side never clips to black. */}
      <directionalLight
        ref={bounce}
        color="#40465c"
        position={[-1.5, 1.2, 1.8]}
        intensity={0.25}
      />
      {/* The corner lamp's light. The bulb MESH lives in `builders/lamp.ts`
          — no builder here returns a light, and this light has to ride
          `duskDeepen` with the fills above. Its position is imported from
          the builder so the glow and the geometry cannot drift apart. */}
      <pointLight
        ref={lamp}
        color="#ffbf7a"
        position={LAMP_LIGHT_POSITION}
        intensity={LAMP_BASE}
        distance={LAMP_DISTANCE}
        decay={LAMP_DECAY}
      />
      <pointLight
        ref={cast}
        color="#ffb066"
        position={screenPosition}
        intensity={2.2}
        distance={3.8}
        decay={1.6}
      />
    </>
  );
}
