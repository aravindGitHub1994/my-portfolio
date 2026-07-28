"use client";

// Project window (plan-0009 §5.1, ADR-012 §6): one window per
// projects.ts entry — problem/approach/outcome copy, stack + capability
// chips as Win98 property rows, the honest `howAI` callout (omitted when
// absent — ADR-005), the animated SVG diagram (ADR-002 one-shot draw-on,
// replayable via a period Refresh button), and the IE-framed recreated
// screenshot when one exists. Zero content duplication: everything reads
// from projects.ts.

import { useCallback, useEffect, useRef, useState } from "react";
import { CAPABILITIES } from "@/lib/capabilities";
import { PROJECTS } from "@/lib/projects";
import { closeWindow, type Win98Window } from "@/lib/win98State";
import { buildDrawTimeline, spawnPackets } from "@/lib/diagramAnimation";
import { playErrorDing } from "@/lib/audio";
import { InlineDiagram } from "@/components/InlineDiagram";
import { IEFrame } from "./IEFrame";

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function SectionHeading({ children }: { children: string }) {
  return (
    <h3 className="mt-3 mb-1 font-w98 text-[9px] font-bold text-w98-ink">
      {children}
    </h3>
  );
}

function Body({ children }: { children: string }) {
  return (
    <p className="font-w98-mono text-[12px] leading-[1.35] text-w98-ink">
      {children}
    </p>
  );
}

/** A property-sheet row: label column + sunken value field. */
function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-[92px] shrink-0 font-w98 text-[8px] text-w98-ink">
        {label}:
      </span>
      <span className="w98-sunken min-w-0 flex-1 bg-w98-field px-1 py-0.5 font-w98-mono text-[11px] leading-[1.3] text-w98-ink">
        {value}
      </span>
    </div>
  );
}

export function ProjectWindow({ win }: { win: Win98Window }) {
  const slug = win.appId.replace(/^project-/, "");
  const project = PROJECTS.find((p) => p.slug === slug);

  // `personas` ships as a draft — the §5.1 "unfinished copy" dialog gates
  // it once per window open.
  const [draftAcknowledged, setDraftAcknowledged] = useState(false);

  const disposeDraw = useRef<(() => void) | null>(null);
  const replay = useRef<(() => void) | null>(null);
  // Bumping remounts InlineDiagram → fresh svg → handleSvgReady again;
  // the Refresh button uses the stored replay instead (no refetch).
  const handleSvgReady = useCallback((svg: SVGSVGElement) => {
    if (reducedMotion()) return; // rests fully drawn by convention
    disposeDraw.current?.();

    const timeline = buildDrawTimeline(svg);
    // Force-render end→start once so every stepped fromTo initializes its
    // hidden state before the play-through (same trick as ProjectPin).
    timeline.progress(1).progress(0);
    const packets = spawnPackets(svg, { loop: false });
    timeline.eventCallback("onComplete", () => packets.play());
    timeline.play();

    replay.current = () => {
      packets.pause();
      timeline.restart();
    };
    disposeDraw.current = () => {
      timeline.kill();
      packets.destroy();
      disposeDraw.current = null;
      replay.current = null;
    };
  }, []);

  useEffect(
    () => () => {
      disposeDraw.current?.();
    },
    [],
  );

  // Error ding (6.1) on the "unfinished copy" dialog — the shell's one
  // modal, and the only place the era's warning bell belongs. Effect, not
  // a render-time call: the dialog is a conditional return below.
  const draftDialogOpen =
    project?.status === "in-progress" && !draftAcknowledged;
  useEffect(() => {
    if (draftDialogOpen) playErrorDing();
  }, [draftDialogOpen]);

  if (!project) {
    return (
      <p className="font-w98 text-[9px] text-w98-ink">
        The file could not be found. It was probably on the floppy.
      </p>
    );
  }

  if (project.status === "in-progress" && !draftAcknowledged) {
    return (
      <div className="flex h-full items-center justify-center">
        <div
          role="alertdialog"
          aria-label="Unfinished copy"
          className="w98-raised w-[85%] max-w-[300px] p-[3px]"
        >
          <div className="w98-titlebar flex h-[18px] items-center px-1 font-w98 text-[8px]">
            {project.title}
          </div>
          <p className="p-3 font-w98 text-[9px] leading-relaxed text-w98-ink">
            This document contains unfinished work. The author is still
            typing. Open anyway?
          </p>
          <div className="flex justify-center gap-2 pb-3">
            <button
              type="button"
              autoFocus
              className="w98-btn h-[20px] w-[70px] font-w98 text-[8px]"
              onClick={() => setDraftAcknowledged(true)}
            >
              Open
            </button>
            <button
              type="button"
              className="w98-btn h-[20px] w-[70px] font-w98 text-[8px]"
              onClick={() => closeWindow(win.id)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <article className="text-w98-ink">
      <p className="font-w98-mono text-[12px] leading-[1.35] italic">
        {project.tagline}
      </p>

      {/* Property rows — the Win98 restyle of stack + capability chips. */}
      <div className="mt-3 flex flex-col gap-1">
        <PropertyRow
          label="Type of work"
          value={project.capabilities
            .map((key) => CAPABILITIES[key].label)
            .join(", ")}
        />
        <PropertyRow label="Built with" value={project.stack.join(", ")} />
        {project.status === "in-progress" && (
          <PropertyRow label="Status" value="In progress (unfinished copy)" />
        )}
      </div>

      <SectionHeading>The problem</SectionHeading>
      <Body>{project.problem}</Body>

      <SectionHeading>The approach</SectionHeading>
      <Body>{project.approach}</Body>

      <SectionHeading>The outcome</SectionHeading>
      <Body>{project.outcome}</Body>

      {/* Honesty rule (ADR-005): omitted entirely when there is no true
          AI angle — never invented. */}
      {project.howAI && (
        <div
          className="w98-sunken mt-3 bg-w98-field p-2"
          style={{ borderLeft: "3px solid var(--color-w98-amber)" }}
        >
          <h3 className="mb-1 font-w98 text-[8px] font-bold">
            How I used AI agents
          </h3>
          <p className="font-w98-mono text-[11px] leading-[1.35]">
            {project.howAI}
          </p>
        </div>
      )}

      <div className="mt-3 mb-1 flex items-center">
        <h3 className="font-w98 text-[9px] font-bold">How it fits together</h3>
        <button
          type="button"
          className="w98-btn ml-auto h-[18px] px-2 font-w98 text-[8px]"
          onClick={() => replay.current?.()}
        >
          Refresh
        </button>
      </div>
      <div className="w98-sunken bg-w98-field p-2">
        <InlineDiagram
          project={project}
          className="w-full"
          onSvgReady={handleSvgReady}
        />
      </div>

      {project.screenshot && project.domain && (
        <>
          <SectionHeading>See it live (recreation)</SectionHeading>
          <IEFrame
            domain={project.domain}
            screenshot={project.screenshot}
            title={project.title}
          />
        </>
      )}
    </article>
  );
}
