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
  setStartMenuOpen,
  win98State,
} from "@/lib/win98State";
import { playClick } from "@/lib/audio";
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

export function Desktop({ scale = 1 }: { scale?: number }) {
  useWin98Version();
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuPoint | null>(null);
  const stage = useRef<HTMLDivElement>(null);

  const { phase, icons, windows, focusId, startMenuOpen } = win98State;

  if (phase !== "desktop") {
    // 3.3 boot/shutdown parity screens (painter equivalents in DOM).
    return <Boot />;
  }

  return (
    <div
      ref={stage}
      className="relative overflow-hidden bg-w98-desktop"
      style={{ width: DESKTOP_W, height: DESKTOP_H }}
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
          x: (e.clientX - rect.left) / scale,
          y: (e.clientY - rect.top) / scale,
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
            <Window
              key={win.id}
              win={win}
              focused={focusId === win.id}
              scale={scale}
            />
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
