"use client";

// Explorer (plan-0009 §5.1, ADR-012 §6): the file-manager pastiche. Two
// entry points share this component — `My Computer` (appId "explorer",
// drive-level browsing) and `My Projects` (appId "explorer-projects",
// straight into the projects folder listing the 5 projects.ts entries).
// Double-click / Enter opens each project's own window. All original
// chrome — zero Microsoft-derived art (ADR-012 §10).

import { useState } from "react";
import { PROJECTS } from "@/lib/projects";
import {
  openWindow,
  type IconGlyph,
  type Win98Window,
} from "@/lib/win98State";
import { PixelIcon } from "../pixelIcons";
import { launchApp } from "../shell/appDefs";

/** Window geometry for a project opened from the listing. */
const PROJECT_WIN = { width: 500, height: 400 } as const;

export function openProjectWindow(slug: string): void {
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) return;
  openWindow({
    id: `project-${slug}`,
    appId: `project-${slug}`,
    title: project.title,
    glyph: "document",
    ...PROJECT_WIN,
  });
}

interface ExplorerItem {
  id: string;
  label: string;
  glyph: IconGlyph;
  /** Navigate within this Explorer window. */
  goto?: ViewId;
  /** Or launch something (project window / another shell app). */
  open?: () => void;
  /** Or just deadpan-refuse in the status bar. */
  status?: string;
}

type ViewId = "computer" | "c" | "projects";

interface View {
  /** Address-bar text. */
  address: string;
  /** Parent view for the Up button (undefined at a root). */
  up?: ViewId;
  items: ExplorerItem[];
}

const VIEWS: Record<ViewId, View> = {
  computer: {
    address: "My Computer",
    items: [
      {
        id: "a",
        label: "3½ Floppy (A:)",
        glyph: "computer",
        status: "There is no disk in the drive. There is never a disk in the drive.",
      },
      { id: "c", label: "(C:)", glyph: "computer", goto: "c" },
      {
        id: "d",
        label: "(D:)",
        glyph: "computer",
        status: "The CD tray is open. It makes a good cup holder.",
      },
    ],
  },
  c: {
    address: "C:\\",
    up: "computer",
    items: [
      { id: "projects", label: "My Projects", glyph: "folder", goto: "projects" },
      {
        id: "career",
        label: "Career",
        glyph: "folder",
        status: "Access denied: this folder installs with Disk 2.",
      },
      {
        id: "resume",
        label: "resume.doc",
        glyph: "document",
        open: () => launchApp("resume-doc"),
      },
      {
        id: "about",
        label: "ABOUT_ME.txt",
        glyph: "notepad",
        open: () => launchApp("about-me"),
      },
    ],
  },
  projects: {
    address: "C:\\My Projects",
    up: "c",
    items: PROJECTS.map((p) => ({
      id: p.slug,
      label: `${p.title}${p.status === "in-progress" ? " (draft)" : ""}`,
      glyph: "document" as const,
      open: () => openProjectWindow(p.slug),
    })),
  },
};

export function Explorer({ win }: { win: Win98Window }) {
  const [view, setView] = useState<ViewId>(
    win.appId === "explorer-projects" ? "projects" : "computer",
  );
  const [trail, setTrail] = useState<ViewId[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const current = VIEWS[view];

  const navigate = (next: ViewId) => {
    setTrail((t) => [...t, view]);
    setView(next);
    setSelected(null);
    setStatus(null);
  };

  const back = () => {
    setTrail((t) => {
      if (t.length === 0) return t;
      setView(t[t.length - 1]);
      setSelected(null);
      setStatus(null);
      return t.slice(0, -1);
    });
  };

  const activate = (item: ExplorerItem) => {
    if (item.goto) navigate(item.goto);
    else if (item.open) item.open();
    else if (item.status) setStatus(item.status);
  };

  return (
    <div className="-m-2 flex h-[calc(100%+16px)] flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-1 p-1">
        <button
          type="button"
          className="w98-btn h-[18px] px-2 font-w98 text-[8px]"
          disabled={trail.length === 0}
          style={{ opacity: trail.length === 0 ? 0.5 : 1 }}
          onClick={back}
        >
          Back
        </button>
        <button
          type="button"
          className="w98-btn h-[18px] px-2 font-w98 text-[8px]"
          disabled={!current.up}
          style={{ opacity: current.up ? 1 : 0.5 }}
          onClick={() => current.up && navigate(current.up)}
        >
          Up
        </button>
        <span className="ml-1 font-w98 text-[8px] text-w98-ink">Address</span>
        <span className="w98-sunken flex-1 truncate bg-w98-field px-1 py-0.5 font-w98-mono text-[11px] leading-none">
          {current.address}
        </span>
      </div>

      {/* Item grid */}
      <div className="w98-field min-h-0 flex-1 overflow-auto p-2">
        <div className="flex flex-wrap content-start gap-1">
          {current.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-[88px] flex-col items-center gap-1 p-1 text-w98-ink"
              data-selected={selected === item.id}
              style={
                selected === item.id
                  ? { outline: "1px dotted var(--color-w98-ink)" }
                  : undefined
              }
              onClick={() => setSelected(item.id)}
              onDoubleClick={() => activate(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  activate(item);
                }
              }}
            >
              <PixelIcon glyph={item.glyph} size={24} />
              <span className="text-center font-w98 text-[8px] leading-tight">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="w98-sunken mt-[2px] shrink-0 truncate px-1 py-0.5 font-w98 text-[8px] text-w98-ink">
        {status ??
          `${current.items.length} object(s)${
            view === "projects" ? " · double-click to open" : ""
          }`}
      </div>
    </div>
  );
}
