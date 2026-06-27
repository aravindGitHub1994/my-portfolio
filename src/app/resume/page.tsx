import type { Metadata } from "next";
import { SectionHeader } from "@/components/SectionHeader";
import { Reveal } from "@/components/Reveal";
import { Tag } from "@/components/Tag";
import { ButtonLink } from "@/components/Button";
import { SKILL_TIERS, EXPERIENCE, EDUCATION } from "@/lib/resume";

export const metadata: Metadata = {
  title: "Resume",
  description:
    "Skills, experience, and education — analytics-first, builds production software with AI agents.",
  alternates: { canonical: "/resume" },
};

export default function ResumePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-20 sm:py-28">
      <Reveal>
        <SectionHeader
          eyebrow="Resume"
          title="Skills & experience"
          description="A working summary. Download the full resume or reach out for details."
        />
        <div className="mt-6">
          <ButtonLink href="/resume.pdf" variant="outline" size="sm" external>
            Download résumé (PDF)
          </ButtonLink>
        </div>
      </Reveal>

      {/* Skills by proficiency tier */}
      <section className="mt-16">
        <h3 className="text-xl text-ink">Skills</h3>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {SKILL_TIERS.map((tier, i) => (
            <Reveal key={tier.name} delay={i * 80}>
              <div className="flex h-full flex-col rounded-lg border border-line bg-surface/60 p-5">
                <h4 className="text-base text-gold">{tier.name}</h4>
                {tier.blurb && (
                  <p className="mt-1.5 text-sm leading-6 text-ink-subtle">
                    {tier.blurb}
                  </p>
                )}
                <ul className="mt-3 flex flex-wrap gap-2">
                  {tier.skills.map((skill) => (
                    <li key={skill}>
                      <Tag>{skill}</Tag>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Experience */}
      <section className="mt-16">
        <h3 className="text-xl text-ink">Experience</h3>
        <ol className="mt-6 space-y-8 border-l border-line pl-6">
          {EXPERIENCE.map((job, i) => (
            <Reveal as="li" key={`${job.org}-${i}`} delay={i * 80}>
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold ring-4 ring-bg"
                />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-lg text-ink">{job.role}</h4>
                  <span className="font-mono text-xs text-ink-subtle">
                    {job.period}
                  </span>
                </div>
                <p className="text-sm text-gold">{job.org}</p>
                <ul className="mt-3 space-y-1.5">
                  {job.points.map((point) => (
                    <li
                      key={point}
                      className="text-sm leading-7 text-ink-muted"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Education */}
      <section className="mt-16">
        <h3 className="text-xl text-ink">Education</h3>
        <ul className="mt-6 space-y-4">
          {EDUCATION.map((ed) => (
            <Reveal as="li" key={ed.credential}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-line bg-surface/60 p-5">
                <div>
                  <h4 className="text-base text-ink">{ed.credential}</h4>
                  <p className="text-sm text-ink-muted">{ed.institution}</p>
                </div>
                <span className="font-mono text-xs text-ink-subtle">
                  {ed.period}
                </span>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>
    </main>
  );
}
