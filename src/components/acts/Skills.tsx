import { SectionHeader } from "@/components/SectionHeader";
import { Tag } from "@/components/Tag";
import { SKILL_TIERS } from "@/lib/resume";

/**
 * Skills — the three SKILL_TIERS from resume.ts, rendered as tier cards.
 * The tiers are deliberately honest about depth (core / build-with-AI /
 * working knowledge); the copy comes straight from the content model, so
 * skill edits stay src/lib edits.
 */
export function Skills() {
  return (
    <section
      id="skills"
      className="mx-auto w-full max-w-5xl px-6 py-24 sm:py-32"
    >
      <SectionHeader
        eyebrow="Skills"
        title="Three tiers, labeled honestly"
        description="Daily-driver measurement tools first, the agent-directed build stack second, and working knowledge listed as exactly that."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {SKILL_TIERS.map((tier) => (
          <article
            key={tier.name}
            className="rounded-lg border border-line bg-surface/50 p-6"
          >
            <h3 className="text-lg text-ink">{tier.name}</h3>
            {tier.blurb && (
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                {tier.blurb}
              </p>
            )}
            <ul className="mt-4 flex list-none flex-wrap gap-2">
              {tier.skills.map((skill) => (
                <li key={skill}>
                  <Tag>{skill}</Tag>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
