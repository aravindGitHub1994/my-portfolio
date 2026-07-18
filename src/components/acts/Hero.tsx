"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ButtonLink } from "@/components/Button";
import { Magnetic } from "@/components/ui/Magnetic";
import { SITE } from "@/lib/nav";

/**
 * Hero of the static floor (ADR-012 §9): plain semantic DOM — the real
 * <h1> for crawlers, screen readers, and every fidelity tier. Owns only
 * its own copy parallax — the content lifts/fades slightly faster than
 * the scroll for depth. Reduced-motion: plain static hero.
 */
export function Hero() {
  const section = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.to(content.current, {
        y: -70,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: "75% top",
          scrub: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="hero"
      ref={section}
      className="relative flex min-h-screen flex-col items-center justify-center px-6"
    >
      <div ref={content} className="flex flex-col items-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent-bright">
          {SITE.name}
        </p>
        <h1 className="mt-6 max-w-3xl text-center text-5xl leading-[1.08] sm:text-7xl">
          Data Analytics &amp;{" "}
          <span className="text-electric">AI systems</span>
        </h1>
        <p className="mt-7 max-w-xl text-center text-lg leading-8 text-ink-muted">
          I lead with measurement and ship the software those insights demand —
          directing AI coding agents while I own the spec, the architecture,
          and the review.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Magnetic>
            <ButtonLink href="#work" variant="primary">
              See the work
            </ButtonLink>
          </Magnetic>
          <Magnetic>
            <ButtonLink href="#contact" variant="outline">
              Get in touch
            </ButtonLink>
          </Magnetic>
        </div>
      </div>

      {/* Scroll cue */}
      <div
        aria-hidden="true"
        className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-subtle">
          Scroll
        </span>
        <span className="relative block h-12 w-px overflow-hidden bg-line">
          <span className="animate-scroll-cue absolute inset-x-0 top-0 h-full bg-gradient-to-b from-transparent via-accent to-transparent" />
        </span>
      </div>
    </section>
  );
}
