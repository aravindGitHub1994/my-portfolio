"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { Project } from "@/lib/projects";
import { CapabilityTag } from "@/components/Tag";
import { useTheme } from "@/components/ThemeProvider";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const noop = () => () => {};

/** SSR-safe "are we on the client yet?" flag (server snapshot is false). */
function useMounted() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/**
 * Glowing-border, backdrop-blurred lightbox for a single project. Shows the
 * pre-rendered architecture diagram, the Problem → Approach → Outcome
 * narrative, the plain-text stack line, a "How I used AI agents" callout,
 * capability tags, and a "Private project" badge (none of the four real
 * projects link out).
 *
 * Accessibility: role="dialog" + aria-modal, Escape closes, focus is moved
 * into the dialog on open and trapped via Tab/Shift+Tab, body scroll is
 * locked while open, and focus returns to the trigger on close. Entry/exit
 * transitions are reduced-motion safe (CSS only, neutralized globally).
 */
export function ProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  // Portal target is the document body. Gate on a client-only mounted flag so
  // the static-export prerender never touches `document`.
  const mounted = useMounted();

  // Swap diagram src for the light variant in day mode (ADR-003 / ADR-002 amendment).
  // *.light.svg files are the committed dark SVGs with the palette remapped to the
  // day (Warm-sunlit) tokens — same geometry, no layout drift. See scripts/diagrams-light.js.
  const { resolved } = useTheme();
  const diagSrc =
    resolved === "day"
      ? project.diagram.replace(".svg", ".light.svg")
      : project.diagram;

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const dialog = dialogRef.current;
    const focusables = dialog?.querySelectorAll<HTMLElement>(
      FOCUSABLE_SELECTOR,
    );
    (focusables?.[0] ?? dialog)?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialog) return;

      const nodes = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      {/* Dimmed + blurred backdrop */}
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm motion-safe:animate-[fade-in_0.2s_ease-out]"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        tabIndex={-1}
        className="relative z-10 max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-gold/30 bg-surface p-6 shadow-[0_0_60px_-10px_var(--color-glow)] motion-safe:animate-[modal-in_0.25s_var(--ease-out-soft)] sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </button>

        <style>{`
          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
          @keyframes modal-in {
            from { opacity: 0; transform: translateY(8px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        <div className="mb-4 flex flex-wrap gap-2 pr-10">
          {project.capabilities.map((c) => (
            <CapabilityTag key={c} capability={c} />
          ))}
          {project.status === "in-progress" && (
            <span className="inline-flex items-center rounded-full border border-line-strong px-2.5 py-0.5 text-xs font-mono tracking-wide text-lilac">
              In progress
            </span>
          )}
        </div>

        <h2
          id="project-modal-title"
          className="text-2xl text-ink sm:text-3xl"
        >
          {project.title}
        </h2>
        <p className="mt-2 text-base leading-7 text-ink-muted">
          {project.tagline}
        </p>

        {/* Diagrams vary wildly in aspect ratio (wide-short vs narrow-tall), so
            render each at its natural size capped by a max height, scrolling
            within this box rather than being stretched to the modal width.
            `max-w-none` overrides Tailwind preflight's img max-width:100% so a
            very wide diagram overflows and scrolls horizontally instead of
            squashing to unreadable text. */}
        <div className="mt-6 overflow-auto rounded-md border border-line bg-bg/40">
          {/* eslint-disable-next-line @next/next/no-img-element -- static export: pre-rendered committed SVG, no next/image */}
          <img
            src={diagSrc}
            alt={`${project.title} architecture diagram`}
            className="mx-auto block max-h-[26rem] w-auto max-w-none p-2"
          />
        </div>

        <dl className="mt-8 space-y-6">
          <div>
            <dt className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
              Problem
            </dt>
            <dd className="mt-2 text-sm leading-7 text-ink-muted">
              {project.problem}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
              Approach
            </dt>
            <dd className="mt-2 text-sm leading-7 text-ink-muted">
              {project.approach}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
              Outcome
            </dt>
            <dd className="mt-2 text-sm leading-7 text-ink-muted">
              {project.outcome}
            </dd>
          </div>
        </dl>

        <p className="mt-6 font-mono text-xs text-ink-subtle">
          <span className="text-ink-muted">Built with:</span>{" "}
          {project.stack.join(" · ")}
        </p>

        <div className="mt-6 rounded-md border border-lilac/30 bg-lilac/5 p-4">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-lilac">
            How I used AI agents
          </p>
          <p className="mt-2 text-sm leading-7 text-ink-muted">
            {project.howAI}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-bg px-2.5 py-0.5 text-xs font-mono tracking-wide text-ink-subtle">
            <svg
              viewBox="0 0 16 16"
              className="h-3 w-3"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="7"
                width="10"
                height="7"
                rx="1.2"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <path
                d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            Private project — no public link
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
