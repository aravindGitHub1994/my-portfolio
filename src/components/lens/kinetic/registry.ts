// Registry bridging DOM elements to their WebGL twins (ADR-006 §2).
// DOM components (KineticText, GlassImage) register their element; the GL
// layers inside the Canvas subscribe, build textures/planes, and **claim**
// their kind. While a kind is claimed the DOM element hides (opacity: 0 —
// it stays in the accessibility tree, selectable, and in the prerendered
// HTML) and the GL twin renders in its place. If no layer ever claims
// (low/static tier, WebGL unavailable), the DOM stays visible — graceful
// reduction with zero drift risk, because the DOM node IS the source.

export type KineticKind = "text" | "image";

export interface KineticTarget {
  id: number;
  el: HTMLElement;
  kind: KineticKind;
}

let nextId = 1;
const targets = new Map<number, KineticTarget>();
const listeners = new Set<() => void>();
const claims: Record<KineticKind, number> = { text: 0, image: 0 };

function notify() {
  listeners.forEach((cb) => cb());
}

/** DOM side: register an element for GL twinning. Returns unregister. */
export function registerKineticTarget(
  el: HTMLElement,
  kind: KineticKind,
): () => void {
  const id = nextId;
  nextId += 1;
  targets.set(id, { id, el, kind });
  notify();
  return () => {
    targets.delete(id);
    notify();
  };
}

export function getKineticTargets(kind: KineticKind): KineticTarget[] {
  return [...targets.values()].filter((t) => t.kind === kind);
}

export function subscribeKinetic(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** GL side: claim ownership of a kind's visuals. Returns release. */
export function claimKineticLayer(kind: KineticKind): () => void {
  claims[kind] += 1;
  notify();
  return () => {
    claims[kind] -= 1;
    notify();
  };
}

export function isKineticClaimed(kind: KineticKind): boolean {
  return claims[kind] > 0;
}
