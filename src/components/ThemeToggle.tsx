"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "@/components/ThemeProvider";

const noop = () => () => {};

/**
 * SSR-safe "are we on the client yet?" flag.
 * The server snapshot is `false` so no dynamic icons render during prerender.
 */
function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/** Heroicons moon-solid (24×24). */
function MoonIcon() {
  return (
    <path
      fill="currentColor"
      d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z"
    />
  );
}

/** Heroicons sun-solid (24×24). */
function SunIcon() {
  return (
    <path
      fill="currentColor"
      d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.166 17.834a.75.75 0 0 0-1.06 1.06l1.59 1.591a.75.75 0 1 0 1.061-1.06l-1.59-1.591ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.166 7.166a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591Z"
    />
  );
}

/** Neutral ring shown during SSR before hydration — no sun/moon yet. */
function NeutralIcon() {
  return (
    <circle
      cx="12"
      cy="12"
      r="5"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
  );
}

/**
 * The "alive" theme switcher: an animated sun/moon scene + separate Auto badge.
 *
 * - Scene button renders the *currently resolved* theme (sun = day, moon = night).
 *   Click ⇒ flip night ↔ day as an **explicit** mode, clearing Auto.
 * - Auto badge (A) sets auto mode. While active, the scene tracks the clock
 *   and shows a small "a" overlay on the icon.
 *
 * Always visible on desktop and mobile (no sm:hidden). Keyboard-operable,
 * correct ARIA, reduced-motion safe (no morph — just instant state swap).
 */
export function ThemeToggle() {
  const { mode, resolved, setMode } = useTheme();
  const mounted = useMounted();

  const handleSceneClick = () => {
    // Flip to the opposite explicit mode, which also clears Auto.
    setMode(resolved === "night" ? "day" : "night");
  };

  const handleAutoClick = () => {
    setMode("auto");
  };

  // Until mounted, SSR and the first client render must agree (the provider's
  // mode/resolved come from localStorage on the client but default on the
  // server). Gate every theme-dependent attribute on `mounted` to avoid a
  // hydration mismatch; real values appear after mount.
  const autoActive = mounted && mode === "auto";

  const sceneLabel = !mounted
    ? "Toggle theme"
    : resolved === "night"
      ? "Theme: night — click to switch to day"
      : "Theme: day — click to switch to night";

  const autoLabel = !mounted
    ? "Enable auto mode (follow local clock)"
    : mode === "auto"
      ? "Auto mode on (following local clock)"
      : "Enable auto mode (follow local clock)";

  return (
    <div className="flex items-center gap-0.5">
      {/* Auto badge — separate affordance to engage auto mode */}
      <button
        type="button"
        aria-pressed={autoActive}
        aria-label={autoLabel}
        onClick={handleAutoClick}
        className={[
          "flex h-7 w-7 items-center justify-center rounded-full font-mono text-[10px] font-semibold",
          "transition-colors duration-200",
          "focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2",
          autoActive
            ? "bg-gold/20 text-gold ring-1 ring-gold/30"
            : "text-ink-subtle hover:text-ink-muted",
        ].join(" ")}
      >
        A
      </button>

      {/* Scene button — sun or moon, click flips between explicit day/night */}
      <button
        type="button"
        aria-label={sceneLabel}
        onClick={handleSceneClick}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors duration-200 hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          aria-hidden="true"
        >
          {/* useMounted gate keeps SSR/client in sync; prerender shows neutral ring */}
          {mounted ? (
            resolved === "night" ? <MoonIcon /> : <SunIcon />
          ) : (
            <NeutralIcon />
          )}
        </svg>

        {/* Small "a" indicator overlay when auto mode is active */}
        {mounted && mode === "auto" && (
          <span
            aria-hidden="true"
            className="absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-bg font-mono text-[7px] font-bold text-gold ring-1 ring-gold/40"
          >
            a
          </span>
        )}
      </button>
    </div>
  );
}
