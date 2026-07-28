// 8.1 chunk entry (ADR-012 §8): dynamic-imported by lazyApps on first open
// of the Recycle Bin. The BSOD itself is NOT in this chunk — it is a shell
// phase screen (Desktop renders it directly), and a crash screen that had
// to wait for a network fetch would be a poor joke on a slow connection.

import { registerApp } from "../shell/appDefs";
import { RecycleBin } from "./RecycleBin";

registerApp("recycle-bin", RecycleBin);
