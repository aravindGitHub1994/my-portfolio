"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_MODE,
  isThemeMode,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemeMode,
} from "@/lib/theme";

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(stored) ? stored : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

/** Push the resolved theme onto <html> (mirrors the pre-paint script). */
function applyResolved(resolved: ResolvedTheme) {
  const el = document.documentElement;
  el.dataset.theme = resolved;
  el.style.colorScheme = resolved === "day" ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazy init from the same source as the inline script, so client state agrees
  // with the DOM the script already set (no hydration flash).
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    resolveTheme(readStoredMode()),
  );

  // Re-assert the resolved theme on mount in case the pre-paint script was
  // blocked (e.g. by a CSP). DOM-only — no state churn.
  useEffect(() => {
    applyResolved(resolved);
    // run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    const nextResolved = resolveTheme(next);
    setModeState(next);
    setResolved(nextResolved);
    applyResolved(nextResolved);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage unavailable — keep the in-memory mode */
    }
  }, []);

  // Re-resolve auto on tab refocus only (no live mid-session flip while idle).
  // setState happens in the listener callbacks, never synchronously in the body.
  useEffect(() => {
    if (mode !== "auto") return;
    const reresolve = () => {
      const next = resolveTheme("auto");
      setResolved(next);
      applyResolved(next);
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
  }, [mode]);

  const value = useMemo(
    () => ({ mode, resolved, setMode }),
    [mode, resolved, setMode],
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
