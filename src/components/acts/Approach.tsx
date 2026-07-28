"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { SectionHeader } from "@/components/SectionHeader";
import { APPROACH_STATS, type StatFigure } from "@/lib/stats";

/**
 * Approach — the method statement plus its proof band: stat figures that
 * count up as they scroll into view. The prerender ships the RESOLVED
 * values, and reduced-motion never overwrites them — crawlers and
 * reduced-motion visitors see real numbers, never a zero. Counting stays
 * silent for screen readers (no aria-live; the settled DOM text is the
 * accessible value).
 */
export function Approach() {
  return (
    <section
      id="approach"
      className="mx-auto w-full max-w-5xl px-6 py-24 sm:py-32"
    >
      <SectionHeader
        eyebrow="Approach"
        title="I write the spec, agents write the code"
        description="Spec-driven development: I scope the problem, lock the interfaces, and direct Claude Code / Gemini CLI agents through implementation — owning the architecture decisions and the review."
      />
      {/* Six figures — 2×3 mobile, 3×2 from sm up. (Was lg:grid-cols-5 for
          the original five; a 5-col row would orphan the sixth.) */}
      <ul className="mt-16 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3">
        {APPROACH_STATS.map((stat, index) => (
          <StatItem key={stat.label} stat={stat} index={index} />
        ))}
      </ul>
    </section>
  );
}

function StatItem({ stat, index }: { stat: StatFigure; index: number }) {
  const item = useRef<HTMLLIElement>(null);
  // Initial state IS the resolved figure — that's what prerenders.
  const [display, setDisplay] = useState(stat.value);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = item.current;
    if (!el) return;
    const counter = { value: 0 };
    let tween: gsap.core.Tween | null = null;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        tween = gsap.fromTo(
          counter,
          { value: 0 },
          {
            value: stat.value,
            duration: 1.4,
            delay: index * 0.12,
            ease: "power2.out",
            onUpdate: () => setDisplay(Math.round(counter.value)),
          },
        );
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      tween?.kill();
    };
  }, [stat.value, index]);

  return (
    <li ref={item} className="flex flex-col gap-2">
      <span className="text-electric text-5xl font-semibold tabular-nums sm:text-6xl">
        {display}
        {stat.suffix}
      </span>
      <span className="max-w-[16ch] text-sm leading-6 text-ink-muted">
        {stat.label}
      </span>
    </li>
  );
}
