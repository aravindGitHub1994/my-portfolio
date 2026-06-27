/**
 * Tri-mode theme model (ADR-003). Single source of truth shared by the pre-paint
 * inline script (built as a string from these constants) and the React
 * `ThemeProvider`, so the two can never drift on the day-window rule.
 *
 *  - User *mode* is persisted in localStorage; absent ⇒ "auto".
 *  - The *resolved* theme is always "night" or "day".
 *  - Auto resolves from the local clock: day = 06:00 ≤ hour < 18:00, else night.
 *  - If the clock is unavailable, the fallback is "night" (brand floor / a
 *    deterministic value for crawlers).
 */

export type ThemeMode = "night" | "day" | "auto";
export type ResolvedTheme = "night" | "day";

export const THEME_STORAGE_KEY = "theme-mode";
export const DEFAULT_MODE: ThemeMode = "auto";

/** Day window, inclusive of start, exclusive of end (local clock hours). */
export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 18;

export function isDaytime(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= DAY_START_HOUR && hour < DAY_END_HOUR;
}

/** Resolve a mode to a concrete theme. Auto reads the clock; falls back to night. */
export function resolveTheme(
  mode: ThemeMode,
  date: Date = new Date(),
): ResolvedTheme {
  if (mode === "night" || mode === "day") return mode;
  try {
    return isDaytime(date) ? "day" : "night";
  } catch {
    return "night";
  }
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "night" || value === "day" || value === "auto";
}

/**
 * Inline pre-paint script (runs synchronously in <head> before first paint).
 * Self-contained — it cannot import this module, so the day-window constants are
 * interpolated in to keep a single source of truth. Mirrors `resolveTheme`.
 */
export const themeInitScript = `(function(){try{var m=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(m!=="night"&&m!=="day"&&m!=="auto")m=${JSON.stringify(
  DEFAULT_MODE,
)};var r;if(m==="night"||m==="day"){r=m;}else{var h=new Date().getHours();r=(h>=${DAY_START_HOUR}&&h<${DAY_END_HOUR})?"day":"night";}var e=document.documentElement;e.dataset.theme=r;e.style.colorScheme=(r==="day"?"light":"dark");}catch(_){var d=document.documentElement;d.dataset.theme="night";d.style.colorScheme="dark";}})();`;
