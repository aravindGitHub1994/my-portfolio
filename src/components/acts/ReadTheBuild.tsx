"use client";

import { useCallback, useRef, type MouseEvent } from "react";
import { Button } from "@/components/Button";
import { Tag } from "@/components/Tag";
import { useLenisRef } from "@/components/LenisProvider";
import type { Project } from "@/lib/projects";

const SECTIONS = [
  { heading: "Problem", key: "problem" },
  { heading: "Approach", key: "approach" },
  { heading: "Outcome", key: "outcome" },
  { heading: "How I used AI", key: "howAI" },
] as const;

/**
 * "Read the build" progressive disclosure (ADR-005 §1, slice 2.5): the full
 * problem/approach/outcome/howAI copy behind a native <dialog>. A top-layer
 * overlay — never an in-flow expand — because the project panels are
 * sticky-pinned: growing them would shift every ScrollTrigger below.
 *
 * Sections whose copy is absent are dropped, not stubbed: `howAI` is optional
 * (ADR-008 §4) so a hand-craft project shows no AI heading at all.
 *
 * <dialog> gives the a11y contract for free: focus trap, Esc→close, and
 * focus restored to the trigger on close. On top of that we stop Lenis (and
 * native scroll under reduced-motion, where Lenis doesn't exist) while open,
 * and park the custom cursor — its fixed layer can't render above the top
 * layer, so the native cursor comes back for the dialog's lifetime.
 * Entry motion is a CSS @starting-style fade/rise, which the global
 * prefers-reduced-motion rule zeroes out.
 *
 * DEVIATION from ADR-010 §1 scope: the dialog copy stays crisp DOM. A native
 * <dialog> lives in the browser top layer, which always paints above the
 * kinetic canvas (fixed, -z-10) — a GL twin here would be invisible behind
 * the opaque dialog surface. Flagged for the 6.2 owner review.
 */
export function ReadTheBuild({ project }: { project: Project }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const hadCustomCursor = useRef(false);
  const lenisRef = useLenisRef();
  const titleId = `${project.slug}-build-title`;

  const open = useCallback(() => {
    const d = dialog.current;
    if (!d || d.open) return;
    d.showModal();
    lenisRef?.current?.stop();
    document.documentElement.style.overflow = "hidden";
    hadCustomCursor.current =
      document.documentElement.classList.contains("has-custom-cursor");
    if (hadCustomCursor.current) {
      document.documentElement.classList.remove("has-custom-cursor");
    }
  }, [lenisRef]);

  // Fires for every close path (Esc/cancel, close button, backdrop).
  const handleClose = useCallback(() => {
    lenisRef?.current?.start();
    document.documentElement.style.overflow = "";
    if (hadCustomCursor.current) {
      document.documentElement.classList.add("has-custom-cursor");
    }
  }, [lenisRef]);

  // The content div covers the dialog entirely (p-0), so a click whose
  // target is the dialog itself can only be on the ::backdrop.
  const onBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialog.current) dialog.current?.close();
  };

  return (
    <>
      <Button variant="outline" size="sm" type="button" onClick={open}>
        Read the build
        <span aria-hidden="true" className="text-accent-bright">
          +
        </span>
      </Button>

      <dialog
        ref={dialog}
        onClose={handleClose}
        onClick={onBackdropClick}
        aria-labelledby={titleId}
        className="m-auto w-[min(92vw,44rem)] rounded-lg border border-line bg-surface p-0 text-ink shadow-2xl transition-[opacity,transform] duration-300 ease-out backdrop:bg-black/70 starting:translate-y-4 starting:opacity-0"
      >
        <div
          data-lenis-prevent
          className="max-h-[min(82vh,54rem)] overflow-y-auto p-6 sm:p-8"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-subtle">
                The build
              </p>
              <h4 id={titleId} className="mt-2 text-2xl text-ink">
                {project.title}
                {project.status === "in-progress" && (
                  <span className="ml-3 align-middle font-mono text-xs uppercase tracking-wide text-ink-subtle">
                    in progress
                  </span>
                )}
              </h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              aria-label="Close"
              onClick={() => dialog.current?.close()}
            >
              Esc ✕
            </Button>
          </div>

          <div className="mt-8 space-y-7">
            {SECTIONS.filter(({ key }) => project[key]).map(
              ({ heading, key }) => (
                <section key={key}>
                  <h5 className="font-mono text-xs uppercase tracking-[0.2em] text-accent-bright">
                    {heading}
                  </h5>
                  <p className="mt-2 text-sm leading-7 text-ink-muted">
                    {project[key]}
                  </p>
                </section>
              ),
            )}

            <section>
              <h5 className="font-mono text-xs uppercase tracking-[0.2em] text-accent-bright">
                Built with
              </h5>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.stack.map((tech) => (
                  <Tag key={tech}>{tech}</Tag>
                ))}
              </div>
            </section>
          </div>
        </div>
      </dialog>
    </>
  );
}
