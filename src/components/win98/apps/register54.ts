// 6.4 chunk entry (ADR-012 §8): dynamic-imported by lazyApps on the first
// open of the Gallery. Its own chunk rather than a lodger in 5.1's or 8.2's,
// because it is the one app that drags 23 caption strings and a photo grid in
// with it — a visitor who never opens My Pictures should not pay for them.

import { registerApp } from "../shell/appDefs";
import { Gallery } from "./Gallery";

registerApp("gallery", Gallery);
