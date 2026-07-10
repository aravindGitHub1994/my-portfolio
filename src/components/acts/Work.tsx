import { SectionHeader } from "@/components/SectionHeader";
import { ProjectPin } from "@/components/acts/ProjectPin";
import { PROJECTS } from "@/lib/projects";

/**
 * Act 3 — Work (ADR-006 §5). Each project pins briefly on scroll with a
 * minimal default view — title, tagline, capability chips, and its two-beat
 * visual (recreated screenshot when present, then the architecture diagram
 * resolving once on entry) — alternating text/visual sides per project.
 *
 * Pinning is CSS `position: sticky` inside a short runway (works identically
 * under Lenis, native scroll, and reduced-motion); the diagram animation is
 * a single play-through, never scrubbed. Below `lg` there is no pin —
 * panels stack and scroll normally.
 */
export function Work() {
  return (
    <section id="work">
      <div className="mx-auto w-full max-w-5xl px-6 pt-24 sm:pt-32">
        <SectionHeader
          eyebrow="Work"
          title="Measurement craft, then systems shipped by directing AI"
          description="Hands-on tagging and measurement work across hundreds of client accounts, then real production systems — taxonomy engines, Bayesian budget models, feed monitoring, synthetic personas. Each architecture resolves as it enters."
        />
      </div>

      {PROJECTS.map((project, index) => (
        <ProjectPin
          key={project.slug}
          project={project}
          index={index}
          count={PROJECTS.length}
        />
      ))}
    </section>
  );
}
