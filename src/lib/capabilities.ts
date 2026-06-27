// Capability tags for projects — what kind of work each project demonstrates,
// not a language/skill claim. Each maps to a celestial-palette color used
// consistently for tags and accents. Class strings are written in full
// (no interpolation) so Tailwind detects them.

export type CapabilityKey =
  | "agentic-build"
  | "full-stack"
  | "data-pipeline"
  | "automation"
  | "api-integration";

export interface Capability {
  key: CapabilityKey;
  label: string;
  /** Tailwind classes for the capability tag/badge. */
  tag: string;
  /** Tailwind text color for accents. */
  text: string;
}

export const CAPABILITIES: Record<CapabilityKey, Capability> = {
  "agentic-build": {
    key: "agentic-build",
    label: "Agentic Build",
    tag: "border-gold/40 bg-gold/10 text-gold",
    text: "text-gold",
  },
  "full-stack": {
    key: "full-stack",
    label: "Full-Stack",
    tag: "border-moss-light/40 bg-moss-light/10 text-moss-light",
    text: "text-moss-light",
  },
  "data-pipeline": {
    key: "data-pipeline",
    label: "Data Pipeline",
    tag: "border-silver/30 bg-silver/10 text-silver",
    text: "text-silver",
  },
  automation: {
    key: "automation",
    label: "Automation",
    tag: "border-lilac/40 bg-lilac/10 text-lilac",
    text: "text-lilac",
  },
  "api-integration": {
    key: "api-integration",
    label: "API Integration",
    tag: "border-plum/40 bg-plum/10 text-plum",
    text: "text-plum",
  },
};

export const CAPABILITY_LIST: Capability[] = Object.values(CAPABILITIES);
