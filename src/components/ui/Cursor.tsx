"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * Custom cursor: an accent dot with a trailing ring that swells over
 * interactive elements, plus a small label that surfaces a target's
 * `data-cursor-label` (ADR-009 §4 — "Reveal" over project previews).
 * Activates only on pointer-fine devices without reduced-motion — touch and
 * reduced-motion users keep the native cursor.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !window.matchMedia("(pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const dotEl = dot.current;
    const ringEl = ring.current;
    const labelEl = label.current;
    if (!dotEl || !ringEl || !labelEl) return;

    document.documentElement.classList.add("has-custom-cursor");

    const dotX = gsap.quickTo(dotEl, "x", { duration: 0.12, ease: "power3" });
    const dotY = gsap.quickTo(dotEl, "y", { duration: 0.12, ease: "power3" });
    const ringX = gsap.quickTo(ringEl, "x", { duration: 0.45, ease: "power3" });
    const ringY = gsap.quickTo(ringEl, "y", { duration: 0.45, ease: "power3" });
    // The label rides with the ring — same lag, so it reads as one object.
    const labelX = gsap.quickTo(labelEl, "x", {
      duration: 0.45,
      ease: "power3",
    });
    const labelY = gsap.quickTo(labelEl, "y", {
      duration: 0.45,
      ease: "power3",
    });

    const show = () => gsap.to([dotEl, ringEl], { opacity: 1, duration: 0.25 });
    // The label's opacity is owned by onOver; hide() clears it too so it
    // never lingers after the pointer leaves the window.
    const hide = () =>
      gsap.to([dotEl, ringEl, labelEl], { opacity: 0, duration: 0.25 });

    let shown = false;
    const onMove = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        show();
      }
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
      labelX(e.clientX);
      labelY(e.clientY);
    };

    const onOver = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const interactive = target?.closest("a, button, [data-cursor]");
      const labelText = target
        ?.closest("[data-cursor-label]")
        ?.getAttribute("data-cursor-label");
      // Only rewrite the text when there is one — the old text keeps its
      // shape while fading out instead of collapsing mid-fade.
      if (labelText) labelEl.textContent = labelText;
      gsap.to(labelEl, { opacity: labelText ? 1 : 0, duration: 0.3 });
      gsap.to(ringEl, {
        scale: interactive ? 1.7 : 1,
        borderColor: interactive
          ? "rgba(61, 116, 255, 0.9)"
          : "rgba(61, 116, 255, 0.45)",
        duration: 0.3,
      });
    };

    const onLeave = () => {
      shown = false;
      hide();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf([dotEl, ringEl, labelEl]);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90]">
      <div
        ref={ring}
        className="absolute -top-[18px] -left-[18px] h-9 w-9 rounded-full border opacity-0"
        style={{ borderColor: "rgba(61, 116, 255, 0.45)" }}
      />
      <div
        ref={dot}
        className="absolute -top-1 -left-1 h-2 w-2 rounded-full bg-accent opacity-0"
      />
      {/* Sits below-right of the pointer, clear of the swelled ring. */}
      <div
        ref={label}
        className="absolute top-6 left-7 font-mono text-[10px] tracking-[0.18em] whitespace-nowrap text-accent-bright uppercase opacity-0"
      />
    </div>
  );
}
