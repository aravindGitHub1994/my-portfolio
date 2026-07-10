// Capability tags for projects — what kind of work each project demonstrates,
// not a language/skill claim. The Electric Dark system (ADR-005) is
// single-accent: capability chips all share one quiet accent treatment
// (distinguishing them from neutral tech Tags) instead of per-key hues.
// Class strings are written in full (no interpolation) so Tailwind detects them.

export type CapabilityKey =
  | "agentic-build"
  | "full-stack"
  | "data-pipeline"
  | "automation"
  | "api-integration"
  | "measurement"
  | "governance";

export interface Capability {
  key: CapabilityKey;
  label: string;
  /** Tailwind classes for the capability tag/badge. */
  tag: string;
  /** Tailwind text color for accents. */
  text: string;
}

const CHIP = "border-line-strong bg-surface/60 text-accent-bright";

export const CAPABILITIES: Record<CapabilityKey, Capability> = {
  "agentic-build": {
    key: "agentic-build",
    label: "Agentic Build",
    tag: CHIP,
    text: "text-accent-bright",
  },
  "full-stack": {
    key: "full-stack",
    label: "Full-Stack",
    tag: CHIP,
    text: "text-accent-bright",
  },
  "data-pipeline": {
    key: "data-pipeline",
    label: "Data Pipeline",
    tag: CHIP,
    text: "text-accent-bright",
  },
  automation: {
    key: "automation",
    label: "Automation",
    tag: CHIP,
    text: "text-accent-bright",
  },
  "api-integration": {
    key: "api-integration",
    label: "API Integration",
    tag: CHIP,
    text: "text-accent-bright",
  },
  measurement: {
    key: "measurement",
    label: "Measurement",
    tag: CHIP,
    text: "text-accent-bright",
  },
  governance: {
    key: "governance",
    label: "Governance",
    tag: CHIP,
    text: "text-accent-bright",
  },
};

export const CAPABILITY_LIST: Capability[] = Object.values(CAPABILITIES);
