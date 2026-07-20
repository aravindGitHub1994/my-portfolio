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
  type Win98Window,
} from "@/lib/win98State";
import { PixelIcon } from "../pixelIcons";
import { ensureAppLoaded, hasAppLoader } from "../apps/lazyApps";
import { resolveApp } from "./appDefs";
import { useShellLayout } from "./layoutContext";

interface DragState {
  pointerId: number;
  mode: "move" | "resize" | "swipe";
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
}

/** Virtual units a maximized window must be swiped down before it closes —
 *  far enough that a sloppy tap on the title bar can't dismiss the app. */
const SWIPE_CLOSE_DIST = 90;

export function Window({
  win,
  focused,
}: {
  win: Win98Window;
  focused: boolean;
}) {
  const drag = useRef<DragState | null>(null);
  const frame = useRef<HTMLElement>(null);
  const { scale, width, height, taskbarH, touch, touchUnit } =
    useShellLayout();

  const beginDrag = (
    e: React.PointerEvent,
    mode: DragState["mode"],
  ) => {
    // A maximized window has nothing to drag — but on touch that same
    // gesture is the close affordance (there is no room for a mouse-sized
    // × in a thumb's world, so the frame itself becomes the control).
    if (win.maximized) {
      if (!touch || mode !== "move") return;
      mode = "swipe";
    }
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
    if (d.mode === "swipe") {
      // Written straight to the node, not through state: a swipe repaints
      // every frame and re-rendering the whole app tree to follow a thumb
      // is how the gesture ends up lagging behind the finger.
      if (frame.current) {
        frame.current.style.transform = `translateY(${Math.max(dy, 0)}px)`;
      }
      return;
    }
    if (d.mode === "move") {
      moveWindow(
        win.id,
        Math.min(Math.max(d.baseX + dx, -win.width + 40), width - 40),
        Math.min(Math.max(d.baseY + dy, 0), height - 40),
      );
    } else {
      resizeWindow(win.id, d.baseX + dx, d.baseY + dy);
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d?.pointerId !== e.pointerId) return;
    if (d.mode === "swipe") {
      const dy = (e.clientY - d.startY) / scale;
      if (frame.current) frame.current.style.transform = "";
      if (dy > SWIPE_CLOSE_DIST) closeWindow(win.id);
    }
    drag.current = null;
  };

  // Registry LOOKUP, not creation — apps register stable components on
  // their chunk load; createElement keeps the react-compiler rule happy.
  const content = resolveApp(win.appId);

  // Lazy apps (ADR-012 §8) load on first open; touchWin98() re-renders
  // this window when the chunk registers.
  useEffect(() => {
    if (!content) ensureAppLoaded(win.appId);
  }, [content, win.appId]);

  // Touch chrome: one WCAG target per control, and type scaled with it —
  // 8px era type inside a 44px button reads as a mistake, not a period
  // detail. Desktop keeps the pixel-exact 3.2 values untouched.
  const barH = touch ? touchUnit : 18;
  const btn = touch
    ? { height: touchUnit - 8, width: touchUnit - 8, fontSize: 13 }
    : { height: 13, width: 14, fontSize: 7 };

  return (
    <section
      ref={frame}
      className="w98-raised absolute flex flex-col p-[3px]"
      style={
        win.maximized
          ? { left: 0, top: 0, width, height: height - taskbarH }
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
        className={`${focused ? "w98-titlebar" : "w98-titlebar-inactive"} flex shrink-0 items-center gap-1 px-0.5`}
        style={{ touchAction: "none", height: barH }}
        onPointerDown={(e) => beginDrag(e, "move")}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => toggleMaximizeWindow(win.id)}
      >
        <PixelIcon glyph={win.glyph} size={touch ? 18 : 13} />
        <span
          className="flex-1 truncate font-w98 leading-none"
          style={{ fontSize: touch ? 12 : 8 }}
        >
          {win.title}
        </span>
        {/* Minimize stays on touch — it is the way back to the desktop.
            Maximize does not: solo windows are maximized by definition and
            toggleMaximizeWindow no-ops, so it would be a dead control. */}
        <button
          type="button"
          className="w98-btn font-w98 leading-none"
          style={btn}
          aria-label={`Minimize ${win.title}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => minimizeWindow(win.id)}
        >
          _
        </button>
        {!touch && (
          <button
            type="button"
            className="w98-btn font-w98 leading-none"
            style={btn}
            aria-label={`Maximize ${win.title}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => toggleMaximizeWindow(win.id)}
          >
            □
          </button>
        )}
        <button
          type="button"
          className="w98-btn font-w98 leading-none"
          style={btn}
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
