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
import { createTyping, type TypingUpdate } from "./typing";

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

    root.add(body, headPivot, buildWardrobe(opts));
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

    // Typing rig: the eight named fingers + both hands + the chest.
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
        { fingers, hands: [handR, handL], chest },
        seed,
      );
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

  useFrame(({ clock }, delta) => {
    idle.current?.(clock.elapsedTime, delta);
    typing.current?.(clock.elapsedTime);
  });

  return <primitive object={figure.root} />;
}
