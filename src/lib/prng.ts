/**
 * Deterministic PRNG (mulberry32) — seeded sequences keep render/memo work
 * a pure function of the seed (react-hooks/purity; no Math.random in
 * render). Shared by the Lens geometry, the shard window assembly, and the
 * tool-coin inflow.
 */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
