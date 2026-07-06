"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CapabilityTag } from "@/components/Tag";
import { InlineDiagram } from "@/components/InlineDiagram";
import { ReadTheBuild } from "@/components/acts/ReadTheBuild";
import {
  buildDrawTimeline,
  spawnPackets,
} from "@/lib/diagramAnimation";
import { cubeState } from "@/components/cube/cubeState";
import type { Project } from "@/lib/projects";

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

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * One pinned project panel (ADR-005 §5). The sticky pin itself is CSS (see
 * Work.tsx); this component wires the motion to it:
 *
 * - the diagram's draw-on timeline is scrubbed across the article's scroll
 *   span, so the architecture builds as the pin dwells (P2.4);
 * - packets loop only while the article is on screen — visibility-gated,
 *   never scrubbed (diagram convention);
 * - an exclusive mid-viewport trigger writes cubeState.workProject so the
 *   cube's face projects the active project's diagram.
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

  // Cube-face sync is independent of SVG inlining (textures load from the
  // same files in CubeScene), so it wires on mount.
  useEffect(() => {
    if (reducedMotion()) return;
    gsap.registerPlugin(ScrollTrigger);
    const slug = project.slug;
    const active = ScrollTrigger.create({
      trigger: article.current,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: (self) => {
        if (self.isActive) cubeState.workProject = slug;
        else if (cubeState.workProject === slug) cubeState.workProject = null;
      },
    });
    return () => {
      active.kill();
      if (cubeState.workProject === slug) cubeState.workProject = null;
    };
  }, [project.slug]);

  const handleSvgReady = useCallback(
    (svg: SVGSVGElement) => {
      if (reducedMotion()) return;
      gsap.registerPlugin(ScrollTrigger);
      disposeDraw.current?.();

      const timeline = buildDrawTimeline(svg);
      // Force-render end→start once so every stepped fromTo initializes its
      // hidden state — otherwise later steps sit visible until the scrubbed
      // playhead first crosses them.
      timeline.progress(1).progress(0);
      const draw = ScrollTrigger.create({
        trigger: article.current,
        start: "top 70%",
        end: "bottom bottom",
        scrub: true,
        animation: timeline,
      });

      const packets = spawnPackets(svg);
      const visibility = ScrollTrigger.create({
        trigger: article.current,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) =>
          self.isActive ? packets.play() : packets.pause(),
      });

      disposeDraw.current = () => {
        draw.kill();
        visibility.kill();
        timeline.kill();
        packets.destroy();
        disposeDraw.current = null;
      };
    },
    [],
  );

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
      className="relative lg:h-[200vh]"
    >
      <div className="flex flex-col justify-center py-20 lg:sticky lg:top-0 lg:h-screen lg:py-0">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 lg:grid-cols-2 lg:gap-16">
          <div className={diagramRight ? "" : "lg:order-2"}>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-subtle">
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(count).padStart(2, "0")}
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
            <div
              className={`w-full rounded-lg border border-line bg-surface/50 p-5 sm:p-7 ${panelWidth}`}
            >
              <InlineDiagram
                project={project}
                className="w-full"
                onSvgReady={handleSvgReady}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
