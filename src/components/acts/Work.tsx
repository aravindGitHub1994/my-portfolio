import { SectionHeader } from "@/components/SectionHeader";
import { ProjectPin } from "@/components/acts/ProjectPin";
import { PROJECTS } from "@/lib/projects";

/**
 * Act 3 — Work (ADR-005 §5). Each project pins on scroll with a minimal
 * default view — title, tagline, capability chips, and its architecture
 * diagram as the hero visual — alternating text/diagram sides per project.
 *
 * Pinning is CSS `position: sticky` inside a tall runway (works identically
 * under Lenis, native scroll, and reduced-motion). The runway height beyond
 * one viewport (~100vh) is the dwell the diagram draw-on timeline is
 * scrubbed across (see ProjectPin). Below `lg` there is no pin — panels
 * stack and scroll normally.
 */
export function Work() {
  return (
    <section id="work">
      <div className="mx-auto w-full max-w-5xl px-6 pt-24 sm:pt-32">
        <SectionHeader
          eyebrow="Work"
          title="Four systems, shipped by directing AI"
          description="Real production systems — taxonomy engines, Bayesian budget models, feed monitoring, synthetic personas. Scroll each one to watch its architecture build."
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
