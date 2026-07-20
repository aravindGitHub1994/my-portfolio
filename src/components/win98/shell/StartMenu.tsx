"use client";

// Start menu (plan-0009 §3.2): sidebar + entries mapped to the same
// APP_DEFS the icons use. Esc / outside-click closes (Desktop owns that);
// Shut Down drives the boot machine's shutdown phase.

import { setBootPhase, setStartMenuOpen } from "@/lib/win98State";
import { PixelIcon } from "../pixelIcons";
import { APP_DEFS, launchApp } from "./appDefs";
import { useShellLayout } from "./layoutContext";

const ENTRIES: { label: string; iconId: string }[] = [
  { label: "My Projects", iconId: "my-projects" },
  { label: "resume.doc", iconId: "resume-doc" },
  { label: "ABOUT_ME.txt", iconId: "about-me" },
  { label: "Add/Remove Programs", iconId: "add-remove" },
  { label: "Outlook Express", iconId: "outlook" },
  { label: "Minesweeper", iconId: "minesweeper" },
];

export function StartMenu() {
  const { touch, touchUnit, taskbarH } = useShellLayout();
  // Menu rows are the densest tap targets in the shell — py-1 around 9px
  // type is ~17px, well under the floor, so touch drives the row height
  // explicitly rather than relying on padding.
  const rowStyle = touch
    ? { minHeight: touchUnit, fontSize: 12 }
    : { fontSize: 9 };
  return (
    <nav
      className="w98-raised absolute left-0 z-50 flex p-[3px]"
      style={{ bottom: taskbarH, width: touch ? 240 : 170 }}
      aria-label="Start menu"
    >
      <div className="w98-titlebar flex w-[20px] items-end justify-center pb-1">
        <span
          className="font-w98 text-[8px] tracking-wider"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          workstation98
        </span>
      </div>
      <ul className="flex-1">
        {ENTRIES.map((entry) => (
          <li key={entry.iconId}>
            <button
              type="button"
              className="w98-menu-item flex w-full items-center gap-2 px-2 py-1 text-left font-w98 text-w98-ink"
              style={rowStyle}
              onClick={() => {
                launchApp(entry.iconId);
                setStartMenuOpen(false);
              }}
            >
              <PixelIcon
                glyph={APP_DEFS[entry.iconId].glyph}
                size={touch ? 20 : 16}
              />
              {entry.label}
            </button>
          </li>
        ))}
        <li aria-hidden="true" className="mx-1 my-1 border-t border-w98-chrome-dark" />
        <li>
          <button
            type="button"
            className="w98-menu-item flex w-full items-center gap-2 px-2 py-1 text-left font-w98 text-w98-ink"
            style={rowStyle}
            onClick={() => {
              setStartMenuOpen(false);
              setBootPhase("shutdown");
            }}
          >
            <PixelIcon glyph="computer" size={touch ? 20 : 16} />
            Shut Down...
          </button>
        </li>
      </ul>
    </nav>
  );
}
