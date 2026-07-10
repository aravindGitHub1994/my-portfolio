"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  isKineticClaimed,
  registerKineticTarget,
  subscribeKinetic,
} from "./registry";

type HeadingTag = "h1" | "h2" | "h3" | "p" | "span";

/**
 * A heading that refracts (ADR-006 §3). Renders the REAL semantic element —
 * it's what crawlers/ATS/screen-readers see and what the static prerender
 * ships. On the high tier the GL text layer claims ownership: this element
 * turns transparent (still selectable, still in the a11y tree) and its
 * WebGL twin renders the refract-in / velocity-shear choreography at the
 * exact same layout position. On low/static tiers nothing claims, and this
 * is just a normal heading.
 */
export function KineticText({
  as = "span",
  className,
  children,
}: {
  as?: HeadingTag;
  className?: string;
  children: ReactNode;
}) {
  // The tag is dynamic at runtime; typing it as "span" keeps the JSX ref
  // simple — every produced element is an HTMLElement either way.
  const Tag = as as "span";
  const ref = useRef<HTMLSpanElement>(null);
  const [claimed, setClaimed] = useState(() => isKineticClaimed("text"));
  // Plain-fade entrance for the tiers where no GL twin claims (ADR-006 §3
  // "type fades"): "visible" until JS proves the element starts below the
  // viewport, then "hidden" → "faded". Never hides in the prerender, so
  // no-JS/ATS/crawlers always see the text; reduced-motion never hides.
  const [fade, setFade] = useState<"visible" | "hidden" | "faded">("visible");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Subscribe first: registration + later claims notify through here.
    const unsubscribe = subscribeKinetic(() =>
      setClaimed(isKineticClaimed("text")),
    );
    const unregister = registerKineticTarget(el, "text");
    return () => {
      unregister();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    let primed = false;
    const io = new IntersectionObserver(([entry]) => {
      if (!primed) {
        // First callback reports the state at observe time: only elements
        // that start off-screen ever get hidden (no flash for in-view text).
        primed = true;
        if (!entry.isIntersecting) setFade("hidden");
        return;
      }
      if (entry.isIntersecting) {
        setFade("faded");
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={[
        className ?? "",
        "transition-opacity duration-700 motion-reduce:transition-none",
        fade === "hidden" ? "opacity-0" : "opacity-100",
      ].join(" ")}
      data-kinetic={claimed ? "gl" : undefined}
      style={claimed ? { opacity: 0, transition: "none" } : undefined}
    >
      {children}
    </Tag>
  );
}
