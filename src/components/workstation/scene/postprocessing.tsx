"use client";

// Post stack (plan-0009 §2.2): bloom thresholded so only the screen and
// its hotspots glow, plus vignette. ACES tone mapping comes from R3F's
// default renderer toneMapping (ACESFilmic) — no extra pass needed.
// bloomRich is a mount-time read: 7.2 remounts this component when it
// sheds that tier (see scene/sheddable.ts).

import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { effectsState } from "./sheddable";

export function Postprocessing() {
  const rich = effectsState.bloomRich;
  return (
    <EffectComposer>
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
