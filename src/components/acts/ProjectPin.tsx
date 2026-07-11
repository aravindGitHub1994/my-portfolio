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
import { lensState } from "@/components/lens/lensState";
import { registerProjectionTarget } from "@/components/lens/projectionTargets";
import { buildDrawTimeline, spawnPackets } from "@/lib/diagramAnimation";
import { mulberry32 } from "@/lib/prng";
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

// Shard grid for the window assembly (ADR-010 §3) — coarse blocks echoing
// the kinetic refract-in vocabulary. Chromatic tints cycle accent / warm /
// cool fringe (effect colors, like the shader ramps — not UI tokens).
const SHARD_COLS = 6;
const SHARD_ROWS = 4;
const SHARD_TINTS = [
  "rgba(61, 116, 255, 0.50)",
  "rgba(255, 80, 80, 0.30)",
  "rgba(90, 200, 255, 0.30)",
];

/**
 * DOM/CSS overlay the assembly animates — the window is deliberately NOT a
 * persistent GL twin (ADR-010 §1 exclusion). Invisible in the prerender
 * (overlay and every shard start at opacity 0) so the static export always
 * shows the finished card.
 */
function ShardOverlay({
  overlayRef,
}: {
  overlayRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden opacity-0"
    >
      {Array.from({ length: SHARD_COLS * SHARD_ROWS }, (_, i) => (
        <div
          key={i}
          data-shard
          className="absolute opacity-0"
          style={{
            left: `${((i % SHARD_COLS) / SHARD_COLS) * 100}%`,
            top: `${(Math.floor(i / SHARD_COLS) / SHARD_ROWS) * 100}%`,
            width: `${100 / SHARD_COLS}%`,
            height: `${100 / SHARD_ROWS}%`,
            background: SHARD_TINTS[i % SHARD_TINTS.length],
          }}
        />
      ))}
    </div>
  );
}

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
  const overlay = useRef<HTMLDivElement>(null);
  const disposeDraw = useRef<(() => void) | null>(null);

  // The preview element is this card's projection target (ADR-008 §2) — the
  // prism's beams curve into it while the card is pinned. Every card
  // registers, including the screenshot-less diagram panel.
  useEffect(() => {
    const el = preview.current;
    if (!el) return;
    return registerProjectionTarget(index, el);
  }, [index]);

  // Window assembly (ADR-010 §3, amending ADR-008 §2): once on first entry
  // the preview resolves from chromatic shards, timed to the beams first
  // locking onto this card (lensState.projection). Where beams never lock —
  // low/static tier, or the lock times out — it falls back to the previous
  // plain fade/rise. Same 62% line as the diagram draw-on beat.
  useEffect(() => {
    if (reducedMotion()) return;
    const el = preview.current;
    const ov = overlay.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);

    // Hidden from effect-time until its entrance plays (matches the old
    // paused fromTo's immediate render). Prerender markup is never hidden.
    gsap.set(el, { opacity: 0 });

    const rnd = mulberry32(index * 2654435761 + 97);
    let active: gsap.core.Timeline | gsap.core.Tween | null = null;
    let waitStart = 0;

    const plainFade = () =>
      gsap.fromTo(
        el,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" },
      );

    const shardAssembly = () => {
      const shards = ov
        ? Array.from(ov.querySelectorAll<HTMLElement>("[data-shard]"))
        : [];
      if (!ov || shards.length === 0) return plainFade();

      const tl = gsap.timeline({
        onComplete: () => {
          el.style.filter = "";
        },
      });
      tl.set(ov, { opacity: 1 }, 0);
      // Shards flicker in displaced, settle, then gate out on their own
      // thresholds — the kinetic refract-in vocabulary in DOM form.
      shards.forEach((shard) => {
        tl.fromTo(
          shard,
          {
            opacity: 0,
            x: (rnd() - 0.5) * 44,
            y: (rnd() - 0.5) * 56,
            scale: 0.72,
          },
          { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.24, ease: "power2.out" },
          rnd() * 0.18,
        );
        tl.to(
          shard,
          { opacity: 0, duration: 0.3, ease: "power1.in" },
          0.36 + rnd() * 0.3,
        );
      });
      // The window itself resolves under the shards with an RGB fringe
      // easing to crisp.
      const fringe = { px: 6 };
      tl.fromTo(
        el,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" },
        0.16,
      );
      tl.to(
        fringe,
        {
          px: 0,
          duration: 0.6,
          ease: "power2.out",
          onUpdate: () => {
            el.style.filter =
              fringe.px < 0.1
                ? ""
                : `drop-shadow(${fringe.px}px 0 0 rgba(255, 80, 80, 0.45)) ` +
                  `drop-shadow(${-fringe.px}px 0 0 rgba(90, 200, 255, 0.45))`;
          },
        },
        0.16,
      );
      tl.set(ov, { opacity: 0 });
      return tl;
    };

    // Waits for this card's beam lock before assembling. Non-high tiers
    // fade after the old rise's 0.25s beat; a high tier that never locks
    // (pin skipped by fast scroll) gives up at 1.2s — the endpoint sweep
    // damps in ~0.3s, so a real lock lands well inside that.
    const tickWait = () => {
      const p = lensState.projection;
      const tier = lensState.fidelityTier;
      const locked = tier === "high" && p.index === index && p.blend > 0.05;
      const waited = performance.now() - waitStart;
      const giveUp =
        waited > 1200 ||
        (tier !== "pending" && tier !== "high" && waited > 250);
      if (!locked && !giveUp) return;
      gsap.ticker.remove(tickWait);
      active = locked ? shardAssembly() : plainFade();
    };

    const entry = ScrollTrigger.create({
      trigger: article.current,
      start: "top 62%",
      once: true,
      onEnter: () => {
        waitStart = performance.now();
        gsap.ticker.add(tickWait);
      },
    });

    return () => {
      entry.kill();
      gsap.ticker.remove(tickWait);
      active?.kill();
      el.style.filter = "";
      gsap.set(el, { clearProps: "opacity,transform,filter" });
      if (ov) {
        gsap.set([ov, ...ov.querySelectorAll("[data-shard]")], {
          clearProps: "all",
        });
      }
    };
  }, [index]);

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
              <div ref={preview} className="relative w-full">
                <SafariWindow domain={project.domain}>
                  <ProjectRevealCurtain
                    screenshot={project.screenshot}
                    diagram={project.diagram}
                    title={project.title}
                  />
                </SafariWindow>
                <ShardOverlay overlayRef={overlay} />
              </div>
            ) : (
              // No screenshot to reveal from — the diagram resolves on scroll
              // entry instead (ADR-006 §6), animated inline so GSAP reaches it.
              <div
                ref={preview}
                className={`relative w-full ${panelWidth} rounded-lg border border-line bg-surface/50 p-4 sm:p-5`}
              >
                <InlineDiagram
                  project={project}
                  className="w-full"
                  onSvgReady={handleSvgReady}
                />
                <ShardOverlay overlayRef={overlay} />
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
