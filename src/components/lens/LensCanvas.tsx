"use client";

import dynamic from "next/dynamic";

// ssr:false keeps WebGL — including tier detection, which probes a GL
// context — entirely out of the static prerender, and the dynamic import
// code-splits three/R3F/drei/postprocessing off the initial bundle — the
// shell paints first, the scene streams in behind it.
const LensRoot = dynamic(() => import("./LensRoot"), { ssr: false });

/**
 * One persistent full-viewport canvas fixed behind the scrolling content —
 * The Lens (ADR-006, amended by ADR-008): a dispersion prism refracting data
 * packets into insight-beams. The prism is the constant object — during Work
 * it projects each card's window, and at Contact its beams underline the CTA.
 *
 * This is only the prerender-safe shell; LensRoot (client-only) owns the
 * fidelity tier, the FPS-watchdog downgrade, and the notice card (ADR-009).
 */
export function LensCanvas() {
  return <LensRoot />;
}
