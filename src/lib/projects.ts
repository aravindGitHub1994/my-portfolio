import type { Project } from "@/components/ProjectCard";

// Placeholder featured projects spanning the four disciplines.
// Replace titles, summaries, and hrefs with real work (Issue 3.4).
export const PROJECTS: Project[] = [
  {
    slug: "marketing-mix-model",
    title: "Marketing Mix Modeling Dashboard",
    summary:
      "Built an end-to-end MMM pipeline and interactive dashboard to attribute revenue across channels and guide budget allocation.",
    disciplines: ["analytics", "code"],
    meta: "2025 · Lead Analyst",
    href: "https://example.com/mmm",
  },
  {
    slug: "design-system",
    title: "Component Design System",
    summary:
      "Designed and shipped a reusable component library with accessible patterns, design tokens, and documentation for a product team.",
    disciplines: ["design", "code"],
    meta: "2024 · Designer + Engineer",
    href: "https://example.com/design-system",
  },
  {
    slug: "long-form-essays",
    title: "Essays on Data & Craft",
    summary:
      "A collection of long-form essays exploring the intersection of measurement, storytelling, and product decisions.",
    disciplines: ["writing"],
    meta: "Ongoing · Writer",
    href: "https://example.com/essays",
  },
  {
    slug: "brand-identity",
    title: "Brand Identity & Visual Language",
    summary:
      "Developed a complete brand identity — logo, type system, and color language — translated into a living style guide.",
    disciplines: ["design", "writing"],
    meta: "2024 · Creative Lead",
    href: "https://example.com/brand",
  },
  {
    slug: "experiment-platform",
    title: "Experimentation Platform",
    summary:
      "Engineered an A/B testing platform with statistical rigor, automated reporting, and a self-serve experiment workflow.",
    disciplines: ["analytics", "code"],
    meta: "2023 · Engineer",
    href: "https://example.com/experiments",
  },
];
