import type { Metadata } from "next";
import { SectionHeader } from "@/components/SectionHeader";
import { ProjectCard } from "@/components/ProjectCard";
import { Reveal } from "@/components/Reveal";
import { PROJECTS } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Featured projects across analytics, writing, design, and code.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
      <Reveal>
        <SectionHeader
          eyebrow="Selected work"
          title="Projects"
          description="A cross-section of recent work. Each project leans on a different blend of analytics, writing, design, and code."
        />
      </Reveal>

      <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((project, i) => (
          <Reveal as="li" key={project.slug} delay={(i % 3) * 90}>
            <ProjectCard project={project} />
          </Reveal>
        ))}
      </ul>
    </main>
  );
}
