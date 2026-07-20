"use client";

// Shell layout context (plan-0009 §7.1). Desktop resolves the layout once
// and publishes it here so chrome AND lazily-registered app content (5.x
// chunks) can adapt without prop-drilling through the registry — apps get
// a component and a `win`, never the shell's internals.
//
// Context, not the win98State singleton: this is a *view* fact (how big is
// the surface we're drawn on), and win98State stays DOM-free by contract.

import { createContext, useContext } from "react";
import { desktopLayout, type ShellLayout } from "@/lib/shellLayout";

const ShellLayoutContext = createContext<ShellLayout>(desktopLayout());

export const ShellLayoutProvider = ShellLayoutContext.Provider;

/** Default is the desktop shell — the painter-parity harness needs no
 *  provider to render correctly. */
export function useShellLayout(): ShellLayout {
  return useContext(ShellLayoutContext);
}
