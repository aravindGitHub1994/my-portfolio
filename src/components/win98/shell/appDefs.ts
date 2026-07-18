// App launch definitions + content registry (plan-0009 §3.2). Icons and
// Start-menu entries open windows through APP_DEFS; window CONTENT is
// resolved through the registry so each 5.x/8.x app can lazy-register its
// component without the shell importing app code (chunk boundaries stay
// clean — ADR-012 §8).

import type { ComponentType } from "react";
import { openWindow, type IconGlyph, type Win98Window } from "@/lib/win98State";

export interface AppDef {
  appId: string;
  title: string;
  glyph: IconGlyph;
  width: number;
  height: number;
}

/** Keyed by desktop-icon id (and reused by the Start menu). */
export const APP_DEFS: Record<string, AppDef> = {
  "my-computer": {
    appId: "explorer",
    title: "My Computer",
    glyph: "computer",
    width: 380,
    height: 280,
  },
  "my-projects": {
    appId: "explorer-projects",
    title: "My Projects",
    glyph: "folder",
    width: 420,
    height: 300,
  },
  "resume-doc": {
    appId: "wordpad",
    title: "resume.doc - WordPad",
    glyph: "document",
    width: 440,
    height: 340,
  },
  "about-me": {
    appId: "notepad",
    title: "ABOUT_ME.txt - Notepad",
    glyph: "notepad",
    width: 360,
    height: 280,
  },
  outlook: {
    appId: "outlook",
    title: "New Message - Outlook Express",
    glyph: "envelope",
    width: 420,
    height: 320,
  },
  linkedin: {
    appId: "dialup-linkedin",
    title: "Connecting to LinkedIn...",
    glyph: "globe",
    width: 300,
    height: 160,
  },
  github: {
    appId: "dialup-github",
    title: "Connecting to GitHub...",
    glyph: "globe",
    width: 300,
    height: 160,
  },
  minesweeper: {
    appId: "minesweeper",
    title: "Minesweeper",
    glyph: "mine",
    width: 240,
    height: 300,
  },
  "recycle-bin": {
    appId: "recycle-bin",
    title: "Recycle Bin",
    glyph: "bin",
    width: 380,
    height: 260,
  },
};

export function launchApp(iconId: string): void {
  const def = APP_DEFS[iconId];
  if (!def) return;
  openWindow({
    id: def.appId,
    appId: def.appId,
    title: def.title,
    glyph: def.glyph,
    width: def.width,
    height: def.height,
  });
}

export type AppComponent = ComponentType<{ win: Win98Window }>;

/** appId → content component; 5.x/8.x apps register on their chunk load. */
const registry = new Map<string, AppComponent>();

export function registerApp(appId: string, component: AppComponent): void {
  registry.set(appId, component);
}

export function resolveApp(appId: string): AppComponent | null {
  return registry.get(appId) ?? null;
}
