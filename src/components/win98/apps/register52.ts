// 5.2 chunk entry (ADR-012 §8): dynamic-imported by lazyApps on first
// open of WordPad / Notepad / Add-Remove Programs.

import { registerApp } from "../shell/appDefs";
import { WordPad } from "./WordPad";
import { Notepad } from "./Notepad";
import { AddRemovePrograms } from "./AddRemovePrograms";

registerApp("wordpad", WordPad);
registerApp("notepad", Notepad);
registerApp("add-remove", AddRemovePrograms);
