"use client";

import { useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/projects";

/**
 * Inlines a first-party diagram SVG from public/diagrams/ so GSAP can reach
 * its nodes/edges (an <img> would seal them off). Same-origin fetch — CSP
 * connect-src 'self' holds. Falls back to a plain <img> (same intrinsic
 * geometry, so no layout shift) while loading or if the fetch fails.
 *
 * The injected markup is our own checked-in asset, never user input —
 * innerHTML is safe here by provenance, and `slug` comes from the typed
 * PROJECTS data, not from any URL or user value.
 */
export function InlineDiagram({
  project,
  className = "",
  onSvgReady,
}: {
  project: Pick<Project, "slug" | "title" | "diagram">;
  className?: string;
  onSvgReady?: (svg: SVGSVGElement) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [markup, setMarkup] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(project.diagram)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`${res.status}`))))
      .then((text) => {
        if (!cancelled) setMarkup(text);
      })
      .catch(() => {
        /* keep the <img> fallback */
      });
    return () => {
      cancelled = true;
    };
  }, [project.diagram]);

  useEffect(() => {
    if (!markup) return;
    const svg = host.current?.querySelector("svg");
    if (!svg) return;
    // Fluid inline sizing; the authored width/height stay in the file for
    // texture rasterization and the <img> fallback.
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.style.width = "100%";
    svg.style.height = "auto";
    onSvgReady?.(svg);
  }, [markup, onSvgReady]);

  if (!markup) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- static export (ADR-001): next/image needs a server
      <img
        src={project.diagram}
        alt={`${project.title} architecture diagram`}
        className={className}
      />
    );
  }
  return (
    <div
      ref={host}
      className={className}
      role="img"
      aria-label={`${project.title} architecture diagram`}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
