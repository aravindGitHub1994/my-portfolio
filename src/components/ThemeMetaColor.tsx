"use client";

import { useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";

/** Night background and day background — must match the tokens in globals.css. */
const THEME_BG: Record<"night" | "day", string> = {
  night: "#07071a",
  day:   "#f4ecd8",
};

/**
 * Updates `<meta name="theme-color">` to match the **committed** (painted) theme
 * so the mobile browser chrome (address bar, status bar) reflects the palette.
 *
 * Reads `committed`, not `resolved` (ADR-004): on an animated toggle the chrome
 * must flip in lockstep with `<html data-theme>` at the twilight midpoint, not
 * eagerly when the target changes. DOM-only side-effect; renders nothing visible.
 */
export function ThemeMetaColor() {
  const { committed } = useTheme();

  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (meta) {
      meta.setAttribute("content", THEME_BG[committed]);
    }
  }, [committed]);

  return null;
}
