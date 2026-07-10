"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import {
  createCurtainReveal,
  type CurtainRevealController,
} from "@/lib/curtainReveal";

/**
 * A project preview that reveals its architecture diagram from behind the
 * product screenshot on hover/focus (ADR-007). A band of thick blue squiggles
 * sweeps left→right; an SVG <mask> whose wavy leading edge trails the band by
 * ~24u paints the diagram in over the screenshot. Hover-out / blur reverses it.
 *
 * Everything is one inline <svg> — screenshot, masked diagram, and squiggles as
 * sibling layers — so the masking is SVG-internal (bulletproof across browsers)
 * rather than a CSS mask over HTML. The two moving <g> groups are translated by
 * GSAP; their path data is authored once (see {@link squigglePath} /
 * {@link maskFillPath}) and never rewritten per frame.
 *
 * SSR-safe: markup renders statically (the groups carry a start transform so no
 * un-swept frame flashes before hydration); all DOM/matchMedia access is in an
 * effect. Reusable for any {screenshot, diagram} pair.
 */

// ---- Preview geometry (all coordinates in viewBox user units) --------------
const VW = 1000;
const VH = 620;
const Y_TOP = -40; // sample the wave past the top/bottom edges so the sweeping
const Y_BOT = VH + 40; // column never leaves a seam at the frame boundary
const SAMPLES = 14;

/** Five parallel lines; x-offsets of each squiggle column from band centre. */
const LINE_OFFSETS = [-34, -17, 0, 17, 34];
const LINE_OPACITIES = [0.8, 0.66, 0.55, 0.66, 0.8]; // edges bolder, centre softer
/** Mask front sits ~24u right of the leading line → diagram revealed in the wake. */
const MASK_FRONT_OFFSET = 58;
const FILL_LEFT = -1500; // white wake extends far enough left to still cover x=0 at full sweep

// Sweep extent: parked so nothing shows at rest, cleared past the right edge at full reveal.
const START_X = -130;
const END_X = 1130;

/**
 * A single organic "hand-drawn" wave running top→bottom. Two sine harmonics,
 * fully deterministic — no Math.random (React-compiler lint), so the same path
 * renders on server and client. `offset` shifts the whole column horizontally.
 */
function wavePoints(offset: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const y = Y_TOP + t * (Y_BOT - Y_TOP);
    const x =
      offset +
      24 * Math.sin(t * Math.PI * 2 * 2.5) +
      8 * Math.sin(t * Math.PI * 2 * 5.5 + 1.3);
    pts.push([x, y]);
  }
  return pts;
}

/** Smooth the sampled column into quadratic segments through the midpoints. */
function smoothTail(pts: Array<[number, number]>): string {
  let d = "";
  for (let i = 1; i < pts.length - 1; i++) {
    const [cx, cy] = pts[i];
    const [nx, ny] = pts[i + 1];
    d += ` Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${((cx + nx) / 2).toFixed(1)} ${((cy + ny) / 2).toFixed(1)}`;
  }
  const [lx, ly] = pts[pts.length - 1];
  return `${d} L ${lx.toFixed(1)} ${ly.toFixed(1)}`;
}

/** Open stroked path for one visible squiggle line. */
function squigglePath(offset: number): string {
  const pts = wavePoints(offset);
  return `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}${smoothTail(pts)}`;
}

/**
 * The mask fill: a closed shape whose RIGHT edge is the wavy curtain front and
 * whose interior (everything to the left) is solid white = "revealed". As the
 * group translates right, more of the diagram passes into the white region.
 * The left side runs out to FILL_LEFT so the wake still covers x=0 at full sweep.
 */
function maskFillPath(offset: number): string {
  const pts = wavePoints(offset);
  const [x0, y0] = pts[0];
  return (
    `M ${FILL_LEFT} ${Y_TOP} L ${x0.toFixed(1)} ${y0.toFixed(1)}` +
    smoothTail(pts) +
    ` L ${FILL_LEFT} ${Y_BOT} Z`
  );
}

export interface ProjectRevealCurtainProps {
  /** Recreated dummy-data product screenshot (public path). */
  screenshot: string;
  /** Architecture diagram SVG (public path). */
  diagram: string;
  /** Project title — used to build the combined accessible name. */
  title: string;
  /** Squiggle colour; defaults to the on-brand electric accent token. */
  lineColor?: string;
  className?: string;
}

export function ProjectRevealCurtain({
  screenshot,
  diagram,
  title,
  lineColor = "var(--color-accent)",
  className = "",
}: ProjectRevealCurtainProps) {
  // Per-instance id so multiple cards never share a mask. Strip non-alphanumerics
  // — React's useId embeds ':' which is unsafe inside a url(#…) reference.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const maskId = `reveal-mask-${uid}`;

  const squigglesRef = useRef<SVGGElement>(null);
  const maskFrontRef = useRef<SVGGElement>(null);
  const controller = useRef<CurtainRevealController | null>(null);

  const squigglePaths = useMemo(
    () => LINE_OFFSETS.map((o) => squigglePath(o)),
    [],
  );
  const maskD = useMemo(() => maskFillPath(MASK_FRONT_OFFSET), []);

  useEffect(() => {
    const squiggles = squigglesRef.current;
    const maskFront = maskFrontRef.current;
    if (!squiggles || !maskFront) return;

    controller.current = createCurtainReveal({
      sweep: [squiggles, maskFront],
      squiggles,
      fromX: START_X,
      toX: END_X,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches,
    });

    return () => {
      controller.current?.destroy();
      controller.current = null;
    };
  }, []);

  const open = () => controller.current?.open();
  const close = () => controller.current?.close();

  return (
    // role="img" + a combined label conveys both representations to screen
    // readers in one announcement; tabIndex makes the reveal keyboard-reachable.
    <div
      className={`project-preview ${className}`}
      role="img"
      aria-label={`${title}: product screenshot — hover or focus to reveal the architecture diagram`}
      tabIndex={0}
      onPointerEnter={open}
      onPointerLeave={close}
      onFocus={open}
      onBlur={close}
    >
      <svg
        className="project-reveal-svg"
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          {/*
            Reveal mask: white = diagram shown, black = diagram hidden (the
            screenshot wins). The <g> holds one white fill whose wavy RIGHT edge
            is the curtain front. GSAP translates the whole <g> in x — the path
            is authored once, never rewritten, so this stays cheap at 60fps.
          */}
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={VW}
            height={VH}
          >
            <g ref={maskFrontRef} transform={`translate(${START_X} 0)`}>
              <path d={maskD} fill="#fff" />
            </g>
          </mask>
        </defs>

        {/* Layer 1 — product screenshot, cover-fit; painted over where revealed. */}
        <image
          className="project-ui"
          href={screenshot}
          x={0}
          y={0}
          width={VW}
          height={VH}
          preserveAspectRatio="xMidYMid slice"
        />

        {/* Layer 2 — architecture diagram, seen only through the mask, on a
            surface panel so it reads while the screenshot is still showing. */}
        <g mask={`url(#${maskId})`}>
          <rect x={0} y={0} width={VW} height={VH} fill="var(--color-surface)" />
          <image
            className="project-diagram"
            href={diagram}
            x={28}
            y={28}
            width={VW - 56}
            height={VH - 56}
            preserveAspectRatio="xMidYMid meet"
          />
        </g>

        {/* Layer 3 — the visible blue curtain; decorative, never traps pointer.
            non-scaling-stroke pins the thickness to a real 16px at any size. */}
        <g
          ref={squigglesRef}
          className="project-reveal-squiggles"
          transform={`translate(${START_X} 0)`}
          fill="none"
          stroke={lineColor}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {squigglePaths.map((d, i) => (
            <path
              key={i}
              d={d}
              strokeWidth={16}
              vectorEffect="non-scaling-stroke"
              opacity={LINE_OPACITIES[i]}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
