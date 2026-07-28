"use client";

// IE-style browser frame (plan-0009 §5.1): the period-correct successor
// to the Safari frame — a recreated product screenshot presented as "the
// live site" with the project's fictional domain in the address bar
// (ADR-006 §7 recreation universe; never a real client domain). Original
// pastiche only: generic toolbar words, globe pixel art, no "e" logo, no
// Microsoft-derived chrome (ADR-012 §10).

import { PixelIcon } from "../pixelIcons";

export function IEFrame({
  domain,
  screenshot,
  title,
}: {
  domain: string;
  screenshot: string;
  title: string;
}) {
  return (
    <div className="w98-raised p-[2px]">
      {/* Toolbar — decorative pastiche; the page beneath is a static
          recreation, so the buttons deliberately do nothing. */}
      <div className="flex items-center gap-1 px-1 py-0.5" aria-hidden="true">
        {["Back", "Forward", "Stop", "Refresh", "Home"].map((label) => (
          <span
            key={label}
            className="w98-btn inline-block h-[16px] px-1.5 font-w98 text-[7px] leading-[16px]"
          >
            {label}
          </span>
        ))}
        <span className="ml-auto">
          <PixelIcon glyph="globe" size={14} />
        </span>
      </div>

      {/* Address bar */}
      <div className="flex items-center gap-1 px-1 pb-0.5">
        <span className="font-w98 text-[8px] text-w98-ink">Address</span>
        <span className="w98-sunken flex-1 truncate bg-w98-field px-1 py-0.5 font-w98-mono text-[11px] leading-none text-w98-ink">
          {`http://${domain}/`}
        </span>
      </div>

      {/* The recreated page */}
      <div className="w98-sunken bg-w98-field">
        {/* eslint-disable-next-line @next/next/no-img-element -- static export (ADR-001): next/image needs a server */}
        <img
          src={screenshot}
          alt={`${title} — recreated product screenshot with dummy data`}
          className="block w-full"
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-2 px-1 py-0.5">
        <span className="w98-sunken flex-1 px-1 font-w98 text-[7px] text-w98-ink">
          Done
        </span>
        <span className="w98-sunken px-1 font-w98 text-[7px] text-w98-ink">
          Internet zone
        </span>
      </div>
    </div>
  );
}
