// Hair builder (plan-0009 §1.1): instanced tube-curls, seeded scatter over
// the scalp cap, 2–3 curl archetypes. Concept sheets: tight curl mass on
// top with faded sides/nape — so the scatter accepts the upper dome and a
// little of the upper back, and rejects the face cone and the fade zone.

import {
  CatmullRomCurve3,
  Group,
  InstancedMesh,
  Mesh,
  Object3D,
  Quaternion,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { mulberry32 } from "@/lib/prng";
import type { BuilderOptions } from "./buildBody";
import { SKULL_CENTER, SKULL_RADIUS } from "./buildHead";

const UP = new Vector3(0, 1, 0);

/** One helical curl archetype as a tube along a seeded wobbly helix. */
function curlGeometry(
  rnd: () => number,
  turns: number,
  detail: "low" | "high",
): TubeGeometry {
  const points: Vector3[] = [];
  const steps = 10;
  const helixR = 0.011 + rnd() * 0.004;
  const height = 0.03 + rnd() * 0.015;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * turns * Math.PI * 2;
    const taper = 1 - t * 0.35;
    points.push(
      new Vector3(
        Math.cos(a) * helixR * taper + (rnd() - 0.5) * 0.003,
        t * height,
        Math.sin(a) * helixR * taper + (rnd() - 0.5) * 0.003,
      ),
    );
  }
  return new TubeGeometry(
    new CatmullRomCurve3(points),
    detail === "high" ? 16 : 8,
    0.0105,
    detail === "high" ? 4 : 3,
    false,
  );
}

/**
 * Scatter direction on the scalp: mostly the upper dome, some upper back.
 * Rejects the face cone (front-low) and the fade zone (side-low, near the
 * ears) so the silhouette matches the concept cut.
 */
function scalpDirection(rnd: () => number): Vector3 | null {
  const dir = new Vector3(
    rnd() * 2 - 1,
    rnd() * 2 - 1,
    rnd() * 2 - 1,
  );
  if (dir.lengthSq() < 1e-4 || dir.lengthSq() > 1) return null;
  dir.normalize();
  if (dir.y < 0.18) {
    // Below the dome: only the upper back keeps hair (short, but present).
    if (!(dir.z > 0.45 && dir.y > -0.05)) return null;
  }
  // Face cone: keep curls off the brow/temple front.
  if (dir.z < -0.5 && dir.y < 0.62) return null;
  return dir;
}

export function buildHair(options: BuilderOptions): Group {
  const { seed, detail, material } = options;
  const group = new Group();
  group.name = "hair";
  const rnd = mulberry32(seed ^ 0x48414952);

  // Scalp cap — a slightly inflated dome that closes gaps between curls.
  // Ends above the brow line: at 0.52π it dipped below the head's equator
  // and its proud rim ringed the face as a dark visor once the hair got
  // its own material (gate 1.2). The fade zone shows skin by design.
  const cap = new Mesh(
    new SphereGeometry(
      SKULL_RADIUS * 1.015,
      detail === "high" ? 24 : 12,
      detail === "high" ? 16 : 8,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.38,
    ),
    material,
  );
  cap.position.copy(SKULL_CENTER);
  // x kept above the skull's 0.98 x-scale so the dome never pokes through.
  cap.scale.set(1.0, 1.06, 1.02);
  group.add(cap);

  // Curl instances — 3 archetypes, seeded scatter.
  const archetypes = [1.3, 1.7, 2.1].map((turns) =>
    curlGeometry(rnd, turns, detail),
  );
  const totalCurls = detail === "high" ? 300 : 110;
  const perArchetype = Math.floor(totalCurls / archetypes.length);
  const dummy = new Object3D();
  const quat = new Quaternion();

  for (const geometry of archetypes) {
    const instanced = new InstancedMesh(geometry, material, perArchetype);
    let placed = 0;
    let guard = 0;
    while (placed < perArchetype && guard < perArchetype * 60) {
      guard++;
      const dir = scalpDirection(rnd);
      if (!dir) continue;
      dummy.position
        .copy(SKULL_CENTER)
        .addScaledVector(dir, SKULL_RADIUS * 0.99);
      quat.setFromUnitVectors(UP, dir);
      dummy.quaternion.copy(quat);
      dummy.rotateY(rnd() * Math.PI * 2);
      const s = 0.8 + rnd() * 0.5;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      instanced.setMatrixAt(placed, dummy.matrix);
      placed++;
    }
    instanced.count = placed;
    instanced.instanceMatrix.needsUpdate = true;
    group.add(instanced);
  }

  return group;
}
