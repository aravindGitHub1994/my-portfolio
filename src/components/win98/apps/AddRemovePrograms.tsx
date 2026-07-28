"use client";

// Add/Remove Programs (plan-0009 §5.2, ADR-012 §6): SKILL_TIERS as
// install categories — every skill a program row with a playful (but
// deterministic — no Math.random, react-compiler rule) install date.
// Tier blurbs become category descriptions, keeping the honesty
// framing ("working knowledge" is still installing). All copy beyond
// resume.ts is deadpan machine voice (ADR-012 §1).

import { useState } from "react";
import { SKILL_TIERS } from "@/lib/resume";
import { PixelIcon } from "../pixelIcons";

// Install-date fiction, anchored loosely to the real arc: analytics
// tools land 2021+ (the origin story), the AI stack 2024+, and
// working knowledge is honestly still mid-install.
function installLabel(tierIndex: number, skillIndex: number): string {
  if (tierIndex === 0) return `Installed ${((skillIndex * 5) % 12) + 1}/${2021 + (skillIndex % 2)}`;
  if (tierIndex === 1) return `Installed ${((skillIndex * 7) % 12) + 1}/${2024 + (skillIndex % 2)}`;
  return `Installing... ${58 + ((skillIndex * 9) % 34)}% complete`;
}

function sizeLabel(skill: string): string {
  return `${(((skill.length * 137) % 900) / 100 + 0.4).toFixed(1)} MB`;
}

export function AddRemovePrograms() {
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="-m-2 flex h-[calc(100%+16px)] flex-col">
      <p className="shrink-0 p-2 font-w98 text-[8px] leading-relaxed text-w98-ink">
        The following programs are installed on this machine. Removal is
        not supported; skills are permanent.
      </p>

      <div className="w98-field mx-2 min-h-0 flex-1 overflow-auto">
        {SKILL_TIERS.map((tier, tierIndex) => (
          <section key={tier.name}>
            <header className="sticky top-0 bg-w98-chrome px-1 py-0.5">
              <h4 className="font-w98 text-[8px] font-bold text-w98-ink">
                {tier.name}
              </h4>
              {tier.blurb && (
                <p className="font-w98-mono text-[10px] leading-tight text-w98-ink">
                  {tier.blurb}
                </p>
              )}
            </header>
            <ul>
              {tier.skills.map((skill, skillIndex) => (
                <li key={skill}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-1.5 px-1 py-0.5 text-left text-w98-ink"
                    style={
                      selected === skill
                        ? {
                            background: "var(--color-w98-select)",
                            color: "var(--color-w98-ink-invert)",
                          }
                        : undefined
                    }
                    onClick={() => {
                      setSelected(skill);
                      setStatus(null);
                    }}
                  >
                    <PixelIcon glyph="document" size={13} />
                    <span className="min-w-0 flex-1 truncate font-w98 text-[8px]">
                      {skill}
                    </span>
                    <span className="shrink-0 font-w98-mono text-[10px]">
                      {sizeLabel(skill)}
                    </span>
                    <span className="w-[128px] shrink-0 text-right font-w98-mono text-[10px]">
                      {installLabel(tierIndex, skillIndex)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2 p-2">
        <button
          type="button"
          className="w98-btn h-[18px] px-2 font-w98 text-[8px]"
          disabled={!selected}
          style={{ opacity: selected ? 1 : 0.5 }}
          onClick={() =>
            setStatus(
              `Cannot remove "${selected}": this skill is load-bearing.`,
            )
          }
        >
          Remove...
        </button>
        <span
          className="min-w-0 flex-1 truncate font-w98 text-[8px] text-w98-ink"
          aria-live="polite"
        >
          {status}
        </span>
      </div>
    </div>
  );
}
