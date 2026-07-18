"use client";

// Desktop icon (plan-0009 §3.2): select on click/focus, open on
// double-click, Enter, or Space (touch: double-tap fires dblclick).

import type { Win98Icon } from "@/lib/win98State";
import { PixelIcon } from "../pixelIcons";
import { launchApp } from "./appDefs";

export function Icon({
  icon,
  selected,
  onSelect,
}: {
  icon: Win98Icon;
  selected: boolean;
  onSelect: (id: string | null) => void;
}) {
  return (
    <button
      type="button"
      className="w98-icon absolute flex w-[76px] flex-col items-center gap-1 bg-transparent"
      style={{ left: 12 + icon.col * 84, top: 10 + icon.row * 68 }}
      data-selected={selected}
      onClick={() => onSelect(icon.id)}
      onDoubleClick={() => launchApp(icon.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          launchApp(icon.id);
        }
      }}
    >
      <PixelIcon glyph={icon.glyph} size={32} />
      <span className="w98-icon-label px-0.5 text-center font-w98 text-[8px] leading-tight">
        {icon.label}
      </span>
    </button>
  );
}
