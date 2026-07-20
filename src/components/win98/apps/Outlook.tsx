"use client";

// Outlook Express compose (plan-0009 §5.3, ADR-012 §6): the playful
// contact surface. Pre-addressed to the real email; Send is a mailto:
// link carrying the typed subject/body — no backend (ADR-001), the
// visitor's own mail program does the sending. Original chrome only
// (ADR-012 §10).

import { useState } from "react";
import { SITE } from "@/lib/nav";

export function Outlook() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // encodeURIComponent keeps typed newlines/&/# from breaking out of
  // their mailto parameter (client-side "injection" hygiene).
  const params = [
    subject && `subject=${encodeURIComponent(subject)}`,
    body && `body=${encodeURIComponent(body)}`,
  ]
    .filter(Boolean)
    .join("&");
  const mailto = `mailto:${SITE.email}${params ? `?${params}` : ""}`;

  return (
    <div
      className="-m-2 flex h-[calc(100%+16px)] flex-col"
      // Esc normally closes the window (Window.tsx) — but not while the
      // visitor is mid-draft; swallowing it here protects the compose.
      onKeyDown={(e) => {
        if (e.key === "Escape") e.stopPropagation();
      }}
    >
      <div
        className="flex shrink-0 gap-3 px-2 py-1 font-w98 text-[8px] text-w98-ink"
        aria-hidden="true"
      >
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Insert</span>
        <span>Tools</span>
        <span>Help</span>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-b border-w98-chrome-dark px-1 pb-1">
        <a
          href={mailto}
          className="w98-btn h-[20px] px-3 font-w98 text-[8px] leading-[20px] text-w98-ink no-underline"
        >
          Send
        </a>
        <span className="font-w98 text-[8px] text-w98-ink" aria-hidden="true">
          opens your mail program
        </span>
      </div>

      <div className="grid shrink-0 grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1 p-2 pb-1">
        <label className="font-w98 text-[8px] text-w98-ink" htmlFor="ol-to">
          To:
        </label>
        <input
          id="ol-to"
          readOnly
          value={SITE.email}
          className="w98-field px-1 py-0.5 font-w98-mono text-[11px] text-w98-ink"
        />
        <label
          className="font-w98 text-[8px] text-w98-ink"
          htmlFor="ol-subject"
        >
          Subject:
        </label>
        <input
          id="ol-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w98-field px-1 py-0.5 font-w98-mono text-[11px] text-w98-ink"
        />
      </div>

      <textarea
        aria-label="Message"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w98-field mx-2 mb-2 min-h-0 flex-1 resize-none p-2 font-w98-mono text-[11px] leading-[1.4] text-w98-ink"
      />
    </div>
  );
}
