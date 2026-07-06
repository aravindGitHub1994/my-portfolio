import { SectionHeader } from "@/components/SectionHeader";
import { ButtonLink } from "@/components/Button";
import { CubeCanvas } from "@/components/cube/CubeCanvas";
import { PROJECTS } from "@/lib/projects";
import { EXPERIENCE } from "@/lib/resume";
import { SITE, SOCIAL_LINKS } from "@/lib/nav";

/**
 * The single scroll-driven page (ADR-005): five acts around one morphing
 * glass data cube. Acts are placeholders until their slice lands —
 * Hero (P1.4), Work (P2), Approach + Trajectory (P3), Contact finale (P4).
 */
export default function Home() {
  return (
    <main>
      <CubeCanvas />

      {/* Act 1 — Hero (P1.4 builds the real content + scroll-morph) */}
      <section
        id="hero"
        className="relative flex min-h-screen flex-col items-center justify-center px-6"
      >
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent-bright">
          {SITE.name}
        </p>
        <h1 className="mt-6 max-w-3xl text-center text-5xl leading-tight sm:text-6xl">
          Data Analytics &amp; <span className="text-electric">AI systems</span>
        </h1>
        <p className="mt-6 max-w-xl text-center text-lg leading-8 text-ink-muted">
          I direct AI coding agents to ship production software — from raw data
          to working product.
        </p>
      </section>

      {/* Act 2 — Approach (P3.2) */}
      <section
        id="approach"
        className="mx-auto w-full max-w-5xl px-6 py-24 sm:py-32"
      >
        <SectionHeader
          eyebrow="Approach"
          title="I write the spec, agents write the code"
          description="Spec-driven development: I scope the problem, lock the interfaces, and direct Claude Code / Gemini CLI agents through implementation — owning the architecture decisions and the review."
        />
      </section>

      {/* Act 3 — Work (P2) */}
      <section
        id="work"
        className="mx-auto w-full max-w-5xl px-6 py-24 sm:py-32"
      >
        <SectionHeader
          eyebrow="Work"
          title="Four systems, shipped by directing AI"
          description="Real production systems — taxonomy engines, Bayesian budget models, feed monitoring, synthetic personas."
        />
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PROJECTS.map((project) => (
            <li
              key={project.slug}
              className="rounded-lg border border-line bg-surface/60 p-6"
            >
              <h3 className="text-lg text-ink">
                {project.title}
                {project.status === "in-progress" && (
                  <span className="ml-2 font-mono text-xs uppercase tracking-wide text-ink-subtle">
                    in progress
                  </span>
                )}
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                {project.tagline}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Act 4 — Trajectory (P3.3) */}
      <section
        id="trajectory"
        className="mx-auto w-full max-w-5xl px-6 py-24 sm:py-32"
      >
        <SectionHeader
          eyebrow="Trajectory"
          title="From tech support to data analytics leadership"
        />
        <ol className="mt-10 space-y-4 border-l border-line pl-6">
          {EXPERIENCE.map((item) => (
            <li key={item.org}>
              <p className="text-ink">{item.role}</p>
              <p className="text-sm text-ink-subtle">{item.org}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Act 5 — Contact (P4.1 adds the point-globe finale) */}
      <section
        id="contact"
        className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-24 sm:py-32"
      >
        <h2 className="text-center text-4xl sm:text-5xl">
          Let&apos;s build something{" "}
          <span className="text-electric">exceptional</span>.
        </h2>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href={`mailto:${SITE.email}`} variant="primary">
            Email me
          </ButtonLink>
          {SOCIAL_LINKS.map((link) => (
            <ButtonLink key={link.label} href={link.href} external variant="outline">
              {link.label}
            </ButtonLink>
          ))}
          <ButtonLink href="/resume.pdf" variant="outline" download>
            Resume
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
