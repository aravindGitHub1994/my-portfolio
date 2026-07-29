"use client";

// The tower's power switch and lamp (plan-0010 §2.3, ADR-013 §2/§3) — the
// scene half of the press. `src/lib/powerPress.ts` owns the ordering and
// stays pure; this is the thin wiring that gives it an arm to move and two
// meshes to drive, and it is the machine's only ticker.
//
// Two signals, deliberately separate:
//
//  - **The button** follows `powerPressState.depress`, i.e. the fingertip.
//  - **The LED** follows `win98State.phase` — the machine, not the finger.
//    That is the honest source, and it also means the lamp and the degauss
//    thunk (which `attachShellCues` fires off the same phase change) can
//    never drift apart, because there is no second timeline to keep in
//    sync. In a harness that auto-boots, the LED lights correctly for free.

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Mesh, MeshStandardMaterial } from "three";
import { armPoseRef, armPoseState } from "../character/armPose";
import {
  attachPowerArm,
  powerPressState,
  tickPowerPress,
} from "@/lib/powerPress";
import { subscribeWin98, win98State } from "@/lib/win98State";

/** Button travel, metres (plan-0010 §2.3: "~2 mm"). The button protrudes
 *  ~7 mm from the case front, so it sinks without ever passing through. */
const PRESS_DEPTH = 0.002;

/** LED emissive at full. Above Bloom's 0.68 luminance threshold on
 *  purpose — the glow is the point — but emissive only, so it lights no
 *  surfaces and the brightness contract is untouched. */
const LED_ON = 1.35;

/** Seconds to reach full. Just slow enough not to read as a texture swap;
 *  a power LED is not a lamp warming up. */
const LED_RISE_S = 0.18;

interface Parts {
  button: Mesh;
  /** The button's authored z, captured before anything moves it — the
   *  depress is an offset from here, never an absolute. */
  restZ: number;
  led: MeshStandardMaterial | null;
}

export function TowerPower({ root }: { root: Group }) {
  const parts = useRef<Parts | null>(null);
  const ledTarget = useRef(0);

  useEffect(() => {
    const button = root.getObjectByName("towerPower") as Mesh | null;
    if (!button) {
      // Loud, the `elbowPivotL` treatment: without it the press has no
      // visible effect at all and the opening silently loses its payoff.
      console.error("[tower] towerPower mesh missing — the press cannot show");
      return;
    }
    const lamp = root.getObjectByName("towerLed") as Mesh | null;
    // Both lamps share one material instance (`materials.led`), so writing
    // it once lights the CRT's LED too.
    const led =
      lamp && lamp.material instanceof MeshStandardMaterial ? lamp.material : null;
    if (!led) console.error("[tower] towerLed missing — the machine cannot light");

    const restZ = button.position.z;
    parts.current = { button, restZ, led };
    return () => {
      button.position.z = restZ;
      if (led) led.emissiveIntensity = 0;
      parts.current = null;
    };
  }, [root]);

  // Event-driven, never a per-frame store read: the lamp's TARGET changes
  // only when the boot machine changes phase; the frame loop just walks
  // toward it.
  useEffect(() => {
    const sync = () => {
      ledTarget.current = win98State.phase === "off" ? 0 : 1;
    };
    sync();
    return subscribeWin98(sync);
  }, []);

  // Give the press machine an arm. Registered here rather than in `Figure`
  // because the sequence belongs to the switch, not to the person — and
  // `armPoseRef` is read lazily inside the hooks, so this component and
  // `Figure` can mount in either order.
  useEffect(
    () =>
      attachPowerArm({
        reach: (holdS) => armPoseRef.current?.goTo("R", "power", holdS),
        release: () => armPoseRef.current?.goTo("R", "typing", 0),
      }),
    [],
  );

  useFrame((_, delta) => {
    // Qualified by the pose, not just the flag: `contact` is true during
    // any hold, and a mouse reach must not trip the press.
    tickPowerPress(
      delta,
      armPoseState.R.contact && armPoseState.R.pose === "power",
    );

    const current = parts.current;
    if (!current) return;
    current.button.position.z = current.restZ - powerPressState.depress * PRESS_DEPTH;

    const led = current.led;
    if (!led) return;
    const target = ledTarget.current * LED_ON;
    const diff = target - led.emissiveIntensity;
    if (diff === 0) return;
    const step = (LED_ON / LED_RISE_S) * delta;
    led.emissiveIntensity +=
      Math.abs(diff) <= step ? diff : Math.sign(diff) * step;
  });

  return null;
}
