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
