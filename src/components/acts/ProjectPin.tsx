"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CapabilityTag } from "@/components/Tag";
import { InlineDiagram } from "@/components/InlineDiagram";
import { ReadTheBuild } from "@/components/acts/ReadTheBuild";
import { KineticText } from "@/components/lens/kinetic/KineticText";
import { GlassImage } from "@/components/lens/kinetic/GlassImage";
import { buildDrawTimeline, spawnPackets } from "@/lib/diagramAnimation";
import type { Project } from "@/lib/projects";

/**
 * Panel width per diagram so tall diagrams (gmc 420×580, budget 440×492)
 * never outgrow a pinned laptop viewport, and wider ones don't shrink to a
 * sliver. Keyed by slug; scales with the SVG's intrinsic ratio.
 */
const DIAGRAM_PANEL_WIDTH: Record<string, string> = {
  taxonomy: "max-w-lg",
  budget: "max-w-sm",
  gmc: "max-w-sm",
  personas: "max-w-lg",
};

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * One pinned project panel — the two-beat refraction (ADR-006 §5):
 *
 * - **Beat 1** — the recreated dummy-data screenshot (when the asset exists;
 *   `GlassImage` distorts it subtly on the high tier and snaps it crisp when
 *   the project is centered);
 * - **Beat 2** — the architecture diagram resolves **once, on entry**: the
 *   draw-on timeline plays through, then data packets flow the edges a
 *   single pass and settle (ADR-006 §6 — the scroll-scrubbed draw-on and the
 *   cube-face projection are retired).
 *
 * Reduced-motion: none of this runs — the SVG's resting state is fully
 * drawn by convention, so the finished diagram simply shows.
 */
export function ProjectPin({
  project,
  index,
  count,
}: {
  project: Project;
  index: number;
  count: number;
}) {
  const article = useRef<HTMLElement>(null);
  const disposeDraw = useRef<(() => void) | null>(null);

  const handleSvgReady = useCallback((svg: SVGSVGElement) => {
    if (reducedMotion()) return;
    gsap.registerPlugin(ScrollTrigger);
    disposeDraw.current?.();

    const timeline = buildDrawTimeline(svg);
    // Force-render end→start once so every stepped fromTo initializes its
    // hidden state before the play-through.
    timeline.progress(1).progress(0);

    // Packets take one pass after the architecture has resolved.
    const packets = spawnPackets(svg, { loop: false });
    timeline.eventCallback("onComplete", () => packets.play());

    const entry = ScrollTrigger.create({
      trigger: article.current,
      start: "top 62%",
      once: true,
      onEnter: () => timeline.play(),
    });

    disposeDraw.current = () => {
      entry.kill();
      timeline.kill();
      packets.destroy();
      disposeDraw.current = null;
    };
  }, []);

  useEffect(
    () => () => {
      disposeDraw.current?.();
    },
    [],
  );

  const diagramRight = index % 2 === 0;
  const panelWidth = DIAGRAM_PANEL_WIDTH[project.slug] ?? "max-w-lg";
  return (
    <article
      ref={article}
      data-project={project.slug}
      className="relative lg:h-[150vh]"
    >
      <div className="flex flex-col justify-center py-20 lg:sticky lg:top-0 lg:h-screen lg:py-0">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 lg:grid-cols-2 lg:gap-16">
          <div className={diagramRight ? "" : "lg:order-2"}>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-subtle">
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(count).padStart(2, "0")}
            </p>
            <KineticText as="h3" className="mt-4 text-3xl text-ink sm:text-4xl">
              {project.title}
            </KineticText>
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
            <div className="mt-8">
              <ReadTheBuild project={project} />
            </div>
          </div>

          <div
            className={
              diagramRight
                ? "lg:justify-self-end"
                : "lg:order-1 lg:justify-self-start"
            }
          >
            <div className={`flex w-full flex-col gap-5 ${panelWidth}`}>
              {/* Beat 1 — the product is real (recreated, dummy data only) */}
              {project.screenshot && (
                <div className="overflow-hidden rounded-lg border border-line bg-surface/50">
                  <GlassImage
                    src={project.screenshot}
                    alt={`${project.title} product interface (recreated with fictional data)`}
                    className="w-full"
                  />
                </div>
              )}
              {/* Beat 2 — the architecture that shipped it */}
              <div className="w-full rounded-lg border border-line bg-surface/50 p-4 sm:p-5">
                <InlineDiagram
                  project={project}
                  className="w-full"
                  onSvgReady={handleSvgReady}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
