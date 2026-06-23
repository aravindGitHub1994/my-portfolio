// The four disciplines this portfolio spans. Each maps to a celestial-palette
// color used consistently for tags, headings, and accents across the site.
// Class strings are written in full (no interpolation) so Tailwind detects them.

export type DisciplineKey = "analytics" | "writing" | "design" | "code";

export interface Discipline {
  key: DisciplineKey;
  label: string;
  blurb: string;
  /** Tailwind classes for the discipline tag/badge. */
  tag: string;
  /** Tailwind text color for accents. */
  text: string;
}

export const DISCIPLINES: Record<DisciplineKey, Discipline> = {
  analytics: {
    key: "analytics",
    label: "Analytics",
    blurb: "Turning data into measurement, dashboards, and decisions.",
    tag: "border-silver/30 bg-silver/10 text-silver",
    text: "text-silver",
  },
  writing: {
    key: "writing",
    label: "Writing",
    blurb: "Clear, considered prose — from docs to long-form essays.",
    tag: "border-gold/40 bg-gold/10 text-gold",
    text: "text-gold",
  },
  design: {
    key: "design",
    label: "Design",
    blurb: "Interfaces and visual systems with intent and polish.",
    tag: "border-lilac/40 bg-lilac/10 text-lilac",
    text: "text-lilac",
  },
  code: {
    key: "code",
    label: "Code",
    blurb: "Shipping reliable software, front to back.",
    tag: "border-moss-light/40 bg-moss-light/10 text-moss-light",
    text: "text-moss-light",
  },
};

export const DISCIPLINE_LIST: Discipline[] = Object.values(DISCIPLINES);
