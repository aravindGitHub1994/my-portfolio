"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const LenisContext = createContext<RefObject<Lenis | null> | null>(null);

/**
 * Ref to the live Lenis instance — `.current` is null before mount and under
 * reduced-motion (native scroll). Read it at event time, not render time.
 */
export function useLenisRef() {
  return useContext(LenisContext);
}

/**
 * Wires Lenis smooth scrolling at the layout root and keeps GSAP's
 * ScrollTrigger in sync with it (single ticker — Lenis rafs inside GSAP's
 * ticker so scroll-driven animation and smoothing never fight).
 *
 * Under `prefers-reduced-motion: reduce` Lenis is not created at all and the
 * page falls back to native scrolling.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // ScrollTrigger registers either way; without Lenis it drives off the
    // native window scroller.
    gsap.registerPlugin(ScrollTrigger);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const instance = new Lenis({
      duration: 1.15,
      anchors: true, // in-page #act links scroll smoothly
    });

    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    lenisRef.current = instance;
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <LenisContext value={lenisRef}>{children}</LenisContext>;
}
