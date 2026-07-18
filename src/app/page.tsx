import { ButtonLink } from "@/components/Button";
import { Hero } from "@/components/acts/Hero";
import { Approach } from "@/components/acts/Approach";
import { Work } from "@/components/acts/Work";
import { Skills } from "@/components/acts/Skills";
import { Trajectory } from "@/components/acts/Trajectory";
import { Magnetic } from "@/components/ui/Magnetic";
import { SITE, SOCIAL_LINKS } from "@/lib/nav";

/**
 * The static floor (ADR-012 §9, plan-0009 slice 0.1): a clean, fast, 2D
 * single page composed entirely from src/lib content — simultaneously the
 * accessibility fallback, the SEO surface, and the always-shippable base
 * the Workstation experience will later mount over (slice 0.2+).
 */
export default function Home() {
  return (
    <main>
      <Hero />
      <Approach />
      <Work />
      <Skills />
      <Trajectory />

      {/* Contact */}
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
            <ButtonLink
              href={`mailto:${SITE.email}`}
              variant="primary"
              className="cta-split"
            >
              Email me
            </ButtonLink>
          </Magnetic>
          {SOCIAL_LINKS.map((link) => (
            <Magnetic key={link.label}>
              <ButtonLink
                href={link.href}
                external
                variant="outline"
                className="cta-split"
              >
                {link.label}
              </ButtonLink>
            </Magnetic>
          ))}
          <Magnetic>
            <ButtonLink
              href="/resume.pdf"
              variant="outline"
              download
              className="cta-split"
            >
              Resume
            </ButtonLink>
          </Magnetic>
        </div>
      </section>
    </main>
  );
}
