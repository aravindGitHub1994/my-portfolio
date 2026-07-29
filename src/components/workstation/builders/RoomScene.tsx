"use client";

import { useEffect, useMemo } from "react";
import { Group, InstancedMesh, Mesh } from "three";
import { Lighting } from "../scene/Lighting";
import { Atmosphere } from "../scene/Atmosphere";
import { Postprocessing } from "../scene/postprocessing";
import { CrtScreen } from "../crt/CrtScreen";
import { TowerPower } from "./TowerPower";
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
