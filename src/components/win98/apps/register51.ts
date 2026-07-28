// 5.1 chunk entry (ADR-012 §8): imported dynamically by lazyApps on the
// first open of any Explorer/project window; registers this chunk's
// components so the shell resolves them without ever importing app code
// statically.

import { PROJECTS } from "@/lib/projects";
import { registerApp } from "../shell/appDefs";
import { Explorer } from "./Explorer";
import { ProjectWindow } from "./ProjectWindow";

registerApp("explorer", Explorer);
registerApp("explorer-projects", Explorer);
for (const project of PROJECTS) {
  registerApp(`project-${project.slug}`, ProjectWindow);
}
