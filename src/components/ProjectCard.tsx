import Link from "next/link";
import type { DisciplineKey } from "@/lib/disciplines";
import { DisciplineTag } from "@/components/Tag";

export interface Project {
  slug: string;
  title: string;
  summary: string;
  disciplines: DisciplineKey[];
  /** Optional external link (live project, repo, writeup). */
  href?: string;
  /** Short year/role meta line. */
  meta?: string;
}

/**
 * Card surface for a single portfolio project. The whole card is a link when an
 * href is provided; discipline tags sit above the title for quick scanning.
 */
export function ProjectCard({ project }: { project: Project }) {
  const inner = (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface/70 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:bg-surface-2/70">
      {/* Top glow accent on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {project.disciplines.map((d) => (
          <DisciplineTag key={d} discipline={d} />
        ))}
      </div>

      <h3 className="text-xl text-ink transition-colors group-hover:text-gold">
        {project.title}
      </h3>

      {project.meta && (
        <p className="mt-1 font-mono text-xs text-ink-subtle">{project.meta}</p>
      )}

      <p className="mt-3 flex-1 text-sm leading-7 text-ink-muted">
        {project.summary}
      </p>

      {project.href && (
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gold">
          View project
          <svg
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </article>
  );

  if (project.href) {
    return (
      <Link
        href={project.href}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full rounded-lg focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2"
        aria-label={`${project.title} — view project`}
      >
        {inner}
      </Link>
    );
  }

  return inner;
}
