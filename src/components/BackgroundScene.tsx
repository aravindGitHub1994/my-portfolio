"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Starfield } from "@/components/Starfield";
import { Cloudfield } from "@/components/Cloudfield";

const noop = () => () => {};

/** Renders only after hydration to ensure the correct resolved theme is known. */
function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/**
 * Gates the background canvas on the resolved theme:
 * - Night → animated `Starfield`.
 * - Day  → daytime `Cloudfield` (sun + drifting clouds).
 *
 * Exactly one canvas is active at a time. Nothing renders during SSR (the
 * CSS `body::before` gradient fills in until JS mounts).
 */
export function BackgroundScene() {
  const { resolved } = useTheme();
  const mounted = useMounted();

  if (!mounted) return null;
  return resolved === "day" ? <Cloudfield /> : <Starfield />;
}
