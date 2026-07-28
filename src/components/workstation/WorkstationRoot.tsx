"use client";

import dynamic from "next/dynamic";

// ssr:false keeps tier detection and three.js entirely client-side AND out
// of the initial bundle — the chunk only loads in the browser, and the
// prerender ships only the floor. Next 16 allows ssr:false only inside a
// client component, hence this thin wrapper.
const WorkstationExperience = dynamic(
  () => import("./WorkstationExperience"),
  { ssr: false },
);

/** Entry point for the Workstation experience (plan-0009 §0.2). */
export function WorkstationRoot() {
  return <WorkstationExperience />;
}
