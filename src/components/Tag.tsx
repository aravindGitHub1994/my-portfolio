import type { DisciplineKey } from "@/lib/disciplines";
import { DISCIPLINES } from "@/lib/disciplines";

const baseTag =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium font-mono tracking-wide";

/** A discipline badge (Analytics / Writing / Design / Code) with its themed color. */
export function DisciplineTag({ discipline }: { discipline: DisciplineKey }) {
  const d = DISCIPLINES[discipline];
  return <span className={`${baseTag} ${d.tag}`}>{d.label}</span>;
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
