import type { DisciplineKey } from "@/lib/disciplines";

// Placeholder resume content. Replace with real skills/experience (Issue 3.4).

export interface SkillGroup {
  discipline: DisciplineKey;
  skills: string[];
}

export const SKILL_GROUPS: SkillGroup[] = [
  {
    discipline: "analytics",
    skills: ["SQL", "Python", "Statistics", "A/B Testing", "Dashboards", "MMM"],
  },
  {
    discipline: "code",
    skills: ["TypeScript", "React", "Next.js", "Node.js", "Git", "Testing"],
  },
  {
    discipline: "design",
    skills: ["Figma", "Design Systems", "Typography", "UI/UX", "Prototyping"],
  },
  {
    discipline: "writing",
    skills: ["Long-form", "Documentation", "Editing", "Storytelling"],
  },
];

export interface ExperienceItem {
  role: string;
  org: string;
  period: string;
  points: string[];
}

export const EXPERIENCE: ExperienceItem[] = [
  {
    role: "Senior Analyst & Engineer",
    org: "Company Name",
    period: "2023 — Present",
    points: [
      "Led measurement and experimentation initiatives across product teams.",
      "Built data pipelines and dashboards that informed budget decisions.",
    ],
  },
  {
    role: "Designer & Developer",
    org: "Studio / Agency",
    period: "2021 — 2023",
    points: [
      "Designed and shipped brand systems and product interfaces.",
      "Bridged design and engineering with a shared component library.",
    ],
  },
  {
    role: "Writer & Analyst",
    org: "Freelance",
    period: "2019 — 2021",
    points: [
      "Published long-form essays and produced analytics reports for clients.",
    ],
  },
];

export interface EducationItem {
  credential: string;
  institution: string;
  period: string;
}

export const EDUCATION: EducationItem[] = [
  {
    credential: "B.S. in a Relevant Field",
    institution: "University Name",
    period: "2015 — 2019",
  },
];
