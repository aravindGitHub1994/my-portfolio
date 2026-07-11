import { ButtonLink } from "@/components/Button";
import { LensCanvas } from "@/components/lens/LensCanvas";
import { LensChoreography } from "@/components/lens/LensChoreography";
import { ProjectionTarget } from "@/components/lens/ProjectionTarget";
import { CONTACT_TARGET } from "@/components/lens/projectionTargets";
import { KineticText } from "@/components/lens/kinetic/KineticText";
import { Hero } from "@/components/acts/Hero";
import { Approach } from "@/components/acts/Approach";
import { Work } from "@/components/acts/Work";
import { Trajectory } from "@/components/acts/Trajectory";
import { Magnetic } from "@/components/ui/Magnetic";
import { SITE, SOCIAL_LINKS } from "@/lib/nav";

/**
 * The single scroll-driven page (ADR-006, amended by ADR-008): five acts
 * around The Lens — a dispersion prism refracting data packets into
 * insight-beams. The prism never transforms: during Work it projects each
 * card's window, and at Contact its beams underline the CTA.
 */
export default function Home() {
  return (
    <main>
      <LensCanvas />
      <LensChoreography />

      {/* Act 1 — Hero */}
      <Hero />

      {/* Act 2 — Approach (slice 3.3: kinetic count-up stats) */}
      <Approach />

      {/* Act 3 — Work (P2) */}
      <Work />

      {/* Act 4 — Trajectory (P3.3) */}
      <Trajectory />

      {/* Act 5 — Contact (ADR-008 §3: the beams underline the CTA row) */}
      <section
        id="contact"
        className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-24 sm:py-32"
      >
        <KineticText as="h2" className="text-center text-4xl sm:text-5xl">
          Let&apos;s build something{" "}
          <span className="text-electric">exceptional</span>.
        </KineticText>
        <ProjectionTarget
          index={CONTACT_TARGET}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
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
        </ProjectionTarget>
      </section>
    </main>
  );
}
