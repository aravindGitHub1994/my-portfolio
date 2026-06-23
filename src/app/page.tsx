import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { SectionHeader } from "@/components/SectionHeader";
import { ButtonLink } from "@/components/Button";
import { DISCIPLINE_LIST } from "@/lib/disciplines";
import { SITE } from "@/lib/nav";

export default function Home() {
  return (
    <>
      <Hero />

      {/* About / bio */}
      <section className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-[200px_1fr] sm:items-center">
          <Reveal>
            <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full border border-line-strong bg-surface text-5xl text-gold sm:mx-0">
              <span aria-hidden="true">✦</span>
              <span className="sr-only">Profile photo placeholder</span>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <SectionHeader
              eyebrow="About"
              title={`Hi, I'm ${SITE.name}`}
              description="A multi-disciplinary maker working at the seams between data, design, code, and words. I like taking an idea from a raw question all the way to a measured, well-crafted, clearly-told result."
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
        </div>
      </section>

      {/* Discipline highlights — demonstrates Reveal scroll animation */}
      <section className="mx-auto w-full max-w-5xl px-6 py-20 sm:py-28">
        <Reveal>
          <SectionHeader
            eyebrow="What I do"
            title="Four disciplines, one practice"
            description="Each project draws on a different mix of these. Together they let me take an idea from raw data to a shipped, well-told product."
          />
        </Reveal>

        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {DISCIPLINE_LIST.map((d, i) => (
            <Reveal as="li" key={d.key} delay={i * 90}>
              <div className="h-full rounded-lg border border-line bg-surface/60 p-6 transition-colors hover:border-line-strong">
                <h3 className={`text-lg ${d.text}`}>{d.label}</h3>
                <p className="mt-2 text-sm leading-7 text-ink-muted">
                  {d.blurb}
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>
    </>
  );
}
