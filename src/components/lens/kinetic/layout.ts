import type { PerspectiveCamera, Mesh } from "three";

/**
 * Positions a unit plane so it exactly covers a DOM rect on a given z-plane.
 * The camera looks straight down -z (no lookAt), so the screen center maps
 * to (camera.x, camera.y) at every depth — rect px offsets scale linearly
 * by world-units-per-pixel at that depth.
 */
export function layoutPlaneToRect(
  mesh: Mesh,
  rect: DOMRect,
  padCssPx: number,
  camera: PerspectiveCamera,
  viewportPx: { width: number; height: number },
  planeZ: number,
) {
  const dist = camera.position.z - planeZ;
  const vFov = (camera.fov * Math.PI) / 180;
  const worldPerPx = (2 * Math.tan(vFov / 2) * dist) / viewportPx.height;

  mesh.scale.set(
    (rect.width + padCssPx * 2) * worldPerPx,
    (rect.height + padCssPx * 2) * worldPerPx,
    1,
  );
  mesh.position.set(
    (rect.left + rect.width / 2 - viewportPx.width / 2) * worldPerPx +
      camera.position.x,
    -(rect.top + rect.height / 2 - viewportPx.height / 2) * worldPerPx +
      camera.position.y,
    planeZ,
  );
  // Skip offscreen planes (with margin for shader displacement).
  mesh.visible =
    rect.bottom > -160 && rect.top < viewportPx.height + 160 && rect.width > 0;
}
