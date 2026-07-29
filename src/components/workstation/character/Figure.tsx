"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
} from "three";
import {
  buildBody,
  NECK_PIVOT,
  type CharacterPalette,
  type DetailLevel,
} from "./buildBody";
import { buildHead } from "./buildHead";
import { buildHair } from "./buildHair";
import { buildBeard } from "./buildBeard";
import { buildWardrobe } from "./buildWardrobe";
import { createSkinMaterial, createForearmMaterial } from "./skinTexture";
import { createIdle, type IdleUpdate } from "./idle";
import { effectsState } from "../scene/sheddable";
import { createTyping, type TypingUpdate } from "./typing";
import { createArmPose, type ArmPoseDriver } from "./armPose";

/**
 * The figure (plan-0009 §1.1 + 1.3): seeded parametric builders under a
 * color-zoned palette — skin (canvas albedo, tattooed right forearm),
 * black tee, jeans, sneakers, smartwatch, gold hoops (ADR-012 §2/§3).
 * The idle + typing drivers write to object refs from useFrame; frame
 * loops never touch React state.
 */
export function Figure({
  seed = 1998,
  detail = "high",
}: {
  seed?: number;
  detail?: DetailLevel;
}) {
  const idle = useRef<IdleUpdate | null>(null);
  const typing = useRef<TypingUpdate | null>(null);
  const armPose = useRef<ArmPoseDriver | null>(null);

  const figure = useMemo(() => {
    // Fallback clay (only used if a palette slot is missing).
    const material = new MeshStandardMaterial({
      color: "#a89a8c",
      roughness: 0.95,
      metalness: 0,
    });
    // Hair + beard: near-black brown, matte.
    const hairMaterial = new MeshStandardMaterial({
      color: "#2d2620",
      roughness: 0.95,
      metalness: 0,
    });
    // 1.3 color zones — all effect colors, not UI tokens. Skin albedos
    // are canvas bakes generated once here (skinTexture.ts).
    const palette: CharacterPalette = {
      skin: createSkinMaterial(seed),
      forearmR: createForearmMaterial(seed),
      tee: new MeshStandardMaterial({ color: "#26262a", roughness: 0.92 }),
      jeans: new MeshStandardMaterial({ color: "#3d4d68", roughness: 0.9 }),
      sneaker: new MeshStandardMaterial({ color: "#d8d5cc", roughness: 0.85 }),
      watch: new MeshStandardMaterial({ color: "#17181c", roughness: 0.5 }),
      watchStrap: new MeshStandardMaterial({ color: "#33363d", roughness: 0.7 }),
      earring: new MeshStandardMaterial({
        color: "#c9a86a",
        roughness: 0.35,
        metalness: 0.8,
      }),
      earbud: new MeshStandardMaterial({ color: "#e8e4da", roughness: 0.5 }),
    };
    const opts = { seed, detail, material: palette.skin, palette };
    const hairOpts = { seed, detail, material: hairMaterial, palette };
    const root = new Group();
    root.name = "figure";

    const body = buildBody(opts);

    // Head pivot at the neck: sway rotates skull, hair, and beard together.
    const headPivot = new Group();
    headPivot.name = "headPivot";
    headPivot.position.copy(NECK_PIVOT);
    headPivot.rotation.x = -0.06; // slight tilt toward the screen
    headPivot.add(buildHead(opts), buildHair(hairOpts), buildBeard(hairOpts));

    // The smartwatch hangs off the left elbow pivot (ADR-013 §1) so it
    // rides the forearm through every pose. `buildWardrobe` returns
    // elbow-local geometry; falling back to `root` would place it in body
    // space, which is only correct at the rest pose — so make the missing
    // pivot loud rather than silently wrong.
    const elbowL = body.getObjectByName("elbowPivotL");
    if (!elbowL) throw new Error("[character] elbowPivotL missing from body rig");
    elbowL.add(buildWardrobe(opts));

    root.add(body, headPivot);
    return { root, material, hairMaterial, palette };
  }, [seed, detail]);

  useEffect(() => {
    const { root, material, hairMaterial, palette } = figure;
    const chest = root.getObjectByName("chest");
    const head = root.getObjectByName("headPivot");
    const eyelids = root.getObjectByName("eyelids");
    if (chest && head && eyelids) {
      idle.current = createIdle({ chest, head, eyelids }, seed);
    }

    // Arm-pose driver (1.2): owns the four rig pivots 1.1 introduced. The
    // pivots are required, not optional — without them the power press,
    // the mouse reach and the mug sip all fail together, so a missing one
    // is worth the same loud failure `elbowPivotL` already gets. Built
    // before the typing rig, which needs it: 4.1's scheduler drives poses
    // and its taps consult `busy()`.
    const shoulderR = root.getObjectByName("shoulderPivotR");
    const shoulderL = root.getObjectByName("shoulderPivotL");
    const elbowR = root.getObjectByName("elbowPivotR");
    const elbowL = root.getObjectByName("elbowPivotL");
    if (shoulderR && shoulderL && elbowR && elbowL) {
      armPose.current = createArmPose({ shoulderR, shoulderL, elbowR, elbowL });
    } else {
      console.error("[character] arm rig pivots missing — poses disabled");
    }

    // Typing rig: the eight named fingers + both hands + the chest. The
    // finger ORDER is load-bearing — 4.1 maps indices 0–3 to the right arm
    // and 4–7 to the left to suspend taps per arm.
    const fingers: Object3D[] = [];
    for (const side of ["R", "L"]) {
      for (let f = 0; f < 4; f++) {
        const finger = root.getObjectByName(`finger${side}${f}`);
        if (finger) fingers.push(finger);
      }
    }
    const handR = root.getObjectByName("handR");
    const handL = root.getObjectByName("handL");
    if (chest && fingers.length === 8 && handR && handL) {
      typing.current = createTyping(
        { fingers, hands: [handR, handL], chest, armPose: armPose.current },
        seed,
      );
    }

    // Dev-only QA handle, the `__fidelity` pattern: 1.2's acceptance is
    // "calling goTo from the console moves the correct arm", and this is
    // what makes that sentence executable.
    if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
      window.__armPose = armPose.current ?? undefined;
    }

    // Poly budget (1.1 acceptance: recorded, target < 60 k) — instances
    // counted at full weight.
    let tris = 0;
    root.traverse((obj) => {
      if (obj instanceof Mesh) {
        const geometry = obj.geometry;
        const per =
          (geometry.index?.count ?? geometry.attributes.position.count) / 3;
        tris += per * (obj instanceof InstancedMesh ? obj.count : 1);
      }
    });
    console.info(
      `[character] ~${Math.round(tris).toLocaleString()} tris (detail: ${detail})`,
    );

    return () => {
      idle.current = null;
      typing.current = null;
      armPose.current = null;
      if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
        window.__armPose = undefined;
      }
      root.traverse((obj) => {
        if (obj instanceof Mesh) obj.geometry.dispose();
      });
      material.dispose();
      hairMaterial.dispose();
      for (const zone of Object.values(palette)) {
        if (zone instanceof MeshStandardMaterial) {
          zone.map?.dispose();
          zone.dispose();
        }
      }
    };
  }, [figure, seed, detail]);

  // Half-rate idle when the ladder has shed `idleDensity` (§7.2). The
  // driver is still fed the true elapsed time, so breath and sway stay on
  // their real periods and simply update in coarser steps — skipping the
  // *call* rather than slowing the *clock* is what keeps a shed figure
  // from drifting out of phase with the typing rig beside it.
  const oddFrame = useRef(false);

  useFrame(({ clock }, delta) => {
    oddFrame.current = !oddFrame.current;
    if (effectsState.idleDensity || oddFrame.current) {
      idle.current?.(clock.elapsedTime, delta);
    }
    // Poses run at full rate even when idle density is shed: a reach is a
    // deliberate movement the visitor is watching, not garnish, and
    // halving its rate would read as a dropped frame rather than as calm.
    //
    // Ahead of the typing rig, not after it: the rig's scheduler starts
    // poses and its taps consult `busy()`, so it wants this frame's pose
    // state rather than the previous frame's.
    armPose.current?.(clock.elapsedTime, delta);
    typing.current?.(clock.elapsedTime);
  });

  return <primitive object={figure.root} />;
}

declare global {
  interface Window {
    __armPose?: ArmPoseDriver;
  }
}
