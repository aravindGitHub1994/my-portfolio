"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * Custom cursor: an accent dot with a trailing ring that swells over
 * interactive elements. Activates only on pointer-fine devices without
 * reduced-motion — touch and reduced-motion users keep the native cursor.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !window.matchMedia("(pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const dotEl = dot.current;
    const ringEl = ring.current;
    if (!dotEl || !ringEl) return;

    document.documentElement.classList.add("has-custom-cursor");

    const dotX = gsap.quickTo(dotEl, "x", { duration: 0.12, ease: "power3" });
    const dotY = gsap.quickTo(dotEl, "y", { duration: 0.12, ease: "power3" });
    const ringX = gsap.quickTo(ringEl, "x", { duration: 0.45, ease: "power3" });
    const ringY = gsap.quickTo(ringEl, "y", { duration: 0.45, ease: "power3" });

    const show = () => gsap.to([dotEl, ringEl], { opacity: 1, duration: 0.25 });
    const hide = () => gsap.to([dotEl, ringEl], { opacity: 0, duration: 0.25 });

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
    };

    const onOver = (e: PointerEvent) => {
      const interactive = (e.target as Element | null)?.closest(
        "a, button, [data-cursor]",
      );
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
      gsap.killTweensOf([dotEl, ringEl]);
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
    </div>
  );
}
