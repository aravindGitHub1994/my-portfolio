"use client";

import { useEffect, useRef, useState } from "react";
import {
  isKineticClaimed,
  registerKineticTarget,
  subscribeKinetic,
} from "./registry";

/**
 * An image that lives on the WebGL layer when the tier affords it
 * (ADR-006 §5): the DOM <img> stays for layout/a11y/prerender, and its GL
 * twin distorts subtly with the refractive field, snapping crisp when its
 * project is centered. On low/static tiers this is just a crisp <img>
 * (ADR-006 §8 — graceful reduction).
 *
 * Only ever point this at recreated dummy-data assets under /screens/
 * (ADR-006 §7/§7a) — never a raw client capture.
 */
export function GlassImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [claimed, setClaimed] = useState(() => isKineticClaimed("image"));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Subscribe first: registration + later claims notify through here.
    const unsubscribe = subscribeKinetic(() =>
      setClaimed(isKineticClaimed("image")),
    );
    const unregister = registerKineticTarget(el, "image");
    return () => {
      unregister();
      unsubscribe();
    };
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export (ADR-001): next/image needs a server
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={className}
      style={claimed ? { opacity: 0 } : undefined}
      loading="lazy"
      decoding="async"
    />
  );
}
