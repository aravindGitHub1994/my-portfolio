"use client";

// Post stack (plan-0009 §2.2): bloom thresholded so only the screen and
// its hotspots glow, plus vignette. ACES tone mapping comes from R3F's
// default renderer toneMapping (ACESFilmic) — no extra pass needed.
//
// bloomRich cannot be a per-frame read the way dust/shafts are: `mipmapBlur`
// selects which passes the composer builds, so it is fixed at construction.
// §7.2's ladder therefore drives it by *remount* — the fidelity version
// subscription re-renders this component, and keying the composer on the
// flag makes the effect chain rebuild rather than quietly keeping the
// expensive one it already has.

import { useSyncExternalStore } from "react";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { effectsState } from "./sheddable";
import { getFidelityVersion, subscribeFidelity } from "../fidelity";

export function Postprocessing() {
  // Server snapshot is the un-shed value: the ladder only ever runs on the
  // client, and this whole tree is behind an ssr:false import anyway.
  useSyncExternalStore(subscribeFidelity, getFidelityVersion, () => 0);
  const rich = effectsState.bloomRich;
  return (
    <EffectComposer key={rich ? "rich" : "lean"}>
      <Bloom
        luminanceThreshold={0.68}
        luminanceSmoothing={0.18}
        intensity={rich ? 0.85 : 0.4}
        mipmapBlur={rich}
      />
      <Vignette eskil={false} offset={0.24} darkness={0.72} />
    </EffectComposer>
  );
}
