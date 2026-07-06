import { SectionHeader } from "@/components/SectionHeader";
import { ButtonLink } from "@/components/Button";
import { CubeCanvas } from "@/components/cube/CubeCanvas";
import { Hero } from "@/components/acts/Hero";
import { Work } from "@/components/acts/Work";
import { Magnetic } from "@/components/ui/Magnetic";
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

      {/* Act 1 — Hero */}
      <Hero />

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
      <Work />

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
          <Magnetic>
            <ButtonLink href={`mailto:${SITE.email}`} variant="primary">
              Email me
            </ButtonLink>
          </Magnetic>
          {SOCIAL_LINKS.map((link) => (
            <Magnetic key={link.label}>
              <ButtonLink href={link.href} external variant="outline">
                {link.label}
              </ButtonLink>
            </Magnetic>
          ))}
          <Magnetic>
            <ButtonLink href="/resume.pdf" variant="outline" download>
              Resume
            </ButtonLink>
          </Magnetic>
        </div>
      </section>
    </main>
  );
}
