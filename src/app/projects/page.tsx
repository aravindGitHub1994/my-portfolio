import type { Metadata } from "next";
import { SectionHeader } from "@/components/SectionHeader";
import { ProjectGrid } from "@/components/ProjectGrid";
import { Reveal } from "@/components/Reveal";
import { PROJECTS } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Production systems shipped by directing AI coding agents — taxonomy engines, Bayesian budget models, and analytics tooling.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
      <Reveal>
        <SectionHeader
          eyebrow="Selected work"
          title="Projects"
          description="Real systems I've shipped by directing AI coding agents — each one private/proprietary, shown here as an architecture walkthrough rather than a live link."
        />
      </Reveal>

      <Reveal delay={120} className="mt-12">
        <ProjectGrid projects={PROJECTS} />
      </Reveal>
    </main>
  );
}
