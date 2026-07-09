"use client";

import dynamic from "next/dynamic";

// ssr:false keeps WebGL entirely out of the static prerender, and the dynamic
// import code-splits three/R3F/drei/postprocessing off the initial bundle —
// the shell paints first, the scene streams in behind it.
const LensScene = dynamic(() => import("./LensScene"), { ssr: false });

/**
 * One persistent full-viewport canvas fixed behind the scrolling content —
 * The Lens (ADR-006): a dispersion prism refracting data packets into
 * insight-beams, reshaping prism → cube → globe across the acts.
 */
export function LensCanvas() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <LensScene />
    </div>
  );
}
