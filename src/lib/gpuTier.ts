// Fidelity tier selection (ADR-012 §8, carrying ADR-009 §3's high-by-default
// principle forward from the retired Lens). The old device-class heuristic
// (mobile GPU, coarse pointer, low deviceMemory, integrated Intel) guessed
// wrong on real hardware, including the owner's. Only *correctness* gates
// stay pre-emptive; *performance* is handled at runtime by an FPS watchdog
// (slice 7.2 rewires it for the Workstation) that asks before downgrading:
//   high   — full effect stack (the default)
//   low    — reduced garnish, capped DPR; also the pre-emptive floor for
//            software rasterizers (SwiftShader/llvmpipe), which render
//            correctly but never fast
//   static — no motion: the 2D floor (prefers-reduced-motion)
//   none   — WebGL unavailable; no canvas at all (floor again)
//
// Deliberately dependency-free: detect-gpu et al. fetch benchmark data from a
// CDN at runtime, which the CSP (connect-src 'self') forbids. Calibration
// knob: append ?tier=high|low|static to the URL — an explicit override also
// marks the choice non-auto, which disables the watchdog.

export type FidelityTier = "high" | "low" | "static" | "none";

export type TierDetection = {
  tier: FidelityTier;
  /** False when ?tier= forced the choice — the FPS watchdog runs only on
   *  auto-selected tiers. */
  auto: boolean;
};

/** Client-only — call from an effect or a client-only (ssr:false) component. */
export function detectTier(): TierDetection {
  if (typeof window === "undefined") return { tier: "none", auto: true };

  const override = new URLSearchParams(window.location.search).get("tier");
  if (override === "high" || override === "low" || override === "static") {
    return { tier: override, auto: false };
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return { tier: "static", auto: true };
  }

  const probe = document.createElement("canvas");
  const gl =
    probe.getContext("webgl2") ??
    (probe.getContext("webgl") as WebGLRenderingContext | null);
  if (!gl) return { tier: "none", auto: true };

  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = String(
    gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
  );
  gl.getExtension("WEBGL_lose_context")?.loseContext();

  // The one pre-emptive performance floor: a software rasterizer will draw
  // the high tier correctly but never fast — don't make the watchdog spend
  // two janky seconds discovering that.
  if (/swiftshader|llvmpipe|software/i.test(renderer)) {
    return { tier: "low", auto: true };
  }

  return { tier: "high", auto: true };
}
