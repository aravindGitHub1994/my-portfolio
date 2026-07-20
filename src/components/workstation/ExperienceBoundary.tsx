"use client";

// Experience failure boundary (plan-0009 §7.1, the in-app-browser smoke
// path). Embedded webviews — LinkedIn's, Instagram's, Slack's — pass
// `detectTier`'s probe and then fail for reasons the probe cannot see:
// a per-webview live-context cap, a GPU process killed under memory
// pressure, a context lost on the first backgrounding.
//
// That failure mode is worse than having no WebGL at all. `none` never
// sets html[data-experience], so the visitor keeps the prerendered 2D
// floor. A context lost *after* mount has already taken the floor out of
// the flow — so the page goes blank, which is the one outcome §7.1
// forbids. This boundary is what turns that back into the floor.
//
// Two distinct signals, because neither covers the other: React error
// boundaries see render/lifecycle throws but never context loss (it is a
// DOM event, not an exception), and the `webglcontextlost` listener sees
// the reverse.

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  onFail: () => void;
}

export class ExperienceBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Not swallowed: a real bug in the scene should still be findable in
    // the console of the device that hit it.
    console.error("[experience] falling back to the static floor", error);
    this.props.onFail();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
