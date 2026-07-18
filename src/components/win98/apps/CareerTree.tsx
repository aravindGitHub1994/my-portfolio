"use client";

// C:\Career\ tree (plan-0009 §5.2, ADR-012 §6): the five-role timeline
// as nested folders, oldest nested deepest — opening folders digs back
// through time (Assembly on top, Sutherland at the bottom of the
// stack). Renders inside Explorer's Career view. Each folder's "files"
// are the role's bullet points from resume.ts.
//
// Keyboard (acceptance: tree keyboard-navigable): ArrowUp/Down walk
// visible folders (roving tabindex), ArrowRight expands, ArrowLeft
// collapses, Enter/Space selects into the file pane.

import { useRef, useState } from "react";
import { EXPERIENCE } from "@/lib/resume";
import { PixelIcon } from "../pixelIcons";

// EXPERIENCE is newest-first; index doubles as tree depth (each older
// employer nests one level deeper).
const ROLES = EXPERIENCE;

export function CareerTree() {
  // All expanded on open so the whole dig is visible at a glance.
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  // A folder is visible when no ancestor is collapsed; the chain means
  // visibility ends at the first collapsed folder.
  const firstCollapsed = ROLES.findIndex((_, i) => collapsed.has(i));
  const visibleCount = firstCollapsed < 0 ? ROLES.length : firstCollapsed + 1;

  const setCollapsedAt = (index: number, value: boolean) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (value) next.add(index);
      else next.delete(index);
      return next;
    });
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowDown" && index + 1 < visibleCount) {
      e.preventDefault();
      buttons.current[index + 1]?.focus();
    } else if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      buttons.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setCollapsedAt(index, false);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setCollapsedAt(index, true);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelected(index);
    }
  };

  const role = ROLES[selected];

  return (
    <div className="flex h-full min-h-0">
      {/* Tree pane */}
      <ul
        role="tree"
        aria-label="Career folders"
        className="w98-field w-[45%] shrink-0 overflow-auto p-1"
      >
        {ROLES.slice(0, visibleCount).map((item, i) => (
          <li
            key={item.org}
            role="treeitem"
            aria-expanded={i < ROLES.length - 1 ? !collapsed.has(i) : undefined}
            aria-selected={selected === i}
          >
            <button
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              tabIndex={i === 0 ? 0 : -1}
              className="flex w-full items-center gap-1 px-0.5 py-0.5 text-left text-w98-ink"
              style={{
                paddingLeft: 2 + i * 10,
                background:
                  selected === i ? "var(--color-w98-select)" : undefined,
                color:
                  selected === i ? "var(--color-w98-ink-invert)" : undefined,
              }}
              onClick={() => {
                setSelected(i);
                if (collapsed.has(i)) setCollapsedAt(i, false);
              }}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              <span className="font-w98-mono text-[11px]" aria-hidden="true">
                {i < ROLES.length - 1 ? (collapsed.has(i) ? "+" : "-") : " "}
              </span>
              <PixelIcon glyph="folder" size={13} />
              <span className="truncate font-w98 text-[8px] leading-tight">
                {item.org}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* File pane — the selected role's bullet points as documents. */}
      <div className="w98-field ml-[2px] min-w-0 flex-1 overflow-auto p-2">
        <h4 className="font-w98 text-[8px] font-bold text-w98-ink">
          {role.role}
        </h4>
        <p className="font-w98-mono text-[11px] italic text-w98-ink">
          {role.org} · {role.location}
        </p>
        <ul className="mt-2 flex flex-col gap-2">
          {role.points.map((point, i) => (
            <li key={point} className="flex items-start gap-1.5">
              <span className="shrink-0 pt-0.5">
                <PixelIcon glyph="document" size={13} />
              </span>
              <div className="min-w-0">
                <p className="font-w98 text-[7px] text-w98-ink">
                  {`highlight_${String(i + 1).padStart(2, "0")}.txt`}
                </p>
                <p className="font-w98-mono text-[11px] leading-[1.35] text-w98-ink">
                  {point}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
