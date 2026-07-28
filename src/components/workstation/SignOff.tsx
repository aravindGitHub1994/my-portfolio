"use client";

// Ch. 5 contact layer (plan-0009 §5.3, ADR-012 §6): the journey's final
// rest point. After the shutdown beat the room goes dark and this DOM
// overlay is what's left — email, LinkedIn, GitHub, resume.
//
// Unlike TitleBeats this is NOT decorative: while the experience is
// mounted the static floor is display:none (globals.css), so these are
// the only contact affordances in the tab order. It therefore stays
// semantic (a real <nav> of real links) and must be reachable by
// keyboard scrub alone — arrow/PageDown stepping lands on chapter 5's
// rest point, and Tab picks the links up from there.
//
// The rAF writes opacity straight to the node (experienceState, never
// React state — the TitleBeats pattern), and flips `visibility` in the
// same pass: while the layer is invisible it must also be untabbable,
// or a keyboard visitor in chapter 1 tabs into an unseen contact card.

import { useEffect, useRef } from "react";
import { RESUME_LINK, SITE, SOCIAL_LINKS } from "@/lib/nav";
import { experienceState } from "@/lib/experienceState";

/** duskDeepen (0..1 across ch. 5) where the layer starts/finishes fading in. */
const FADE_START = 0.45;
const FADE_END = 0.72;
/** Below this opacity the layer is visibility:hidden — out of the tab order. */
const VISIBLE_EPS = 0.02;

export function SignOff() {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    // Only touch the DOM when the value actually changes — this runs
    // every frame for the whole journey.
    let lastOpacity = -1;
    const tick = () => {
      const node = el.current;
      if (node) {
        const t =
          (experienceState.duskDeepen - FADE_START) / (FADE_END - FADE_START);
        const opacity = Math.min(Math.max(t, 0), 1);
        if (opacity !== lastOpacity) {
          lastOpacity = opacity;
          node.style.opacity = String(opacity);
          const shown = opacity > VISIBLE_EPS;
          node.style.visibility = shown ? "visible" : "hidden";
          node.style.pointerEvents = shown ? "auto" : "none";
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={el}
      className="fixed inset-x-0 bottom-[12vh] z-30 flex flex-col items-center gap-5 px-6 text-center"
      style={{ opacity: 0, visibility: "hidden", pointerEvents: "none" }}
    >
      <div>
        <p className="font-w98-mono text-2xl text-ink md:text-3xl">
          {SITE.name}
        </p>
        <p className="mt-2 font-mono text-xs tracking-widest text-ink-muted uppercase">
          It&rsquo;s now safe to get in touch.
        </p>
      </div>

      <nav aria-label="Contact">
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <li>
            <a
              className="font-mono text-sm text-ink underline underline-offset-4 hover:text-ink-muted focus-visible:outline-2"
              href={`mailto:${SITE.email}`}
            >
              {SITE.email}
            </a>
          </li>
          {SOCIAL_LINKS.map((link) => (
            <li key={link.label}>
              <a
                className="font-mono text-sm text-ink underline underline-offset-4 hover:text-ink-muted focus-visible:outline-2"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a
              className="font-mono text-sm text-ink underline underline-offset-4 hover:text-ink-muted focus-visible:outline-2"
              href={RESUME_LINK.href}
              download
            >
              {RESUME_LINK.label}
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}
