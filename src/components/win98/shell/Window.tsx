"use client";

// Win98 window chrome (plan-0009 §3.2): drag (title bar), resize (SE
// grip), z-order/focus, minimize/maximize/close — all writing through
// win98State actions so the 3.1 painter mirrors every change. Pointer
// events cover mouse + touch; Esc closes the focused window. Drag math
// runs in the shell's 640×480 virtual space — `scale` converts client
// pixels (4.2's dock reuses this for the CRT-quad transform).

import { createElement, useEffect, useRef } from "react";
import {
  closeWindow,
  focusWindow,
  minimizeWindow,
  moveWindow,
  resizeWindow,
  toggleMaximizeWindow,
  DESKTOP_W,
  DESKTOP_H,
  type Win98Window,
} from "@/lib/win98State";
import { PixelIcon } from "../pixelIcons";
import { ensureAppLoaded, hasAppLoader } from "../apps/lazyApps";
import { resolveApp } from "./appDefs";

interface DragState {
  pointerId: number;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
}

export function Window({
  win,
  focused,
  scale,
}: {
  win: Win98Window;
  focused: boolean;
  scale: number;
}) {
  const drag = useRef<DragState | null>(null);

  const beginDrag = (
    e: React.PointerEvent,
    mode: DragState["mode"],
  ) => {
    if (win.maximized) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = {
      pointerId: e.pointerId,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      baseX: mode === "move" ? win.x : win.width,
      baseY: mode === "move" ? win.y : win.height,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = (e.clientX - d.startX) / scale;
    const dy = (e.clientY - d.startY) / scale;
    if (d.mode === "move") {
      moveWindow(
        win.id,
        Math.min(Math.max(d.baseX + dx, -win.width + 40), DESKTOP_W - 40),
        Math.min(Math.max(d.baseY + dy, 0), DESKTOP_H - 40),
      );
    } else {
      resizeWindow(win.id, d.baseX + dx, d.baseY + dy);
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    if (drag.current?.pointerId === e.pointerId) drag.current = null;
  };

  // Registry LOOKUP, not creation — apps register stable components on
  // their chunk load; createElement keeps the react-compiler rule happy.
  const content = resolveApp(win.appId);

  // Lazy apps (ADR-012 §8) load on first open; touchWin98() re-renders
  // this window when the chunk registers.
  useEffect(() => {
    if (!content) ensureAppLoaded(win.appId);
  }, [content, win.appId]);

  return (
    <section
      className="w98-raised absolute flex flex-col p-[3px]"
      style={
        win.maximized
          ? { left: 0, top: 0, width: DESKTOP_W, height: DESKTOP_H - 28 }
          : { left: win.x, top: win.y, width: win.width, height: win.height }
      }
      aria-label={win.title}
      onPointerDown={() => {
        if (!focused) focusWindow(win.id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") closeWindow(win.id);
      }}
    >
      <header
        className={`${focused ? "w98-titlebar" : "w98-titlebar-inactive"} flex h-[18px] shrink-0 items-center gap-1 px-0.5`}
        style={{ touchAction: "none" }}
        onPointerDown={(e) => beginDrag(e, "move")}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => toggleMaximizeWindow(win.id)}
      >
        <PixelIcon glyph={win.glyph} size={13} />
        <span className="flex-1 truncate font-w98 text-[8px] leading-none">
          {win.title}
        </span>
        <button
          type="button"
          className="w98-btn h-[13px] w-[14px] font-w98 text-[7px] leading-none"
          aria-label={`Minimize ${win.title}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => minimizeWindow(win.id)}
        >
          _
        </button>
        <button
          type="button"
          className="w98-btn h-[13px] w-[14px] font-w98 text-[7px] leading-none"
          aria-label={`Maximize ${win.title}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => toggleMaximizeWindow(win.id)}
        >
          □
        </button>
        <button
          type="button"
          className="w98-btn h-[13px] w-[14px] font-w98 text-[7px] leading-none"
          aria-label={`Close ${win.title}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => closeWindow(win.id)}
        >
          x
        </button>
      </header>

      <div className="w98-field relative mt-[2px] min-h-0 flex-1 overflow-auto p-2">
        {content ? (
          createElement(content, { win })
        ) : hasAppLoader(win.appId) ? (
          // Chunk in flight — the §8 period-appropriate hourglass.
          <p
            className="font-w98 text-[9px] text-w98-ink"
            style={{ cursor: "wait" }}
            aria-live="polite"
          >
            ⌛ Loading, please wait...
          </p>
        ) : (
          // App's slice hasn't shipped — deadpan period placeholder.
          <p className="font-w98 text-[9px] text-w98-ink">
            {win.title}
            <br />
            <br />
            This program is still installing. Insert Disk 2 to continue.
          </p>
        )}
      </div>

      {!win.maximized && (
        <div
          className="w98-grip absolute right-[3px] bottom-[3px] h-[14px] w-[14px]"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => beginDrag(e, "resize")}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
      )}
    </section>
  );
}
