// Fidelity tier detection (ADR-005 §3). The cube's choreography is identical
// on every tier — only shader cost changes:
//   high   — full MeshTransmissionMaterial refraction (desktop, capable GPU)
//   low    — faux-glass (no per-frame transmission buffer, capped DPR)
//   static — no motion, render-on-demand (prefers-reduced-motion)
//   none   — WebGL unavailable; no canvas at all
//
// Deliberately heuristic and dependency-free: detect-gpu et al. fetch
// benchmark data from a CDN at runtime, which the CSP (connect-src 'self')
// forbids. Calibration knob: append ?tier=high|low|static to the URL.

export type FidelityTier = "high" | "low" | "static" | "none";

function classifyRenderer(renderer: string): "mobile" | "weak" | "capable" {
  if (/mali|adreno|powervr|videocore|apple gpu/i.test(renderer)) {
    return "mobile";
  }
  if (/swiftshader|llvmpipe|software/i.test(renderer)) {
    return "weak";
  }
  // Integrated Intel below Iris/Xe/Arc struggles with per-frame transmission.
  if (/intel/i.test(renderer) && !/iris|arc|xe/i.test(renderer)) {
    return "weak";
  }
  return "capable";
}

/** Client-only — call from an effect or a client-only (ssr:false) component. */
export function detectTier(): FidelityTier {
  if (typeof window === "undefined") return "none";

  const override = new URLSearchParams(window.location.search).get("tier");
  if (override === "high" || override === "low" || override === "static") {
    return override;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "static";
  }

  const probe = document.createElement("canvas");
  const gl =
    probe.getContext("webgl2") ??
    (probe.getContext("webgl") as WebGLRenderingContext | null);
  if (!gl) return "none";

  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = String(
    gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
  );
  gl.getExtension("WEBGL_lose_context")?.loseContext();

  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;
  const lowMemory = deviceMemory !== undefined && deviceMemory < 4;

  if (coarsePointer || lowMemory || classifyRenderer(renderer) !== "capable") {
    return "low";
  }
  return "high";
}
