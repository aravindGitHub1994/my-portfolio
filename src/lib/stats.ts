// Approach-act stat figures (ADR-006 §3, slice 3.3). Every number traces to
// content that already ships — a resume.ts bullet or an array length — and
// the traced bullets are quoted so drift is caught in review, not invented.

import { PROJECTS } from "./projects";
import { CAPABILITY_LIST } from "./capabilities";

export interface StatFigure {
  /** Final integer the count-up resolves to. */
  value: number;
  /** Rendered directly after the number (e.g. "+"). */
  suffix?: string;
  label: string;
}

export const APPROACH_STATS: StatFigure[] = [
  {
    // projects.ts PROJECTS["tagging"] outcome: "600+ client accounts audited,
    // tagged, or troubleshot since March 2021".
    value: 600,
    suffix: "+",
    label: "client accounts audited, tagged, or troubleshot",
  },
  {
    // resume.ts EXPERIENCE[Assembly Global]: "…Google Merchant Center
    // (44 sub-accounts)" — also the GMC Insights project scope.
    value: 44,
    label: "Merchant Center sub-accounts, one live dashboard",
  },
  {
    // resume.ts EXPERIENCE[Flatworld]: "…tagging architecture in Google Tag
    // Manager spanning 19 websites".
    value: 19,
    label: "websites under one tagging architecture",
  },
  {
    // resume.ts EXPERIENCE[Regalix]: "supported 200+ consultants with
    // advanced JavaScript and GTM solutions".
    value: 200,
    suffix: "+",
    label: "consultants supported as SME",
  },
  {
    value: PROJECTS.length,
    label: "projects documented end-to-end",
  },
  {
    value: CAPABILITY_LIST.length,
    label: "capability areas demonstrated",
  },
];
