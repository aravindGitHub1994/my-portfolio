"use client";

// The cats' frame loop (plan-0010 §5.2) — thin on purpose. `catIdle.ts` is
// the driver; this finds the pivots and ticks it.
//
// **The file is `CatMotion.tsx`, not `CatIdle.tsx`, and has to be.** The
// driver's name is fixed by the plan, and a `CatIdle.tsx` beside a
// `catIdle.ts` differs from it only in casing — which resolves fine on Linux
// and makes `./CatIdle` ambiguous on the macOS and Windows filesystems this
// repo is actually developed on (tsc rejects it outright: TS1149).
//
// **Why a component and not a loop in `RoomScene`.** The room is otherwise a
// static memo: it builds a `Group` once and hands it to a `<primitive>`, and
// giving that component a `useFrame` would mean the whole set re-runs a
// callback every frame to move two tails. Keeping the loop in its own leaf is
// also what lets the tails ride the shed ladder without `RoomScene` knowing
// the ladder exists — the same split `TowerPower` uses for the press.

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Object3D } from "three";
import { effectsState } from "../scene/sheddable";
import { createCatIdle, type CatIdleUpdate, type CatRig } from "./catIdle";

/** How many cats to look for. `RoomScene` places two and `buildCat`'s
 *  `index` is typed `0 | 1`; a third would need a name here. */
const CAT_INDICES = [0, 1] as const;

interface Restore {
  obj: Object3D;
  x: number;
  y: number;
  z: number;
}

export function CatMotion({ root, seed = 1998 }: { root: Group; seed?: number }) {
  const update = useRef<CatIdleUpdate | null>(null);
  const oddFrame = useRef(false);

  useEffect(() => {
    const rigs: CatRig[] = [];
    const restore: Restore[] = [];

    for (const i of CAT_INDICES) {
      const tail = root.getObjectByName(`tail${i}`);
      const tip = root.getObjectByName(`tailTip${i}`);
      if (!tail || !tip) {
        // Loud but not fatal, unlike `elbowPivotL`: a still tail is a cosmetic
        // loss, not a mis-placed prop, so the room is still worth rendering.
        console.error(`[cats] tail${i}/tailTip${i} missing — that tail cannot move`);
        continue;
      }
      const ears = ["R", "L"]
        .map((s) => root.getObjectByName(`catEar${i}${s}`))
        .filter((e): e is Object3D => !!e);
      if (ears.length < 2) {
        console.error(`[cats] catEar${i}{R,L} missing — no flick for that cat`);
      }
      rigs.push({ tail, tip, ears });
      for (const obj of [tail, tip, ...ears]) {
        restore.push({
          obj,
          x: obj.rotation.x,
          y: obj.rotation.y,
          z: obj.rotation.z,
        });
      }
    }

    if (!rigs.length) return;
    update.current = createCatIdle(rigs, seed);

    return () => {
      update.current = null;
      // Put every rotation back exactly as authored. The driver only ever
      // writes rest + offset, so this is a real restore rather than a guess
      // at what rest was.
      for (const r of restore) r.obj.rotation.set(r.x, r.y, r.z);
    };
  }, [root, seed]);

  useFrame(({ clock }) => {
    // Half-rate when the ladder has shed `idleDensity`, exactly as `Figure`
    // does it, and for the same reason: the driver still sees the true
    // elapsed time, so the sines keep their real periods and simply update
    // in coarser steps. Skipping the *call* rather than slowing the *clock*
    // is what stops a shed room drifting out of phase with the figure in it
    // — a stiller cat and a stiller person are one downgrade, not two.
    oddFrame.current = !oddFrame.current;
    if (effectsState.idleDensity || oddFrame.current) {
      update.current?.(clock.elapsedTime);
    }
  });

  return null;
}
