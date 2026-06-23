import { Starfield } from "@/components/Starfield";
import { ButtonLink } from "@/components/Button";
import { DISCIPLINE_LIST } from "@/lib/disciplines";

/**
 * Landing hero. An animated starfield drifts behind a serif display headline
 * with shimmering gilt text, a short intro, primary CTAs, and the four
 * discipline pills. Server-rendered shell; only the canvas is client-side.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <Starfield className="opacity-80" />

      {/* Vignette so text stays legible over the starfield */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--color-bg)_95%)]"
      />

      <div className="relative mx-auto flex min-h-[78vh] max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
        <p className="animate-[float_7s_ease-in-out_infinite] font-mono text-xs uppercase tracking-[0.3em] text-gold">
          Analytics · Writing · Design · Code
        </p>

        <h1 className="mt-6 text-balance text-5xl leading-[1.05] sm:text-6xl md:text-7xl">
          <span className="text-ink">Work across the</span>{" "}
          <span className="text-gilt">full spectrum</span>
        </h1>

        <p className="mt-6 max-w-xl text-pretty text-lg leading-8 text-ink-muted">
          A multi-disciplinary portfolio — measuring with data, building with
          code, shaping with design, and telling the story in writing.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/projects" variant="primary">
            View projects
          </ButtonLink>
          <ButtonLink href="/resume" variant="outline">
            Resume &amp; skills
          </ButtonLink>
        </div>

        <ul className="mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs text-ink-subtle">
          {DISCIPLINE_LIST.map((d) => (
            <li key={d.key} className="flex items-center gap-2">
              <span aria-hidden="true" className="text-gold">
                ✦
              </span>
              {d.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
