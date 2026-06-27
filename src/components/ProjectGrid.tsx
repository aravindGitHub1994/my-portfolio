"use client";

import { useState } from "react";
import type { Project } from "@/lib/projects";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectModal } from "@/components/ProjectModal";

/**
 * Owns which project (if any) is open in the lightbox modal and renders the
 * card grid + modal together. Used on both the home page (a "Featured work"
 * subset) and the full /projects page.
 */
export function ProjectGrid({ projects }: { projects: Project[] }) {
  const [selected, setSelected] = useState<Project | null>(null);

  return (
    <>
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <li key={project.slug}>
            <ProjectCard project={project} onOpen={setSelected} />
          </li>
        ))}
      </ul>

      {selected && (
        <ProjectModal project={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
