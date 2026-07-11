// DEVIATION from ADR-010 §1 scope: chip text stays crisp DOM. The kinetic
// canvas is fixed at -z-10 — GL twins paint UNDER every DOM background, and
// these chips paint their own (Tag: opaque bg-surface; CapabilityTag:
// bg-surface/60, which would wash a twin to 40%). Twinning the whole chip
// instead would drop its border/background while claimed (the rasterizer
// draws glyphs only). Flagged for the 6.2 owner review.

import type { CapabilityKey } from "@/lib/capabilities";
import { CAPABILITIES } from "@/lib/capabilities";

const baseTag =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium font-mono tracking-wide";

/** A capability badge (Agentic Build / Full-Stack / Data Pipeline / ...) with its themed color. */
export function CapabilityTag({ capability }: { capability: CapabilityKey }) {
  const c = CAPABILITIES[capability];
  return <span className={`${baseTag} ${c.tag}`}>{c.label}</span>;
}

/** A neutral tag for tech/skills (e.g. "TypeScript", "SQL"). */
export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={`${baseTag} border-line-strong bg-surface text-ink-muted`}
    >
      {children}
    </span>
  );
}
