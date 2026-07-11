"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  isKineticClaimed,
  registerKineticTarget,
  subscribeKinetic,
} from "./registry";

type HeadingTag = "h1" | "h2" | "h3" | "p" | "span";

/**
 * Text that refracts (ADR-006 §3, ADR-010 §1). Renders the REAL semantic
 * element — it's what crawlers/ATS/screen-readers see and what the static
 * prerender ships. On the high tier the GL text layer claims ownership: this
 * element turns transparent (still selectable, still in the a11y tree) and
 * its WebGL twin renders at the exact same layout position. On low/static
 * tiers nothing claims, and this is just a normal element.
 *
 * `variant="refract"` (default) plays the shard refract-in on entry —
 * headings, mono labels, counters. `variant="plain"` (ADR-010 §1) is the
 * distortion-only twin for display body copy: crisp on first paint, no
 * entrance choreography (GL or DOM fade), aberrating only near the pointer
 * and with scroll velocity.
 */
export function KineticText({
  as = "span",
  variant = "refract",
  className,
  children,
}: {
  as?: HeadingTag;
  variant?: "refract" | "plain";
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
    const unregister = registerKineticTarget(el, "text", variant);
    return () => {
      unregister();
      unsubscribe();
    };
  }, [variant]);

  useEffect(() => {
    // Plain twins are crisp on entry everywhere — no DOM fade either.
    if (variant === "plain") return;
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
  }, [variant]);

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
