"use client";

// The DOM shell (plan-0009 §3.2): desktop icons, windows, taskbar, Start
// menu, context menu — all against win98State, mirroring the 3.1 painter
// pixel-for-concept. Renders in the 640×480 virtual space; the host
// scales it (harness fit-to-viewport now, 4.2's CRT-quad matrix later).
// Non-desktop boot phases get minimal DOM parity screens (3.3 replaces
// them with the real sequences).

import { useEffect, useRef, useState } from "react";
import "./chrome.css";
import {
  DESKTOP_H,
  DESKTOP_W,
  setSoloWindows,
  setStartMenuOpen,
  win98State,
} from "@/lib/win98State";
import {
  computeShellLayout,
  coarsePointer,
  desktopLayout,
} from "@/lib/shellLayout";
import { playClick } from "@/lib/audio";
import { ShellLayoutProvider } from "./layoutContext";
import { useWin98Version } from "./useWin98";
import { Boot } from "../apps/Boot";
import { Icon } from "./Icon";
import { Window } from "./Window";
import { Taskbar } from "./Taskbar";
import { StartMenu } from "./StartMenu";
import { ContextMenu } from "./ContextMenu";

interface MenuPoint {
  x: number;
  y: number;
}

/** Viewport facts, read in an effect only — prerender must stay DOM-free. */
interface Viewport {
  w: number;
  h: number;
  coarse: boolean;
}

export function Desktop({ scale = 1 }: { scale?: number }) {
  useWin98Version();
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuPoint | null>(null);
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const read = () =>
      setViewport({
        w: window.innerWidth,
        h: window.innerHeight,
        coarse: coarsePointer(),
      });
    read();
    // orientationchange lands before innerWidth settles on some phones;
    // resize always follows it, so resize alone is the honest signal.
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  // Before the first effect the shell is the desktop — the server-rendered
  // markup and the painter-parity harness both want exactly that.
  const layout = viewport
    ? computeShellLayout(viewport.w, viewport.h, viewport.coarse, scale)
    : desktopLayout(scale);

  // Solo mode is a store fact so every open path obeys it (win98State
  // §7.1); the shell only decides *when* it applies.
  useEffect(() => {
    setSoloWindows(layout.touch);
  }, [layout.touch]);

  const { phase, icons, windows, focusId, startMenuOpen } = win98State;

  if (phase !== "desktop") {
    // 3.3 boot/shutdown parity screens (painter equivalents in DOM).
    return <Boot />;
  }

  return (
    <ShellLayoutProvider value={layout}>
      <div
        ref={stage}
        className="relative overflow-hidden bg-w98-desktop"
        style={{ width: layout.width, height: layout.height }}
        onPointerDown={(e) => {
          // Delegated UI click (6.1) — one listener for the whole shell
          // beats an onClick audio call in every button. Pointerdown, not
          // click, so the tick lands with the press like the era's did.
          if (e.target instanceof Element && e.target.closest("button")) {
            playClick();
          }
          if (e.target === stage.current) {
            setSelectedIcon(null);
            setMenu(null);
            setStartMenuOpen(false);
          }
        }}
        onContextMenu={(e) => {
          if (e.target !== stage.current) return;
          e.preventDefault();
          const rect = stage.current.getBoundingClientRect();
          setMenu({
            x: (e.clientX - rect.left) / layout.scale,
            y: (e.clientY - rect.top) / layout.scale,
          });
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setMenu(null);
            setStartMenuOpen(false);
          }
        }}
      >
        {icons.map((icon) => (
          <Icon
            key={icon.id}
            icon={icon}
            selected={selectedIcon === icon.id}
            onSelect={setSelectedIcon}
          />
        ))}

        {windows.map(
          (win) =>
            !win.minimized && (
              <Window key={win.id} win={win} focused={focusId === win.id} />
            ),
        )}

        {startMenuOpen && <StartMenu />}

        {menu && (
          <ContextMenu
            x={menu.x}
            y={menu.y}
            items={[
              { label: "Arrange Icons", action: () => setSelectedIcon(null) },
              { label: "Refresh" },
              { label: "Properties", disabled: true },
            ]}
            onClose={() => setMenu(null)}
          />
        )}

        <Taskbar />
      </div>
    </ShellLayoutProvider>
  );
}

/**
 * `?scene=shell` harness: the shell alone, scaled to fit the viewport,
 * auto-booted to the desktop. Real DOM — deliberately NOT aria-hidden.
 */
export function ShellHarness() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    // Harness jumps straight to the desktop (boot beats are 3.3's).
    win98State.phase = "desktop";
    win98State.version++;
    const fit = () =>
      setScale(
        Math.min(
          window.innerWidth / DESKTOP_W,
          window.innerHeight / DESKTOP_H,
        ) * 0.94,
      );
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black">
      <div style={{ transform: `scale(${scale})` }}>
        <Desktop scale={scale} />
      </div>
    </div>
  );
}
