// Runtime side of the diagram convention (docs/diagram-authoring.md):
// draw-on timelines scrubbed by scroll, and looping data packets.
// Works on the hand-structured SVGs in public/diagrams/ once inlined.

import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

const ACCENT = "#3d74ff";
const STEP_SECONDS = 0.5;

interface StepBuckets {
  edges: SVGElement[];
  arrows: SVGElement[];
  nodes: SVGElement[];
  labels: SVGElement[];
}

/**
 * Paused timeline that builds the diagram step by step (data-step order):
 * edges draw via dash-offset (pathLength=1), arrowheads pop when their edge
 * lands, nodes fade+rise, key nodes flash their accent stroke. Meant to be
 * scrubbed by a ScrollTrigger; total duration = steps × STEP_SECONDS.
 */
export function buildDrawTimeline(svg: SVGSVGElement): gsap.core.Timeline {
  const byStep = new Map<number, StepBuckets>();
  svg.querySelectorAll<SVGElement>("[data-step]").forEach((el) => {
    const step = Number(el.dataset.step ?? "0");
    let bucket = byStep.get(step);
    if (!bucket) {
      bucket = { edges: [], arrows: [], nodes: [], labels: [] };
      byStep.set(step, bucket);
    }
    if (el.classList.contains("dg-edge")) bucket.edges.push(el);
    else if (el.classList.contains("dg-arrow")) bucket.arrows.push(el);
    else if (el.classList.contains("dg-node")) bucket.nodes.push(el);
    else bucket.labels.push(el);
  });

  const tl = gsap.timeline({ paused: true });
  [...byStep.keys()]
    .sort((a, b) => a - b)
    .forEach((step, i) => {
      const at = i * STEP_SECONDS;
      const b = byStep.get(step)!;
      if (b.edges.length) {
        tl.fromTo(
          b.edges,
          { strokeDasharray: 1, strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 0.4, ease: "none" },
          at,
        );
      }
      if (b.arrows.length) {
        // Opacity only — arrows carry authored rotate() transforms that a
        // GSAP transform tween would clobber.
        tl.fromTo(
          b.arrows,
          { opacity: 0 },
          { opacity: 1, duration: 0.12 },
          at + (b.edges.length ? 0.34 : 0),
        );
      }
      if (b.nodes.length) {
        tl.fromTo(
          b.nodes,
          { opacity: 0, y: 7 },
          { opacity: 1, y: 0, duration: 0.32, ease: "power2.out", stagger: 0.06 },
          at,
        );
        b.nodes.forEach((node) => {
          if (node.dataset.key !== "true") return;
          const shape = node.querySelector("rect");
          if (!shape) return;
          tl.fromTo(
            shape,
            { attr: { "stroke-width": 1.5 } },
            {
              attr: { "stroke-width": 2.6 },
              duration: 0.14,
              yoyo: true,
              repeat: 1,
            },
            at + 0.3,
          );
        });
      }
      if (b.labels.length) {
        tl.fromTo(
          b.labels,
          { opacity: 0 },
          { opacity: 1, duration: 0.25 },
          at + 0.15,
        );
      }
    });
  return tl;
}

export interface PacketController {
  play(): void;
  pause(): void;
  destroy(): void;
}

/**
 * Spawns one electric packet per edge along its path (ping-pong on
 * data-bidir edges). Paused by default. `loop: true` repeats forever
 * (visibility-gated by the caller); `loop: false` plays a single pass —
 * ADR-006 §5/§6: packets flow the edges **once, on entry**, then settle.
 */
export function spawnPackets(
  svg: SVGSVGElement,
  { loop = true }: { loop?: boolean } = {},
): PacketController {
  gsap.registerPlugin(MotionPathPlugin);
  const ns = "http://www.w3.org/2000/svg";
  const layer = document.createElementNS(ns, "g");
  layer.setAttribute("class", "dg-packet-layer");
  svg.appendChild(layer);

  const timelines: gsap.core.Timeline[] = [];
  svg.querySelectorAll<SVGPathElement>(".dg-edge").forEach((edge, i) => {
    const packet = document.createElementNS(ns, "circle");
    packet.setAttribute("r", "3");
    packet.setAttribute("fill", ACCENT);
    packet.setAttribute("opacity", "0");
    layer.appendChild(packet);

    const bidir = edge.dataset.bidir === "true";
    const travel = gsap.utils.clamp(0.9, 2.6, edge.getTotalLength() / 90);

    const run = gsap.timeline({
      repeat: loop ? -1 : 0,
      repeatDelay: 0.5,
      delay: i * 0.4,
      paused: true,
    });
    run
      .to(packet, { opacity: 0.9, duration: 0.15 }, 0.02)
      .to(
        packet,
        {
          motionPath: { path: edge, align: edge, alignOrigin: [0.5, 0.5] },
          duration: travel,
          ease: bidir ? "power1.inOut" : "none",
        },
        0,
      )
      .to(packet, { opacity: 0, duration: 0.15 }, travel - 0.13);
    if (bidir) {
      run
        .to(packet, { opacity: 0.9, duration: 0.15 }, travel + 0.32)
        .to(
          packet,
          {
            motionPath: {
              path: edge,
              align: edge,
              alignOrigin: [0.5, 0.5],
              start: 1,
              end: 0,
            },
            duration: travel,
            ease: "power1.inOut",
          },
          travel + 0.3,
        )
        .to(packet, { opacity: 0, duration: 0.15 }, travel * 2 + 0.17);
    }
    timelines.push(run);
  });

  return {
    play: () => timelines.forEach((t) => t.play()),
    pause: () => timelines.forEach((t) => t.pause()),
    destroy: () => {
      timelines.forEach((t) => t.kill());
      layer.remove();
    },
  };
}
