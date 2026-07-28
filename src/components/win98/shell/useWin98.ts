"use client";

// React bridge to the win98State singleton (plan-0009 §3.2). The store
// stays mutable (both renderers share it); React subscribes via the
// version counter — any mutation re-renders subscribed shell components,
// which then read the singleton directly. Frame loops never come here.

import { useSyncExternalStore } from "react";
import { subscribeWin98, win98State } from "@/lib/win98State";

export function useWin98Version(): number {
  return useSyncExternalStore(
    subscribeWin98,
    () => win98State.version,
    () => 0,
  );
}
