import { SectionHeader } from "@/components/SectionHeader";
import { CapabilityTag } from "@/components/Tag";
import { InlineDiagram } from "@/components/InlineDiagram";
import { PROJECTS, type Project } from "@/lib/projects";

/**
 * Act 3 — Work (ADR-005 §5). Each project pins on scroll with a minimal
 * default view — title, tagline, capability chips, and its architecture
 * diagram as the hero visual — alternating text/diagram sides per project.
 *
 * Pinning is CSS `position: sticky` inside a tall runway (works identically
 * under Lenis, native scroll, and reduced-motion). The runway height beyond
 * one viewport (~100vh) is the dwell that slice 2.4's ScrollTrigger scrubs
 * the diagram draw-on timeline across. Below `lg` there is no pin — panels
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
        <ProjectPin key={project.slug} project={project} index={index} />
      ))}
    </section>
  );
}

/**
 * Panel width per diagram so tall diagrams (gmc is 420×580) never outgrow a
 * pinned laptop viewport, and short-wide ones (budget is 780×196) don't
 * shrink to a sliver. Keyed by slug; scales with the SVG's intrinsic ratio.
 */
const DIAGRAM_PANEL_WIDTH: Record<string, string> = {
  taxonomy: "max-w-lg",
  budget: "max-w-xl",
  gmc: "max-w-sm",
  personas: "max-w-lg",
};

function ProjectPin({ project, index }: { project: Project; index: number }) {
  const diagramRight = index % 2 === 0;
  const panelWidth = DIAGRAM_PANEL_WIDTH[project.slug] ?? "max-w-lg";
  return (
    <article data-project={project.slug} className="relative lg:h-[200vh]">
      <div className="flex flex-col justify-center py-20 lg:sticky lg:top-0 lg:h-screen lg:py-0">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 lg:grid-cols-2 lg:gap-16">
          <div className={diagramRight ? "" : "lg:order-2"}>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-subtle">
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(PROJECTS.length).padStart(2, "0")}
            </p>
            <h3 className="mt-4 text-3xl text-ink sm:text-4xl">
              {project.title}
            </h3>
            <p className="mt-4 max-w-md text-base leading-7 text-ink-muted">
              {project.tagline}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {project.capabilities.map((key) => (
                <CapabilityTag key={key} capability={key} />
              ))}
              {project.status === "in-progress" && (
                <span className="inline-flex items-center rounded-full border border-dashed border-line-strong px-2.5 py-0.5 font-mono text-xs tracking-wide text-ink-subtle">
                  in progress
                </span>
              )}
            </div>
          </div>

          <div
            className={
              diagramRight ? "lg:justify-self-end" : "lg:order-1 lg:justify-self-start"
            }
          >
            <div
              className={`w-full rounded-lg border border-line bg-surface/50 p-5 sm:p-7 ${panelWidth}`}
            >
              <InlineDiagram project={project} className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
