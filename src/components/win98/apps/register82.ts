// 8.2 chunk entry (ADR-012 §8): dynamic-imported by lazyApps on first open
// of Minesweeper. Kept separate from 8.1's chunk because the two eggs are
// independently cuttable slices — a visitor who only opens the Recycle Bin
// should not pay for the game, or the reverse.

import { registerApp } from "../shell/appDefs";
import { Minesweeper } from "./Minesweeper";

registerApp("minesweeper", Minesweeper);
