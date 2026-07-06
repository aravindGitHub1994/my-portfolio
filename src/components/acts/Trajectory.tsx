"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/SectionHeader";
import {
  EXPERIENCE,
  type ExperienceItem,
  type ExperiencePeriod,
} from "@/lib/resume";

/**
 * Order-only today (no dates in resume.ts yet — none invented, slice 3.1);
 * auto-upgrades to a dated timeline the moment period years are supplied.
 */
function formatPeriod(period?: ExperiencePeriod): string | null {
  if (!period) return null;
  if (period.start && period.end) return `${period.start} – ${period.end}`;
  if (period.start) return `${period.start} – Present`;
  return period.end ?? null;
}

const idFor = (org: string) =>
  `trajectory-${org.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

/**
 * Act 4 — Trajectory (ADR-005 §4): the experience section IS one vertical
 * timeline from EXPERIENCE. Each role is a disclosure (button +
 * aria-expanded/-controls) expanding to its achievement points; the expand
 * is a CSS grid-rows 0fr→1fr transition, which the global reduced-motion
 * rule flattens to instant. The current (first) role starts open.
 */
export function Trajectory() {
  return (
    <section
      id="trajectory"
      className="mx-auto w-full max-w-5xl px-6 py-24 sm:py-32"
    >
      <SectionHeader
        eyebrow="Trajectory"
        title="From tech support to data analytics leadership"
      />
      <ol className="relative mt-12 border-l border-line">
        {EXPERIENCE.map((item, index) => (
          <TimelineRole key={item.org} item={item} current={index === 0} />
        ))}
      </ol>
    </section>
  );
}

function TimelineRole({
  item,
  current,
}: {
  item: ExperienceItem;
  current: boolean;
}) {
  const [open, setOpen] = useState(current);
  const base = idFor(item.org);
  const buttonId = `${base}-button`;
  const panelId = `${base}-panel`;
  const period = formatPeriod(item.period);

  return (
    <li className="relative pb-10 pl-8 last:pb-0 sm:pl-10">
      <span
        aria-hidden="true"
        className={`absolute top-2 -left-[5.5px] h-2.5 w-2.5 rounded-full border ${
          current
            ? "border-accent bg-accent/40 shadow-[0_0_12px_-2px_var(--color-glow)]"
            : "border-line-strong bg-surface"
        }`}
      />

      <button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-start justify-between gap-4 text-left"
      >
        <span>
          <span className="block text-lg text-ink transition-colors duration-200 group-hover:text-accent-bright">
            {item.role}
          </span>
          <span className="mt-1 block font-mono text-xs tracking-wide text-ink-subtle">
            {item.org} · {item.location}
            {period && ` · ${period}`}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`mt-0.5 font-mono text-lg leading-none transition-transform duration-300 ${
            open ? "rotate-45 text-accent-bright" : "text-ink-subtle"
          } group-hover:text-accent-bright`}
        >
          +
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        aria-hidden={!open}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <ul className="mt-4 max-w-2xl space-y-2.5">
            {item.points.map((point) => (
              <li
                key={point}
                className="flex gap-3 text-sm leading-6 text-ink-muted"
              >
                <span
                  aria-hidden="true"
                  className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-accent/60"
                />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}
