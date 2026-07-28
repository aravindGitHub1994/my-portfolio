// 5.3 chunk entry (ADR-012 §8): dynamic-imported by lazyApps on first
// open of Outlook Express / the dial-up shortcuts.

import { registerApp } from "../shell/appDefs";
import { Outlook } from "./Outlook";
import { DialUp } from "./DialUp";

registerApp("outlook", Outlook);
registerApp("dialup-linkedin", DialUp);
registerApp("dialup-github", DialUp);
