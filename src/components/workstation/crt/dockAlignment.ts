// Dock alignment (plan-0009 §4.2): size/position the DOM shell to the
// CRT screen mesh's screen-space quad. The dock pose is analytic —
// camera square-on at DOCK_DISTANCE with a known fov — so the projected
// rect is exact math from the viewport, no camera readback, and holds
// for any DPR (CSS px are DPR-independent). Re-run on resize.

import { DESKTOP_H, DESKTOP_W } from "@/lib/win98State";
import { CRT_SCREEN_SIZE } from "../builders/crt";
import { DOCK_DISTANCE } from "../choreography/cameraPath";

/** Must match the journey Canvas camera fov. */
const DOCK_FOV_DEG = 50;

export interface DockRect {
  left: number;
  top: number;
  width: number;
  height: number;
  /** DOM-shell scale factors (640×480 virtual units → CSS px). The
   *  screen is 5:4-ish while the desktop is 4:3, so X and Y differ
   *  slightly — the painter texture stretches identically. */
  scaleX: number;
  scaleY: number;
}

export function computeDockRect(
  viewportWidth: number,
  viewportHeight: number,
): DockRect {
  const halfFov = (DOCK_FOV_DEG / 2) * (Math.PI / 180);
  // World height visible at the screen plane, dock distance away.
  const visibleH = 2 * DOCK_DISTANCE * Math.tan(halfFov);
  const height = viewportHeight * (CRT_SCREEN_SIZE.height / visibleH);
  const width = height * (CRT_SCREEN_SIZE.width / CRT_SCREEN_SIZE.height);
  const rect: DockRect = {
    left: (viewportWidth - width) / 2,
    top: (viewportHeight - height) / 2,
    width,
    height,
    scaleX: width / DESKTOP_W,
    scaleY: height / DESKTOP_H,
  };
  if (process.env.NODE_ENV !== "production") {
    // 4.2 acceptance: alignment logged in dev. Analytic → error is the
    // subpixel rounding of the CSS transform only.
    console.info(
      `[dock] rect ${width.toFixed(1)}×${height.toFixed(1)} @ (${rect.left.toFixed(1)}, ${rect.top.toFixed(1)}) · dpr ${window.devicePixelRatio}`,
    );
  }
  return rect;
}
