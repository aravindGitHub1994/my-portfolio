"use client";

import { Figure } from "./Figure";

/**
 * `?scene=character` harness (plan-0009 §1.1, judged at HITL gate 1.2):
 * the figure on a stool proxy under a preview of the dusk rig — cool
 * blue-hour fill from the window side, warm key from the screen direction
 * (the real rig lands in 2.2). The default camera is chapter 2's mid-shot
 * orbit frame, from the figure's left so earring + earbud read in profile.
 */
export const CHARACTER_CAMERA = {
  position: [-1.55, 1.25, -0.55] as [number, number, number],
  target: [0, 1.02, -0.1] as [number, number, number],
};

/** Dark neutral for the proxy props — effect colors, not UI tokens. */
const PROXY_COLOR = "#3c3f47";

export function CharacterScene() {
  return (
    <>
      {/* Dusk preview: cool ambient + window-side fill (+X)… */}
      <ambientLight color="#31435f" intensity={0.55} />
      <directionalLight
        color="#7a9bd8"
        position={[2.5, 2.2, 0.8]}
        intensity={0.9}
      />
      {/* …and the CRT's warm key from the screen direction (front). */}
      <pointLight
        color="#ffb066"
        position={[0, 0.95, -0.85]}
        intensity={2.4}
        distance={3.5}
        decay={1.6}
      />

      <Figure />

      {/* Stool proxy. */}
      <mesh position={[0, 0.44, 0.02]}>
        <cylinderGeometry args={[0.17, 0.17, 0.05, 20]} />
        <meshStandardMaterial color={PROXY_COLOR} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.22, 0.02]}>
        <cylinderGeometry args={[0.03, 0.04, 0.4, 10]} />
        <meshStandardMaterial color={PROXY_COLOR} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.02, 0.02]}>
        <cylinderGeometry args={[0.16, 0.18, 0.03, 20]} />
        <meshStandardMaterial color={PROXY_COLOR} roughness={0.85} />
      </mesh>

      {/* Ground disc — silhouette/shadow reference only. */}
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[2.2, 48]} />
        <meshStandardMaterial color="#101116" roughness={1} />
      </mesh>
    </>
  );
}
