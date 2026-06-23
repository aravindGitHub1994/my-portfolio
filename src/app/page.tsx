import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { SectionHeader } from "@/components/SectionHeader";
import { DISCIPLINE_LIST } from "@/lib/disciplines";

export default function Home() {
  return (
    <>
      <Hero />

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
