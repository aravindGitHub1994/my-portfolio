"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, InstancedMesh, Mesh, MeshStandardMaterial } from "three";
import { buildBody, NECK_PIVOT, type DetailLevel } from "./buildBody";
import { buildHead } from "./buildHead";
import { buildHair } from "./buildHair";
import { buildBeard } from "./buildBeard";
import { createIdle, type IdleUpdate } from "./idle";

/**
 * The figure (plan-0009 §1.1): clay-first — a single matte material over
 * seeded parametric builders (ADR-012 §2/§3). Color, wardrobe, and tattoos
 * arrive in 1.3 only after the silhouette passes HITL gate 1.2. The idle
 * driver writes to object refs from useFrame; frame loops never touch
 * React state.
 */
export function Figure({
  seed = 1998,
  detail = "high",
}: {
  seed?: number;
  detail?: DetailLevel;
}) {
  const idle = useRef<IdleUpdate | null>(null);

  const figure = useMemo(() => {
    const material = new MeshStandardMaterial({
      // Clay render grey — an effect color, not a UI token.
      color: "#a89a8c",
      roughness: 0.95,
      metalness: 0,
    });
    const opts = { seed, detail, material };
    const root = new Group();
    root.name = "figure";

    const body = buildBody(opts);

    // Head pivot at the neck: sway rotates skull, hair, and beard together.
    const headPivot = new Group();
    headPivot.name = "headPivot";
    headPivot.position.copy(NECK_PIVOT);
    headPivot.rotation.x = -0.06; // slight tilt toward the screen
    headPivot.add(buildHead(opts), buildHair(opts), buildBeard(opts));

    root.add(body, headPivot);
    return { root, material };
  }, [seed, detail]);

  useEffect(() => {
    const { root, material } = figure;
    const chest = root.getObjectByName("chest");
    const head = root.getObjectByName("headPivot");
    const eyelids = root.getObjectByName("eyelids");
    if (chest && head && eyelids) {
      idle.current = createIdle({ chest, head, eyelids }, seed);
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
      root.traverse((obj) => {
        if (obj instanceof Mesh) obj.geometry.dispose();
      });
      material.dispose();
    };
  }, [figure, seed, detail]);

  useFrame(({ clock }, delta) => {
    idle.current?.(clock.elapsedTime, delta);
  });

  return <primitive object={figure.root} />;
}
