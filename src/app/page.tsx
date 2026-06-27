import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { SectionHeader } from "@/components/SectionHeader";
import { ButtonLink } from "@/components/Button";
import { ProjectGrid } from "@/components/ProjectGrid";
import { PROJECTS } from "@/lib/projects";
import { SITE } from "@/lib/nav";

const AI_BUILD_POINTS = [
  {
    title: "I write the spec, agents write the code",
    body: "I scope the problem, lock the interfaces, and hand implementation to Claude Code / Gemini CLI agents — directing, reviewing, and integrating their output into production systems.",
  },
  {
    title: "Custom skills, not one-off prompts",
    body: "Reusable agent skills and spec-driven workflows turn ad-hoc AI use into a repeatable engineering process — the same rigor I'd expect from a human team.",
  },
  {
    title: "Analytics-first, so the build is the right one",
    body: "Years in GA4 / GTM / SQL / CRO mean the systems I direct AI to build are aimed at a real, measured problem — not a speculative one.",
  },
];

export default function Home() {
  const featured = PROJECTS.slice(0, 3);

  return (
    <>
      <Hero />

      {/* About / bio */}
      <section className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
        <Reveal>
          <SectionHeader
            eyebrow="About"
            title={`Hi, I'm ${SITE.name}`}
            description="I'm a Data Analytics Manager who leads with measurement — GA4, GTM, SQL, CRO — and ships the software those insights demand by directing AI coding agents. I'm not claiming to be a career software engineer; I'm claiming to be someone who can take a question all the way from raw data to a working product, with AI doing the heavy lifting on implementation while I own the spec, the architecture decisions, and the review."
          />
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/projects" variant="primary" size="sm">
              See my work
            </ButtonLink>
            <ButtonLink href="/contact" variant="ghost" size="sm">
              Get in touch
            </ButtonLink>
          </div>
        </Reveal>
      </section>

      {/* How I build with AI */}
      <section className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
        <Reveal>
          <SectionHeader
            eyebrow="How I work"
            title="How I build with AI"
            description="The differentiator isn't hand-coding depth — it's directing AI agents through a disciplined, spec-driven process to ship real systems."
          />
        </Reveal>

        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {AI_BUILD_POINTS.map((point, i) => (
            <Reveal as="li" key={point.title} delay={i * 90}>
              <div className="h-full rounded-lg border border-line bg-surface/60 p-6 transition-colors hover:border-line-strong">
                <h3 className="text-lg text-gold">{point.title}</h3>
                <p className="mt-2 text-sm leading-7 text-ink-muted">
                  {point.body}
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Featured work */}
      <section className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
        <Reveal>
          <SectionHeader
            eyebrow="Selected work"
            title="Featured work"
            description="A sample of production systems shipped by directing AI agents. All four are private — open one to see the architecture and the AI workflow behind it."
          />
        </Reveal>

        <Reveal delay={120} className="mt-12">
          <ProjectGrid projects={featured} />
        </Reveal>

        <Reveal delay={200} className="mt-10 text-center">
          <ButtonLink href="/projects" variant="outline" size="sm">
            View all projects
          </ButtonLink>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
        <Reveal
          className="rounded-lg border border-line bg-surface/60 px-8 py-12 text-center"
        >
          <SectionHeader
            align="center"
            title="Let's talk about what you're building"
            description="Open to roles and projects where data, AI-directed engineering, and a bias toward shipping all matter."
          />
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/contact" variant="primary">
              Get in touch
            </ButtonLink>
            <ButtonLink href="/resume" variant="outline">
              View resume
            </ButtonLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}
