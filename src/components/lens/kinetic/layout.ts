import type { PerspectiveCamera, Mesh } from "three";
import { rectToWorld } from "../rectToWorld";

/**
 * Positions a unit plane so it exactly covers a DOM rect on a given z-plane.
 * The DOM→world math lives in the shared rectToWorld() (also used by the
 * projection targeting spine, ADR-008 §2).
 */
export function layoutPlaneToRect(
  mesh: Mesh,
  rect: DOMRect,
  padCssPx: number,
  camera: PerspectiveCamera,
  viewportPx: { width: number; height: number },
  planeZ: number,
) {
  const { x, y, worldPerPx } = rectToWorld(rect, camera, viewportPx, planeZ);

  mesh.scale.set(
    (rect.width + padCssPx * 2) * worldPerPx,
    (rect.height + padCssPx * 2) * worldPerPx,
    1,
  );
  mesh.position.set(x, y, planeZ);
  // Skip offscreen planes (with margin for shader displacement).
  mesh.visible =
    rect.bottom > -160 && rect.top < viewportPx.height + 160 && rect.width > 0;
}
