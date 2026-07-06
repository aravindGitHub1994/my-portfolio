"use client";

import dynamic from "next/dynamic";

// ssr:false keeps WebGL entirely out of the static prerender, and the dynamic
// import code-splits three/R3F/drei off the initial bundle — the shell paints
// first, the scene streams in behind it.
const CubeScene = dynamic(() => import("./CubeScene"), { ssr: false });

/** One persistent full-viewport canvas fixed behind the scrolling content. */
export function CubeCanvas() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <CubeScene />
    </div>
  );
}
