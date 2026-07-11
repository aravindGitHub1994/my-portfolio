// ============================================================================
// ⚠️  THROWAWAY CALIBRATION SCAFFOLDING — MUST NOT SHIP.  ⚠️
//
// This file exists for exactly one owner calibration sweep (plan-0008
// slice 2.2). Slice 2.3 bakes the chosen values into TheLens.tsx as
// literals and DELETES this file and every import of it. If you are
// reading this on main, the deletion was missed — do it now (ADR-011 §3).
// ============================================================================
//
// Mirrors detectTier()'s ?tier= override in gpuTier.ts: same URLSearchParams
// read, same client-only guard. Four knobs, one URL param each:
//
//   ?env=    backsideEnvMapIntensity on MeshTransmissionMaterial (high)
//   ?spec=   specularIntensity on MeshTransmissionMaterial (high)
//   ?light=  kernel pointLight intensity (all animated tiers)
//   ?faux=   envMapIntensity on FauxGlassMaterial (low/static)
//
// e.g. localhost:3004/?env=0.03&spec=0.4&light=1.6

export type LensTuning = {
  /** Backside-bake env strength — the ADR-011 §2 fix (`?env=`). */
  backsideEnv: number;
  /** Specular highlight strength, now brand-blue (`?spec=`). */
  specular: number;
  /** Kernel pointLight intensity — internal luminance (`?light=`). */
  kernelLight: number;
  /** FauxGlassMaterial envMapIntensity, low/static tiers (`?faux=`). */
  fauxEnv: number;
};

/** Starting points for the sweep, not final values (plan-0008 §2.1). */
export const LENS_TUNING_DEFAULTS: LensTuning = {
  backsideEnv: 0.03,
  specular: 0.4,
  kernelLight: 1.6,
  fauxEnv: 0.45,
};

/** Client-only — call from an effect or a client-only (ssr:false) component. */
export function readLensTuning(): LensTuning {
  if (typeof window === "undefined") return LENS_TUNING_DEFAULTS;

  const params = new URLSearchParams(window.location.search);
  const read = (key: string, fallback: number) => {
    const raw = params.get(key);
    if (raw === null) return fallback;
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  };

  return {
    backsideEnv: read("env", LENS_TUNING_DEFAULTS.backsideEnv),
    specular: read("spec", LENS_TUNING_DEFAULTS.specular),
    kernelLight: read("light", LENS_TUNING_DEFAULTS.kernelLight),
    fauxEnv: read("faux", LENS_TUNING_DEFAULTS.fauxEnv),
  };
}
