"use client";

import { useEffect, useState } from "react";
import { onCubeReady } from "@/components/cube/cubeState";
import { SITE } from "@/lib/nav";

/** How long to wait for WebGL before force-dismissing — the site must never
 *  stay locked behind the loader if context creation fails. */
const FAILSAFE_MS = 4000;

/**
 * Branded first-paint loader. Rendered visible in the prerendered HTML (no
 * flash of empty canvas), dismissed once the cube scene reports ready.
 * Fixed overlay → zero CLS. Reduced-motion gets an instant cut (the global
 * CSS zeroes transition durations).
 */
export function Loader() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const unsubscribe = onCubeReady(() => setDone(true));
    const failsafe = window.setTimeout(() => setDone(true), FAILSAFE_MS);
    return () => {
      unsubscribe();
      window.clearTimeout(failsafe);
    };
  }, []);

  return (
    <div
      role="status"
      aria-label={done ? undefined : "Loading"}
      aria-hidden={done}
      className={[
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-bg",
        "transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        done ? "pointer-events-none opacity-0" : "opacity-100",
      ].join(" ")}
    >
      <p className="text-lg tracking-tight text-ink">{SITE.name}</p>
      <span className="relative block h-px w-32 overflow-hidden bg-line">
        <span className="animate-loader-sweep absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-accent to-transparent" />
      </span>
    </div>
  );
}
