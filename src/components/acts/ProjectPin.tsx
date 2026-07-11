"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CapabilityTag } from "@/components/Tag";
import { InlineDiagram } from "@/components/InlineDiagram";
import { ProjectRevealCurtain } from "@/components/acts/ProjectRevealCurtain";
import { ReadTheBuild } from "@/components/acts/ReadTheBuild";
import { SafariWindow } from "@/components/acts/SafariWindow";
import { KineticText } from "@/components/lens/kinetic/KineticText";
import { registerProjectionTarget } from "@/components/lens/projectionTargets";
import { buildDrawTimeline, spawnPackets } from "@/lib/diagramAnimation";
import type { Project } from "@/lib/projects";

/**
 * Panel width per diagram so tall diagrams (gmc 420×580, budget 440×492)
 * never outgrow a pinned laptop viewport, and wider ones don't shrink to a
 * sliver. Keyed by slug; scales with the SVG's intrinsic ratio.
 */
const DIAGRAM_PANEL_WIDTH: Record<string, string> = {
  tagging: "max-w-lg",
  taxonomy: "max-w-lg",
  budget: "max-w-sm",
  gmc: "max-w-sm",
  personas: "max-w-lg",
};

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * One pinned project panel. Where a recreated screenshot exists, the two beats
 * are overlaid into a single hover/focus **curtain reveal** (ADR-007): a blue
 * squiggle band sweeps across and paints the architecture diagram in over the
 * screenshot; leaving reverses it. This overrides ADR-006's two separately-shown
 * beats and the GlassImage WebGL distortion for these cards.
 *
 * The screenshot-less card (personas) has nothing to reveal from, so it keeps
 * the ADR-006 §6 behaviour: the inline diagram resolves **once, on scroll
 * entry** — the draw-on timeline plays, then packets flow the edges one pass.
 *
 * Reduced-motion: the curtain snaps instantly (handled inside the reveal
 * component); the scroll draw-on simply doesn't run — the SVG's resting state
 * is fully drawn by convention, so the finished diagram shows.
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
  const preview = useRef<HTMLDivElement>(null);
  const disposeDraw = useRef<(() => void) | null>(null);

  // The preview element is this card's projection target (ADR-008 §2) — the
  // prism's beams curve into it while the card is pinned. Every card
  // registers, including the screenshot-less diagram panel.
  useEffect(() => {
    const el = preview.current;
    if (!el) return;
    return registerProjectionTarget(index, el);
  }, [index]);

  // Window materialize (ADR-008 §2): the preview fades/rises once on first
  // entry. The short delay lands the rise with the projected stream's
  // endpoint sweep (damped ~0.3s) on the high tier; elsewhere it reads as a
  // plain entrance. Same 62% line as the diagram draw-on beat.
  useEffect(() => {
    if (reducedMotion()) return;
    const el = preview.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const rise = gsap.fromTo(
      el,
      { opacity: 0, y: 28 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay: 0.25,
        ease: "power2.out",
        paused: true,
      },
    );
    const entry = ScrollTrigger.create({
      trigger: article.current,
      start: "top 62%",
      once: true,
      onEnter: () => rise.play(),
    });
    return () => {
      entry.kill();
      rise.kill();
      gsap.set(el, { clearProps: "opacity,transform" });
    };
  }, []);

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
        <div
          className={`mx-auto grid w-full max-w-[1500px] grid-cols-1 items-center gap-10 px-6 lg:gap-16 ${
            diagramRight
              ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
              : "lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
          }`}
        >
          <div className={diagramRight ? "" : "lg:order-2"}>
            <KineticText
              as="p"
              className="font-mono text-xs uppercase tracking-[0.3em] text-ink-subtle"
            >
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(count).padStart(2, "0")}
            </KineticText>
            <KineticText as="h3" className="mt-4 text-3xl text-ink sm:text-4xl">
              {project.title}
            </KineticText>
            <KineticText
              as="p"
              variant="plain"
              className="mt-4 max-w-md text-base leading-7 text-ink-muted"
            >
              {project.tagline}
            </KineticText>
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

          {/* Preview takes the wider grid column (~60%) so the recreated
              screenshot and the diagram read at a legible size. Aligned with
              flex (not justify-self) because the curtain is an absolutely-
              positioned SVG with no in-flow width — justify-self would shrink
              it to 0. The curtain fills the column; the diagram-only fallback
              keeps its intrinsic-size cap. */}
          <div
            className={`flex ${
              diagramRight ? "lg:justify-end" : "lg:order-1 lg:justify-start"
            }`}
          >
            {project.screenshot ? (
              // Screenshot + diagram overlaid — the hover/focus curtain reveal,
              // mounted inside the Safari-style frame (ADR-008 §1).
              <div ref={preview} className="w-full">
                <SafariWindow domain={project.domain}>
                  <ProjectRevealCurtain
                    screenshot={project.screenshot}
                    diagram={project.diagram}
                    title={project.title}
                  />
                </SafariWindow>
              </div>
            ) : (
              // No screenshot to reveal from — the diagram resolves on scroll
              // entry instead (ADR-006 §6), animated inline so GSAP reaches it.
              <div
                ref={preview}
                className={`w-full ${panelWidth} rounded-lg border border-line bg-surface/50 p-4 sm:p-5`}
              >
                <InlineDiagram
                  project={project}
                  className="w-full"
                  onSvgReady={handleSvgReady}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
