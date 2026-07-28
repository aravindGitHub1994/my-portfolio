"use client";

// Desktop icon (plan-0009 §3.2): select on click/focus, open on
// double-click, Enter, or Space.
//
// 7.1: on touch a single tap opens. Double-tap is the shell's last
// hover-era affordance — it has no discoverable equivalent on a phone
// (there is no hover state to hint "this is armed"), and mobile browsers
// spend ~300 ms deciding whether a second tap is coming, which reads as
// the icon simply not working. Selection is a mouse idea anyway.

import type { Win98Icon } from "@/lib/win98State";
import { PixelIcon } from "../pixelIcons";
import { launchApp } from "./appDefs";
import { useShellLayout } from "./layoutContext";

export function Icon({
  icon,
  selected,
  onSelect,
}: {
  icon: Win98Icon;
  selected: boolean;
  onSelect: (id: string | null) => void;
}) {
  const { touch, touchUnit } = useShellLayout();
  return (
    <button
      type="button"
      className="w98-icon absolute flex flex-col items-center gap-1 bg-transparent"
      style={{
        left: 12 + icon.col * 84,
        top: 10 + icon.row * 68,
        width: 76,
        // The label sits below the glyph, so the button is already tall
        // enough; the floor only matters on a glyph-only edge case.
        minHeight: touch ? touchUnit : undefined,
      }}
      data-selected={selected}
      onClick={() => (touch ? launchApp(icon.id) : onSelect(icon.id))}
      onDoubleClick={() => {
        if (!touch) launchApp(icon.id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          launchApp(icon.id);
        }
      }}
    >
      <PixelIcon glyph={icon.glyph} size={touch ? 40 : 32} />
      <span
        className="w98-icon-label px-0.5 text-center font-w98 leading-tight"
        style={{ fontSize: touch ? 11 : 8 }}
      >
        {icon.label}
      </span>
    </button>
  );
}
