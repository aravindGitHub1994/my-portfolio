import { OrbitRing } from "@/components/OrbitRing";
import { ButtonLink } from "@/components/Button";

/**
 * Landing hero. A serif display headline carries the single narrative, with a
 * circular portrait orbited by a ring of tool icons. The drifting starfield is
 * a single global background mounted in the root layout, not here; this shell
 * is server-rendered and the orbit ring is its only client-side piece.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Vignette so text stays legible over the global starfield. Kept clear
          through the mid-field so the sun/moon (top-right of the background
          canvas) aren't washed out; only the outer edge fades to the bg. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_62%,var(--color-bg)_112%)]"
      />

      <div className="relative mx-auto flex min-h-[78vh] max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
        <div className="relative h-40 w-40 sm:h-48 sm:w-48">
          <OrbitRing />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-2 rounded-full bg-gold/15 blur-2xl"
          />
          {/* Flip card: portrait flips around its vertical axis every ~10s to
              reveal a second photo. Pure CSS (static export safe); the global
              reduced-motion rule freezes it on the front face. */}
          <div className="relative h-full w-full [perspective:1200px]">
            <div className="animate-portrait-flip relative h-full w-full rounded-full [transform-style:preserve-3d]">
              {/* eslint-disable-next-line @next/next/no-img-element -- static export: plain img, no next/image optimization */}
              <img
                src="/aravind.jpg"
                alt="Portrait of Aravind Krishna Kumar"
                width={192}
                height={192}
                className="absolute inset-0 h-full w-full rounded-full border border-line-strong object-cover object-[center_10%] shadow-[0_0_40px_-8px_var(--color-glow)] [backface-visibility:hidden]"
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- static export: plain img, no next/image optimization */}
              <img
                src="/aravind-2.jpg"
                alt="Aravind Krishna Kumar working at his desk"
                width={192}
                height={192}
                className="absolute inset-0 h-full w-full rounded-full border border-line-strong object-cover object-[center_28%] shadow-[0_0_40px_-8px_var(--color-glow)] [transform:rotateY(180deg)] [backface-visibility:hidden]"
              />
            </div>
          </div>
        </div>

        <h1 className="hero-legible mt-10 text-balance text-5xl leading-[1.05] sm:text-6xl md:text-7xl">
          <span className="text-ink">I turn questions into</span>{" "}
          <span className="text-gilt">shipped products</span>
        </h1>

        <p className="hero-legible mt-6 max-w-xl text-pretty text-lg leading-8 text-ink-muted">
          with AI as my engineering team. I lead with data and analytics, then
          direct AI coding agents to ship real, production software — from
          taxonomy engines to Bayesian budget models.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/projects" variant="primary">
            View projects
          </ButtonLink>
          <ButtonLink href="/resume" variant="outline">
            Resume &amp; skills
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
