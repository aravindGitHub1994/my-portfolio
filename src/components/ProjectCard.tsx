"use client";

import { useRef, type MouseEvent } from "react";
import type { Project } from "@/lib/projects";
import { CapabilityTag } from "@/components/Tag";

const MAX_TILT_DEG = 6;

/**
 * Card surface for a single portfolio project. Click opens the project
 * modal (the parent ProjectGrid owns selection state). Capability tags sit
 * above the title for quick scanning; a "Private project" badge replaces
 * the old outbound link since none of the real projects are public.
 * Adds a pointer-driven 3D tilt + glow-border "gravity" feel on hover,
 * disabled under prefers-reduced-motion.
 */
export function ProjectCard({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: (project: Project) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  function handlePointerMove(e: MouseEvent<HTMLDivElement>) {
    const node = cardRef.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = node.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    const rotateY = (px - 0.5) * 2 * MAX_TILT_DEG;
    const rotateX = (0.5 - py) * 2 * MAX_TILT_DEG;
    node.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  }

  function handlePointerLeave() {
    const node = cardRef.current;
    if (!node) return;
    node.style.transform = "";
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(project)}
      aria-haspopup="dialog"
      className="block h-full w-full rounded-lg text-left focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2"
    >
      <div
        ref={cardRef}
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
        className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface/70 p-6 backdrop-blur-sm transition-[transform,border-color,background-color] duration-300 [transform-style:preserve-3d] hover:border-gold/40 hover:bg-surface-2/70 motion-reduce:hover:-translate-y-1 motion-reduce:hover:transform-none"
      >
        {/* Top glow accent on hover */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        {/* Outer glow border on hover ("gravity" lift) */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-lg opacity-0 shadow-[0_0_32px_-6px_rgba(212,175,55,0.45)] transition-opacity duration-300 group-hover:opacity-100"
        />

        <div className="mb-4 flex flex-wrap gap-2">
          {project.capabilities.map((c) => (
            <CapabilityTag key={c} capability={c} />
          ))}
        </div>

        <h3 className="text-xl text-ink transition-colors group-hover:text-gold">
          {project.title}
        </h3>

        <p className="mt-1 text-sm leading-7 text-ink-muted">
          {project.tagline}
        </p>

        <p className="mt-3 flex-1 text-sm leading-7 text-ink-subtle">
          {project.problem}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-2.5 py-0.5 text-xs font-mono tracking-wide text-ink-subtle">
            <svg
              viewBox="0 0 16 16"
              className="h-3 w-3"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="7"
                width="10"
                height="7"
                rx="1.2"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <path
                d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            Private project
          </span>

          {project.status === "in-progress" && (
            <span className="text-xs font-mono uppercase tracking-wide text-lilac">
              In progress
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
