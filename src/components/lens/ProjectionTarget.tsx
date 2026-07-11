"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { registerProjectionTarget } from "./projectionTargets";

/**
 * Registers its wrapper div as a beam projection target (ADR-008 §2/§3) —
 * used from server-rendered markup (page.tsx's contact CTA row) where a ref
 * effect can't live inline. Pure DOM passthrough otherwise.
 */
export function ProjectionTarget({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return registerProjectionTarget(index, el);
  }, [index]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
