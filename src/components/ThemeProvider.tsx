"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DEFAULT_MODE,
  isThemeMode,
  resolveTheme,
  THEME_STORAGE_KEY,
  THEME_TRANSITION_MS,
  type ResolvedTheme,
  type ThemeMode,
} from "@/lib/theme";

/**
 * Theme context contract (ADR-004).
 *
 * The cinematic transition splits "the theme the user is heading toward" from
 * "the theme the page is currently painted as", because they disagree for the
 * ~2.2 s arc. Two distinct values express that split cleanly:
 *
 *   - `resolved`  — the **target** theme. Updates immediately on `setMode`, so
 *                   `SkyScene` knows which way to tween and the header toggle gives
 *                   instant feedback. This is *intent*, not what is painted yet.
 *   - `committed` — the **visual / DOM** theme. Always equals `<html data-theme>`,
 *                   `color-scheme`, the persisted mode's resolution, and the
 *                   `theme-color` meta. On an animated change it is held on the OLD
 *                   value until the twilight midpoint (~progress 0.5), then flips.
 *                   On a snap (reduced-motion / refocus / first load) it flips at
 *                   once. Anything that must match the painted page (page tokens,
 *                   `ThemeMetaColor`, `CursorSpotlight`, diagram light/dark) reads
 *                   `committed`, never `resolved`.
 *
 *   - `transition` — `{ animate, id }`. `id` increments on every trigger so
 *                    `SkyScene` can key an effect on it; `animate` is true only for
 *                    an explicit toggle that actually changes the theme (and not
 *                    under reduced-motion). The refocus/visibility re-resolve path
 *                    and no-op changes are `animate: false`.
 */
interface ThemeContextValue {
  mode: ThemeMode;
  /** Target theme — what the sky tweens toward (updates immediately). */
  resolved: ResolvedTheme;
  /** Visual/DOM theme — matches `<html data-theme>` (flips at mid-arc on animate). */
  committed: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  transition: { animate: boolean; id: number };
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * CSS cross-fade window for the mid-arc token flip. The page bg/ink/border colours
 * transition over this many ms while `html.theme-animating` is present, so the flip
 * reads as one cross-fade. **Must match the duration in `globals.css`
 * (`html.theme-animating { transition: ... }`).**
 */
const THEME_CROSSFADE_MS = 400;

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(stored) ? stored : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

/** Push the resolved theme onto <html> (mirrors the pre-paint script). DOM-only. */
function applyResolved(resolved: ResolvedTheme) {
  const el = document.documentElement;
  el.dataset.theme = resolved;
  el.style.colorScheme = resolved === "day" ? "light" : "dark";
}

/** Persist the user's mode choice. Swallows storage failures (private mode, etc.). */
function persistMode(mode: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* storage unavailable — keep the in-memory mode */
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazy init from the same source as the inline script, so client state agrees
  // with the DOM the script already set (no hydration flash). `committed` starts
  // equal to `resolved`: at first paint the DOM is already correct.
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);
  const initialResolved = useState<ResolvedTheme>(() =>
    resolveTheme(readStoredMode()),
  )[0];
  const [resolved, setResolved] = useState<ResolvedTheme>(initialResolved);
  const [committed, setCommitted] = useState<ResolvedTheme>(initialResolved);
  const [transition, setTransition] = useState<{
    animate: boolean;
    id: number;
  }>({ animate: false, id: 0 });

  // Refs mirror the latest target/visual themes for synchronous reads inside
  // callbacks and timers (state setters are async; we must not read stale state).
  const resolvedRef = useRef<ResolvedTheme>(initialResolved);
  const committedRef = useRef<ResolvedTheme>(initialResolved);
  // The single in-flight deferred-commit. `flip` fires at the midpoint; `declass`
  // removes `theme-animating` after the cross-fade. Either may be cancelled on
  // interruption (re-click mid-arc) so timing never double-fires.
  const pendingRef = useRef<{ flip?: number; declass?: number } | null>(null);

  // Re-assert the resolved theme on mount in case the pre-paint script was
  // blocked (e.g. by a CSP). DOM-only — no state churn.
  useEffect(() => {
    applyResolved(committedRef.current);
    // run once on mount only (committedRef is a ref — no reactive deps)
  }, []);

  /** Cancel any in-flight deferred commit and strip a lingering animating class. */
  const cancelPending = useCallback(() => {
    const p = pendingRef.current;
    if (p) {
      if (p.flip) window.clearTimeout(p.flip);
      if (p.declass) window.clearTimeout(p.declass);
      pendingRef.current = null;
    }
    document.documentElement.classList.remove("theme-animating");
  }, []);

  /** Flip the visual theme everywhere at once: DOM, `committed` state, storage. */
  const commitVisual = useCallback(
    (nextMode: ThemeMode, nextResolved: ResolvedTheme, persist: boolean) => {
      applyResolved(nextResolved);
      committedRef.current = nextResolved;
      setCommitted(nextResolved);
      if (persist) persistMode(nextMode);
    },
    [],
  );

  /**
   * Defer the visual flip to the twilight midpoint (THEME_TRANSITION_MS / 2),
   * wrapped in `html.theme-animating` so page tokens cross-fade. Cancellable.
   */
  const scheduleMidpointCommit = useCallback(
    (nextMode: ThemeMode, nextResolved: ResolvedTheme) => {
      const el = document.documentElement;
      const flip = window.setTimeout(() => {
        el.classList.add("theme-animating");
        commitVisual(nextMode, nextResolved, true);
        const declass = window.setTimeout(() => {
          el.classList.remove("theme-animating");
          pendingRef.current = null;
        }, THEME_CROSSFADE_MS);
        pendingRef.current = { declass };
      }, THEME_TRANSITION_MS / 2);
      pendingRef.current = { flip };
    },
    [commitVisual],
  );

  const setMode = useCallback(
    (next: ThemeMode) => {
      const nextResolved = resolveTheme(next);
      const prevResolved = resolvedRef.current;
      const reduceMotion = prefersReducedMotion();

      // Target updates immediately — the sky tweens toward it and the toggle
      // reflects intent right away.
      setModeState(next);
      setResolved(nextResolved);
      resolvedRef.current = nextResolved;

      // Animate only an explicit toggle that actually changes the theme, and
      // never under reduced-motion (which always snaps).
      const skyChanges = nextResolved !== prevResolved;
      const animate = skyChanges && !reduceMotion;
      setTransition((t) => ({ animate, id: t.id + 1 }));

      // Any prior in-flight commit is now stale — cancel before re-coordinating.
      cancelPending();

      if (nextResolved === committedRef.current) {
        // The DOM already shows the target theme: either a no-op mode change
        // (e.g. explicit→auto resolving the same), or a mid-arc reversal back to
        // the painted theme before its midpoint flip ran. Nothing to flip; just
        // persist the chosen mode so the preference isn't lost.
        persistMode(next);
        return;
      }

      if (animate) scheduleMidpointCommit(next, nextResolved);
      else commitVisual(next, nextResolved, true);
    },
    [cancelPending, commitVisual, scheduleMidpointCommit],
  );

  // Re-resolve auto on tab refocus only (no live mid-session flip while idle).
  // This is a **snap** path (ADR-004): no arc, no token cross-fade. setState
  // happens in the listener callbacks, never synchronously in the body.
  useEffect(() => {
    if (mode !== "auto") return;
    const reresolve = () => {
      const next = resolveTheme("auto");
      if (next === resolvedRef.current && next === committedRef.current) return;
      setResolved(next);
      resolvedRef.current = next;
      setTransition((t) => ({ animate: false, id: t.id + 1 }));
      cancelPending();
      // Snap the visual theme immediately; mode stays "auto" (already stored).
      commitVisual("auto", next, false);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") reresolve();
    };
    window.addEventListener("focus", reresolve);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", reresolve);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [mode, cancelPending, commitVisual]);

  // Clear any pending timer on unmount so a deferred flip can't fire late.
  useEffect(() => {
    return () => {
      const p = pendingRef.current;
      if (p?.flip) window.clearTimeout(p.flip);
      if (p?.declass) window.clearTimeout(p.declass);
    };
  }, []);

  const value = useMemo(
    () => ({ mode, resolved, committed, setMode, transition }),
    [mode, resolved, committed, setMode, transition],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
