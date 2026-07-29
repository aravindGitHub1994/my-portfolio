"use client";

import { useEffect, useMemo } from "react";
import { Group, InstancedMesh, Mesh } from "three";
import { Lighting } from "../scene/Lighting";
import { Atmosphere } from "../scene/Atmosphere";
import { Steam } from "../scene/Steam";
import { Postprocessing } from "../scene/postprocessing";
import { CrtScreen } from "../crt/CrtScreen";
import { TowerPower } from "./TowerPower";
import { publishMug } from "../scene/propHandles";
import { createRoomMaterials, type RoomBuilderOptions } from "./materials";
import { buildRoom } from "./room";
import { buildDesk, DESK_TOP_Y } from "./desk";
import { buildTower, TOWER_SIZE } from "./tower";
import { buildCrt } from "./crt";
import { buildKeyboard } from "./keyboard";
import { buildMouse } from "./mouse";
import { buildSpeaker } from "./speaker";
import { buildMug } from "./mug";
import { buildNotebook } from "./notebook";
import { buildCdStack } from "./cdStack";
import { buildFloppies } from "./floppies";
import { buildCables } from "./cables";
import { buildChair } from "./chair";
import { buildPoster } from "./poster";
import { buildCatTree, CAT_TREE_X, CAT_PERCHES } from "./catTree";
import { buildCat } from "./cat";
import { WINDOW } from "./room";

/**
 * `?scene=room` harness (plan-0009 §2.1): the dressed set, no figure.
 * Layout per the concept sheets — CRT on the desktop case (left), keyboard
 * front-centre, mouse right, speaker right of the tower, CD stack far
 * right, mug left, notebook front-left, poster on the back wall, window on
 * the +X fill side. The dusk preview lights mirror CharacterScene; the
 * real rig lands in 2.2.
 */
export const ROOM_CAMERA = {
  position: [1.15, 1.6, 0.95] as [number, number, number],
  target: [-0.1, 0.85, -0.6] as [number, number, number],
};

const TOWER_TOP = DESK_TOP_Y + TOWER_SIZE.height + 0.008;

export function RoomScene({
  seed = 1998,
  detail = "high",
  autoBoot = true,
}: {
  seed?: number;
  detail?: "low" | "high";
  /** Journey mode passes false — 4.1's power press owns the boot. */
  autoBoot?: boolean;
}) {
  const scene = useMemo(() => {
    const materials = createRoomMaterials(seed);
    const opts: RoomBuilderOptions = { seed, detail, materials };
    const root = new Group();
    root.name = "roomSet";

    // [builder, x, y, z, rotY] — laid out per the concept sheets.
    const placements: [Group, number, number, number, number][] = [
      [buildRoom(opts), 0, 0, 0, 0],
      [buildDesk(opts), 0, 0, -0.62, 0],
      [buildTower(opts), -0.22, DESK_TOP_Y, -0.72, 0],
      [buildCrt(opts), -0.22, TOWER_TOP, -0.7, 0],
      [buildKeyboard(opts), 0.03, DESK_TOP_Y, -0.42, 0],
      [buildMouse(opts), 0.42, DESK_TOP_Y, -0.46, 0],
      [buildSpeaker(opts), 0.28, DESK_TOP_Y, -0.8, 0],
      [buildCdStack(opts), 0.6, DESK_TOP_Y, -0.78, 0],
      [buildMug(opts), -0.62, DESK_TOP_Y, -0.46, -0.5],
      [buildNotebook(opts), -0.42, DESK_TOP_Y, -0.33, 0.18],
      [buildFloppies(opts), -0.36, TOWER_TOP, -0.6, 0.3],
      [buildCables(opts), 0, 0, 0, 0],
      [buildChair(opts), 0, 0, 0.1, 0],
      [buildPoster(opts), 0.35, 1.6, -1.044, 0],
      // 5.1: the cat tree stands against the +X wall beside the window, its
      // x derived from the sill so it cannot grow into the ledge. Ivy takes
      // the perch — she is the bigger cat and it is her spot in the
      // photographs; Nimbus is a platform down. Both yaw to face +X, which
      // is the glass: the builder faces them -Z like the figure.
      [buildCatTree(opts), CAT_TREE_X, 0, WINDOW.z, 0],
      [
        buildCat({ ...opts, cat: "ivy", index: 0 }),
        CAT_PERCHES[2].x,
        CAT_PERCHES[2].y,
        CAT_PERCHES[2].z,
        -Math.PI / 2,
      ],
      [
        buildCat({ ...opts, cat: "nimbus", index: 1 }),
        CAT_PERCHES[1].x,
        CAT_PERCHES[1].y,
        CAT_PERCHES[1].z,
        // A few degrees off his sister's line — two cats staring on exactly
        // the same axis reads as a pair of ornaments.
        -Math.PI / 2 + 0.22,
      ],
    ];
    for (const [group, x, y, z, rotY] of placements) {
      group.position.set(x, y, z);
      group.rotation.y = rotY;
      root.add(group);
    }

    return { root, materials };
  }, [seed, detail]);

  useEffect(() => {
    const { root, materials } = scene;

    // Hand the mug to whoever can lift it (ADR-013 §6). Publishing a prop
    // is the only thing this component knows about the character, and it
    // does not know even that — it puts the object on a noticeboard and
    // never asks who reads it. `?scene=room` publishes to nobody.
    const mug = root.getObjectByName("mug");
    const retractMug = mug instanceof Group ? publishMug(mug) : undefined;

    // Poly budget (2.1 acceptance: props total < 150 k tris at high).
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
      `[room] ~${Math.round(tris).toLocaleString()} tris (detail: ${detail})`,
    );

    return () => {
      // Retract before disposing: a handle outliving its geometry is how a
      // "harmless" singleton keeps a whole scene alive.
      retractMug?.();
      root.traverse((obj) => {
        if (obj instanceof Mesh) obj.geometry.dispose();
      });
      materials.dispose();
    };
  }, [scene, detail]);

  return (
    <>
      <Lighting screenPosition={[-0.22, TOWER_TOP + 0.19, -0.5]} />
      <Atmosphere detail={detail} />
      {/* 4.3: steam off the mug. Reads `propHandles.mug` lazily each frame,
          so it does not care that the publish happens in an effect below —
          and it emits in world space, so the wisps stay put when the sip
          carries the mug away. */}
      <Steam detail={detail} />
      <Postprocessing />
      {/* 3.1: real Win98 feed on the crtScreen mesh (painter + CRT
          shader + screenLight); replaced the 2.2 ScreenTestPattern. */}
      <CrtScreen root={scene.root} autoBoot={autoBoot} />
      {/* 2.3: the power switch and its lamp. Lives with the set rather
          than with the figure — an auto-booting harness lights its LED
          without a person in the room. */}
      <TowerPower root={scene.root} />
      <primitive object={scene.root} />
    </>
  );
}
