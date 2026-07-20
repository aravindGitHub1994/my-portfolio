// Lazy app loading (ADR-012 §8): docked Windows apps stay out of the
// initial bundle; each chunk loads on first open and registers its
// components via registerApp. The Window shows a period hourglass while
// the "program installs"; touchWin98() re-renders it when the chunk
// arrives. AppIds with no loader here fall through to the deadpan
// "Insert Disk 2" placeholder (their slice hasn't shipped).

import { PROJECTS } from "@/lib/projects";
import { touchWin98 } from "@/lib/win98State";
import { resolveApp } from "../shell/appDefs";

type Loader = () => Promise<unknown>;

const load51: Loader = () => import("./register51");
const load52: Loader = () => import("./register52");
const load53: Loader = () => import("./register53");
const load81: Loader = () => import("./register81");
const load82: Loader = () => import("./register82");

const LOADERS: Record<string, Loader> = {
  explorer: load51,
  "explorer-projects": load51,
  ...Object.fromEntries(
    PROJECTS.map((p) => [`project-${p.slug}`, load51] as const),
  ),
  wordpad: load52,
  notepad: load52,
  "add-remove": load52,
  outlook: load53,
  "dialup-linkedin": load53,
  "dialup-github": load53,
  "recycle-bin": load81,
  minesweeper: load82,
};

export function hasAppLoader(appId: string): boolean {
  return appId in LOADERS;
}

const started = new Set<string>();

/** Idempotent: kick off the chunk load for an appId (no-op when already
 *  registered, already loading, or not lazily loadable). */
export function ensureAppLoaded(appId: string): void {
  const loader = LOADERS[appId];
  if (!loader || started.has(appId) || resolveApp(appId)) return;
  started.add(appId);
  void loader()
    .then(() => touchWin98())
    .catch(() => {
      // Failed chunk (offline?): allow a retry on the next open.
      started.delete(appId);
    });
}
