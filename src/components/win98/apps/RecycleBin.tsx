"use client";

// Recycle Bin (plan-0009 §8.1, ADR-012 §6): the retired redesigns, kept
// where deleted things go. Every entry is a real experiment this repo
// actually shipped and then replaced — the joke only works because the
// list is honest. Restore is offered and always refused.
//
// Emptying is the second BSOD trigger: the first press asks, the second
// crashes. Two strikes rather than one so nobody meets the gag by
// mis-clicking, and so the refusal line gets read before the punchline.

import { useState } from "react";
import { crashWorkstation } from "@/lib/win98State";
import { PixelIcon } from "../pixelIcons";

interface BinItem {
  name: string;
  origin: string;
  size: string;
}

const ITEMS: BinItem[] = [
  { name: "lens.exe", origin: "C:\\Portfolio\\v3", size: "412 KB" },
  { name: "glass_cube.scn", origin: "C:\\Portfolio\\v2", size: "188 KB" },
  { name: "noise_signal.tmp", origin: "C:\\Portfolio\\drafts", size: "6 KB" },
  {
    name: "one_more_gradient.psd",
    origin: "C:\\Portfolio\\drafts",
    size: "24.1 MB",
  },
  {
    name: "hero_copy_FINAL_v7.txt",
    origin: "C:\\Portfolio\\drafts",
    size: "2 KB",
  },
];

const RESTORE_REFUSAL = "These files cannot be restored.";
const EMPTY_WARNING =
  "Are you sure? This action cannot be undone, and was already undone.";

/** What the crash screen opens with when the bin is what did it. */
const EMPTY_CRASH_REASON =
  "You emptied a bin that was already empty, twice.";

export function RecycleBin() {
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  // Armed by the first Empty press; the second one crashes.
  const [armed, setArmed] = useState(false);

  const empty = () => {
    if (armed) {
      crashWorkstation(EMPTY_CRASH_REASON);
      return;
    }
    setArmed(true);
    setStatus(EMPTY_WARNING);
  };

  return (
    <div className="-m-2 flex h-[calc(100%+16px)] flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-1 p-1">
        <button
          type="button"
          className="w98-btn h-[18px] px-2 font-w98 text-[8px]"
          style={{ opacity: selected ? 1 : 0.5 }}
          disabled={!selected}
          onClick={() => setStatus(RESTORE_REFUSAL)}
        >
          Restore
        </button>
        <button
          type="button"
          className="w98-btn h-[18px] px-2 font-w98 text-[8px]"
          onClick={empty}
        >
          Empty Recycle Bin
        </button>
      </div>

      {/* Detail list — the era's column view, hand-built. */}
      <div className="w98-field min-h-0 flex-1 overflow-auto">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-1 py-0.5 font-w98 text-[8px] text-w98-ink">
          <span className="w98-sunken px-1">Name</span>
          <span className="w98-sunken px-1">Original Location</span>
          <span className="w98-sunken px-1">Size</span>
        </div>
        {ITEMS.map((item) => (
          <button
            key={item.name}
            type="button"
            className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-x-3 px-1 py-[3px] text-left font-w98 text-[8px]"
            style={
              selected === item.name
                ? {
                    background: "var(--color-w98-select)",
                    color: "var(--color-w98-ink-invert)",
                  }
                : { color: "var(--color-w98-ink)" }
            }
            onClick={() => setSelected(item.name)}
            onDoubleClick={() => setStatus(RESTORE_REFUSAL)}
          >
            <span className="flex items-center gap-1 truncate">
              <PixelIcon glyph="document" size={12} />
              {item.name}
            </span>
            <span className="truncate opacity-80">{item.origin}</span>
            <span className="tabular-nums opacity-80">{item.size}</span>
          </button>
        ))}
      </div>

      {/* Status bar */}
      <div className="w98-sunken mt-[2px] shrink-0 truncate px-1 py-0.5 font-w98 text-[8px] text-w98-ink">
        {status ?? `${ITEMS.length} object(s) · nothing here is coming back`}
      </div>
    </div>
  );
}
