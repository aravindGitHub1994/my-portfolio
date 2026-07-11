import type { PerspectiveCamera } from "three";

/**
 * DOM→world mapping shared by the kinetic layers and the projection
 * targeting spine (ADR-008 §2). The camera looks straight down -z (no
 * lookAt), so the screen center maps to (camera.x, camera.y) at every depth
 * and rect px offsets scale linearly by world-units-per-pixel at that depth.
 */
export function rectToWorld(
  rect: DOMRect,
  camera: PerspectiveCamera,
  viewportPx: { width: number; height: number },
  planeZ: number,
): { x: number; y: number; worldPerPx: number } {
  const dist = camera.position.z - planeZ;
  const vFov = (camera.fov * Math.PI) / 180;
  const worldPerPx = (2 * Math.tan(vFov / 2) * dist) / viewportPx.height;
  return {
    x:
      (rect.left + rect.width / 2 - viewportPx.width / 2) * worldPerPx +
      camera.position.x,
    y:
      -(rect.top + rect.height / 2 - viewportPx.height / 2) * worldPerPx +
      camera.position.y,
    worldPerPx,
  };
}
