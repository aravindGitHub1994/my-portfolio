"use client";

// WordPad (plan-0009 §5.2, ADR-012 §6): resume.doc — the résumé composed
// live from resume.ts (zero duplicated copy) in a word-processor
// pastiche; Download... serves the real public/resume.pdf (a plain <a>,
// static-export safe). Original chrome only (ADR-012 §10).

import { EDUCATION, EXPERIENCE, SKILL_TIERS } from "@/lib/resume";
import { SITE } from "@/lib/nav";

function DocHeading({ children }: { children: string }) {
  return (
    <h3 className="mt-4 mb-1 border-b border-w98-chrome-dark pb-0.5 font-w98 text-[9px] font-bold uppercase">
      {children}
    </h3>
  );
}

export function WordPad() {
  return (
    <div className="-m-2 flex h-[calc(100%+16px)] flex-col">
      {/* Menu + toolbar pastiche; Download... is the one real control. */}
      <div className="shrink-0 px-1 pt-0.5">
        <div
          className="flex gap-3 px-1 py-0.5 font-w98 text-[8px] text-w98-ink"
          aria-hidden="true"
        >
          <span>File</span>
          <span>Edit</span>
          <span>View</span>
          <span>Format</span>
          <span>Help</span>
        </div>
        <div className="flex items-center gap-1 py-0.5">
          <span
            className="w98-sunken bg-w98-field px-1 py-0.5 font-w98 text-[8px] text-w98-ink"
            aria-hidden="true"
          >
            Times New Human · 12
          </span>
          <a
            href="/resume.pdf"
            download
            className="w98-btn ml-auto h-[18px] px-2 font-w98 text-[8px] leading-[18px] text-w98-ink no-underline"
          >
            Download...
          </a>
        </div>
      </div>

      {/* The document */}
      <div className="w98-field min-h-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-[520px] p-3 text-w98-ink">
          <header className="text-center">
            <h2 className="font-w98 text-[11px] font-bold">{SITE.name}</h2>
            <p className="mt-0.5 font-w98-mono text-[11px]">{SITE.role}</p>
            <p className="font-w98-mono text-[11px]">{SITE.email}</p>
          </header>

          <DocHeading>Experience</DocHeading>
          {EXPERIENCE.map((item) => (
            <section key={item.org} className="mt-2">
              <h4 className="font-w98 text-[8px] font-bold">
                {item.role} — {item.org}
              </h4>
              <p className="font-w98-mono text-[11px] italic">
                {item.location}
              </p>
              <ul className="mt-1 ml-4 list-disc">
                {item.points.map((point) => (
                  <li
                    key={point}
                    className="font-w98-mono text-[11px] leading-[1.35]"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <DocHeading>Skills</DocHeading>
          {SKILL_TIERS.map((tier) => (
            <p key={tier.name} className="mt-1 font-w98-mono text-[11px] leading-[1.35]">
              <strong className="font-w98 text-[8px]">{tier.name}: </strong>
              {tier.skills.join(", ")}
            </p>
          ))}

          <DocHeading>Education & Certifications</DocHeading>
          <ul className="ml-4 list-disc">
            {EDUCATION.map((item) => (
              <li
                key={item.credential}
                className="font-w98-mono text-[11px] leading-[1.35]"
              >
                {item.credential} — {item.institution}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
