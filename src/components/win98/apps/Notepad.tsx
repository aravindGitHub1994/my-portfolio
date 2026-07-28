"use client";

// Notepad (plan-0009 §5.2): ABOUT_ME.txt — the one deadpan-sincere
// surface (ADR-012 §1). A plain read-only text viewer; the sincerity is
// the content, not the chrome.

import { ABOUT_ME } from "@/lib/aboutMe";

export function Notepad() {
  return (
    <div className="-m-2 flex h-[calc(100%+16px)] flex-col">
      <div
        className="flex shrink-0 gap-3 px-2 py-1 font-w98 text-[8px] text-w98-ink"
        aria-hidden="true"
      >
        <span>File</span>
        <span>Edit</span>
        <span>Search</span>
        <span>Help</span>
      </div>
      <pre className="w98-field min-h-0 flex-1 overflow-auto p-2 font-w98-mono text-[12px] leading-[1.4] whitespace-pre-wrap text-w98-ink">
        {ABOUT_ME}
      </pre>
    </div>
  );
}
