// Build the Gallery's shipped photographs (plan-0010 §6.1, ADR-013 §9).
//
//   npm run pictures            # write public/pictures/
//   npm run pictures -- --dry   # report only, touch nothing
//
// The originals in `assets-src/` run 36 KB – 3.3 MB and total ~27 MB, which is
// not shippable, and this repo has no image pipeline. So this one-off script
// emits a bounded-width JPEG plus a thumbnail per photograph into
// `public/pictures/`. **Both the script and its output are committed**, so
// `npm run build` stays a plain static export with no new build step, and
// `assets-src/` stays untracked and unshipped.
//
// `sharp` is a devDependency and is imported only here — it never enters the
// runtime bundle.
//
// ---------------------------------------------------------------------------
// Four properties that are load-bearing, not incidental
// ---------------------------------------------------------------------------
//
// 1. **The allow-list is explicit and is never a directory glob.** That is the
//    *mechanism* behind ADR-013 §9's hard boundary: `assets-src/workstation/`
//    holds `tattoo01–04.jpg` (ADR-012 §3 source material for the painted
//    forearm) and three AI concept sheets, and plan-0009's acceptance criterion
//    is literally "no image file under `public/` contains tattoo photography".
//    A glob would ship them the day someone drops a file in the wrong folder.
//    `assertAllowed` below is the belt to that braces: it refuses to run at all
//    if any entry's path looks like source material, so the list cannot quietly
//    drift into one.
//
// 2. **Metadata is stripped.** sharp drops EXIF unless you ask for it, and this
//    script deliberately never calls `withMetadata()`. These are ride and hike
//    photographs; their EXIF carries **GPS coordinates**, camera serials and
//    timestamps, and publishing those would say where the owner was and when.
//    The report at the end asserts the outputs came out clean rather than
//    trusting the default.
//
// 3. **`.rotate()` runs before the resize, and it has to.** Stripping EXIF also
//    strips the orientation flag that a phone camera relies on, so a portrait
//    photograph would ship on its side. Calling `.rotate()` with no argument
//    bakes the EXIF orientation into the pixels first; dropping the tag
//    afterwards is then free.
//
// 4. **Encoding is deterministic, which is what makes re-running idempotent.**
//    Same input plus same options plus same libvips gives byte-identical
//    output, so a second run leaves `git status` clean. The script re-encodes
//    every time rather than checking timestamps — 29 photographs cost a few
//    seconds, and a cache is a thing that can be wrong.

import { mkdir, readdir, stat, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "pictures");

/** The viewer copy. Bounded box, never cropped — a photograph the visitor
 *  clicked to see should be the shape it was taken in. The Gallery lives in the
 *  docked shell's 640×480 virtual space, so it is displayed at roughly
 *  500 virtual units; at a 2× shell scale on a 1440-wide viewport that is
 *  ~1000 client px, and 1200 covers it with room for a denser display.
 *
 *  **The quality was picked by measuring, not by taste.** The dimensions above
 *  are what the Gallery needs; that left the whole directory at 3.27 MB at
 *  q74, i.e. under ADR-013 §9's own 4–5 MB band. Since the budget is
 *  sanctioned and the photographs are the entire point of the app, the spare
 *  megabyte was spent on them: q80 → 3.82 MB, q84 → 4.31 MB, q88 → 5.03 MB
 *  (over). Hence 84. Re-measure if the set ever changes size. */
const VIEWER = { width: 1200, height: 900, quality: 84 };

/** Grid thumbnails. Cropped to a uniform 4:3 on purpose: a period item grid
 *  wants even cells, and ragged thumbnails read as a broken layout rather than
 *  as variety. */
const THUMB = { width: 192, height: 144, quality: 78 };

/** ADR-013 §9's budget for the whole directory. Reported, and a miss is loud. */
const BUDGET = { minMb: 4, maxMb: 5 };

// ---------------------------------------------------------------------------
// The allow-list — 29 photographs. ADR-013 §9: 8 cats, 17 rides and hikes,
// workspace, guitar, and the two existing portraits.
// ---------------------------------------------------------------------------
//
// `id` is authored, not derived from the filename, so renaming a source file
// cannot change a shipped URL. Two deviations from the source names, both
// deliberate and both flagged for the owner at gate 6.2:
//
//   - `ride-06-tamila nadu.jpg` carries a typo and a space. The id is
//     `ride-06-tamil-nadu`; a space in a URL and a misspelt state are not
//     things anyone would choose on purpose.
//   - **The ride numbers have a gap** — there is no `ride-08` in `assets-src/`,
//     so the ids run 01–07 and 09–13. Numbering is left alone rather than
//     closed up, because the ids trace back to the source files and closing the
//     gap would make every id after it point at the wrong photograph.
//
// There are also two `hike-04` sources (`goa` and `himachal`). The full slug
// keeps them distinct, so nothing collides; the duplicate number is the owner's
// to rename at 6.2 if it bothers them.
//
// **GATE 6.2 (owner, 2026-07-30) CUT THE SET FROM 29 TO 23.** Six entries were
// pulled — `cat-04-nimbus`, `ride-04-maharashtra`, `ride-05-hogenakkal`,
// `ride-06-tamil-nadu`, `ride-10-west-coast`, `ride-13-kashmir` — and the
// `hike-04` collision was resolved by renumbering **goa to `hike-05-goa`**.
// The gate also corrected one place name: **`ride-07-pondicherry` → `ride-07-goa`**,
// because the owner identified the photograph as a Goa run. So "goa" now appears
// in two ids, one `hike` and one `ride`. Nothing collides — different prefixes,
// and the grid is grouped, not sorted by raw id.
// Two consequences worth knowing before anyone "restores" anything:
//
//   - **This supersedes ADR-013's "all 29 photographs ship."** That decision is
//     recorded as settled in the ADR and in HANDOFF; the gate that was created
//     to review it overruled it. Do not put the six back on the ADR's authority.
//   - **The typo entry left with `ride-06`.** `ride-06-tamila nadu.jpg` was the
//     one source whose filename needed fixing in the id, and it is no longer in
//     the list — so is the "Shot on OnePlus / By Chisty" watermark that was
//     burned into it. Nothing ships with a watermark now.
//
// The sources are untouched under `assets-src/`, so any pull is reversible by
// putting its line back and re-running.
const PHOTOS = [
  // --- the cats (7; `cat-04-nimbus` pulled at 6.2) ---
  { id: "cat-01-nimbus", group: "cats", src: "assets-src/personal/cat-01-nimbus.jpg" },
  { id: "cat-02-nimbus", group: "cats", src: "assets-src/personal/cat-02-nimbus.jpg" },
  { id: "cat-03-nimbus", group: "cats", src: "assets-src/personal/cat-03-nimbus.jpg" },
  { id: "cat-05-nimbus", group: "cats", src: "assets-src/personal/cat-05-nimbus.jpg" },
  { id: "cat-06-ivy", group: "cats", src: "assets-src/personal/cat-06-ivy.jpg" },
  { id: "cat-07-both", group: "cats", src: "assets-src/personal/cat-07-both.jpg" },
  { id: "cat-08-ivy", group: "cats", src: "assets-src/personal/cat-08-ivy.jpg" },

  // --- rides and hikes (12; 04, 05, 06, 10 and 13 pulled at 6.2). The ride
  //     numbering now has four more gaps on top of the missing 08 — all of them
  //     deliberate, all of them for the same reason: an id traces back to its
  //     source file, so closing a gap would point every later number at a
  //     different photograph. ---
  { id: "hike-01-kalga", group: "journey", src: "assets-src/journey/photos/hike-01-Kalga.jpg" },
  { id: "hike-02-kheerganga", group: "journey", src: "assets-src/journey/photos/hike-02-kheerganga.jpg" },
  { id: "hike-03-kashmir", group: "journey", src: "assets-src/journey/photos/hike-03-kashmir.jpg" },
  { id: "hike-04-himachal", group: "journey", src: "assets-src/journey/photos/hike-04-himachal.jpg" },
  // 6.2 renumbered this one; the SOURCE filename still says 04, which is fine —
  // ids are authored here, never derived from filenames.
  { id: "hike-05-goa", group: "journey", src: "assets-src/journey/photos/hike-04-goa.jpg" },
  { id: "ride-01-kerala", group: "journey", src: "assets-src/journey/photos/ride-01-kerala.jpg" },
  { id: "ride-02-coorg", group: "journey", src: "assets-src/journey/photos/ride-02-coorg.jpg" },
  { id: "ride-03-ladakh", group: "journey", src: "assets-src/journey/photos/ride-03-ladakh.png" },
  // 6.2: the owner identified this as a Goa run, so the source filename's
  // "pondicherry" is simply wrong. The id is authored, so it can be right.
  { id: "ride-07-goa", group: "journey", src: "assets-src/journey/photos/ride-07-pondicherry.jpg" },
  { id: "ride-09-tso-moriri", group: "journey", src: "assets-src/journey/photos/ride-09-tso-moriri.png" },
  { id: "ride-11-rann-of-kutch", group: "journey", src: "assets-src/journey/photos/ride-11-rannOfKutchh.png" },
  { id: "ride-12-hawa-mahal", group: "journey", src: "assets-src/journey/photos/ride-12-hawaMahalJaipur.png" },

  // --- the desk and the guitar (2) ---
  { id: "workspace-01", group: "desk", src: "assets-src/personal/workspace-01.png" },
  { id: "guitar-01", group: "desk", src: "assets-src/personal/guitar-01.png" },

  // --- the two existing portraits (2). Already in `public/`, and left there:
  //     they are the site's own portraits. The Gallery gets its own bounded
  //     copies so every picture in the grid has a thumbnail. ---
  { id: "portrait-01", group: "portrait", src: "public/aravind.jpg" },
  { id: "portrait-02", group: "portrait", src: "public/aravind-2.jpg" },
];

/** Anything matching these must never reach `public/`. ADR-012 §3/§10 and
 *  ADR-013 §9: tattoo reference photography, the AI concept sheets, the QA
 *  screenshots taken during the character gates, and any client material.
 *  Checked against every allow-list entry before a single file is written, so
 *  the failure is "this script refuses to run" rather than "something shipped". */
const FORBIDDEN = [
  /tattoo/i,
  /chatgpt/i,
  /^assets-src[/\\]workstation[/\\]/i,
  /QA-/,
  /docs[/\\]projects/i,
  /public[/\\]screens/i,
  /client/i,
];

function assertAllowed(photos) {
  const bad = [];
  for (const p of photos) {
    const posix = p.src.split(path.sep).join("/");
    for (const rule of FORBIDDEN) {
      if (rule.test(posix)) bad.push(`${p.id} → ${p.src} (matched ${rule})`);
    }
  }
  if (bad.length) {
    throw new Error(
      "The allow-list contains source material that must never ship:\n  " +
        bad.join("\n  "),
    );
  }
  const ids = new Set();
  for (const p of photos) {
    if (ids.has(p.id)) throw new Error(`Duplicate id: ${p.id}`);
    ids.add(p.id);
  }
}

const kb = (bytes) => (bytes / 1024).toFixed(0);
const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);

async function main() {
  const dry = process.argv.includes("--dry");
  assertAllowed(PHOTOS);

  // Sources live in untracked `assets-src/`, so a fresh clone genuinely cannot
  // run this — which is fine, because the output is committed. Fail with the
  // whole list rather than one file at a time.
  const missing = PHOTOS.filter((p) => !existsSync(path.join(ROOT, p.src)));
  if (missing.length) {
    throw new Error(
      `${missing.length} source file(s) missing (assets-src/ is untracked by ` +
        `design — ADR-013 §9):\n  ` +
        missing.map((p) => p.src).join("\n  "),
    );
  }

  if (!dry) await mkdir(OUT_DIR, { recursive: true });

  const rows = [];
  let srcTotal = 0;
  let outTotal = 0;
  let exifLeaks = 0;

  for (const photo of PHOTOS) {
    const srcPath = path.join(ROOT, photo.src);
    srcTotal += (await stat(srcPath)).size;

    // One decode per photograph, two encodes off it.
    const input = sharp(srcPath, { failOn: "error" }).rotate();
    const meta = await input.metadata();

    const viewerBuf = await input
      .clone()
      .resize({
        width: VIEWER.width,
        height: VIEWER.height,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: VIEWER.quality, mozjpeg: true, progressive: true })
      .toBuffer();

    const thumbBuf = await input
      .clone()
      .resize({
        width: THUMB.width,
        height: THUMB.height,
        fit: "cover",
        position: "centre",
      })
      .jpeg({ quality: THUMB.quality, mozjpeg: true })
      .toBuffer();

    const viewerMeta = await sharp(viewerBuf).metadata();
    if (viewerMeta.exif || viewerMeta.xmp || viewerMeta.icc) exifLeaks++;

    if (!dry) {
      await writeFile(path.join(OUT_DIR, `${photo.id}.jpg`), viewerBuf);
      await writeFile(path.join(OUT_DIR, `${photo.id}-thumb.jpg`), thumbBuf);
    }

    outTotal += viewerBuf.length + thumbBuf.length;
    rows.push({
      id: photo.id,
      group: photo.group,
      srcW: meta.width,
      srcH: meta.height,
      hadExif: !!meta.exif,
      w: viewerMeta.width,
      h: viewerMeta.height,
      viewerBytes: viewerBuf.length,
      thumbBytes: thumbBuf.length,
    });
  }

  // Anything in the output directory that this run did not write is stale —
  // a renamed id would otherwise leave its old files shipping forever.
  const expected = new Set(PHOTOS.flatMap((p) => [`${p.id}.jpg`, `${p.id}-thumb.jpg`]));
  const stale = existsSync(OUT_DIR)
    ? (await readdir(OUT_DIR)).filter((f) => !expected.has(f))
    : [];
  for (const f of stale) {
    if (!dry) await unlink(path.join(OUT_DIR, f));
  }

  // --- report ---
  console.log(`\n${dry ? "[dry run] " : ""}public/pictures/ — ${PHOTOS.length} photographs\n`);
  console.log("  id                       group     source      shipped        viewer   thumb");
  for (const r of rows) {
    console.log(
      `  ${r.id.padEnd(24)} ${r.group.padEnd(9)} ${String(r.srcW + "×" + r.srcH).padEnd(11)} ` +
        `${String(r.w + "×" + r.h).padEnd(14)} ${(kb(r.viewerBytes) + " KB").padStart(8)} ` +
        `${(kb(r.thumbBytes) + " KB").padStart(7)}`,
    );
  }

  const viewerBytes = rows.reduce((s, r) => s + r.viewerBytes, 0);
  const thumbBytes = rows.reduce((s, r) => s + r.thumbBytes, 0);
  console.log(`\n  sources   ${mb(srcTotal)} MB`);
  console.log(`  viewers   ${mb(viewerBytes)} MB   (${rows.length} files)`);
  console.log(`  thumbs    ${mb(thumbBytes)} MB   (${rows.length} files)`);
  console.log(`  SHIPPED   ${mb(outTotal)} MB   — budget ${BUDGET.minMb}–${BUDGET.maxMb} MB (ADR-013 §9)`);
  const outMb = outTotal / 1024 / 1024;
  if (outMb > BUDGET.maxMb) console.log(`  ⚠ over budget by ${mb(outTotal - BUDGET.maxMb * 1024 * 1024)} MB`);
  if (outMb < BUDGET.minMb) console.log(`  note: under the stated band — headroom, not a fault`);

  const withExif = rows.filter((r) => r.hadExif).length;
  console.log(`\n  ${withExif}/${rows.length} sources carried EXIF; ${exifLeaks} shipped files carry any metadata.`);
  if (exifLeaks) throw new Error("Metadata leaked into a shipped file — see above.");
  if (stale.length) console.log(`  removed ${stale.length} stale file(s): ${stale.join(", ")}`);

  // Committed beside the script, **not** under `public/` — 6.4 needs the
  // shipped dimensions to lay out a grid without shift, and transcribing 29
  // pairs of numbers by hand is how one of them ends up wrong. It lives here
  // rather than in the output directory because everything in `public/` ships,
  // and a build manifest is nobody's business but this repo's.
  if (!dry) {
    await writeFile(
      path.join(ROOT, "scripts", "pictures-manifest.tsv"),
      "# generated by build-pictures.mjs — id, group, shipped width, height\n" +
        rows.map((r) => `${r.id}\t${r.group}\t${r.w}\t${r.h}`).join("\n") +
        "\n",
      "utf8",
    );
  }
  console.log("");
}

main().catch((err) => {
  console.error(`\n[build-pictures] ${err.message}\n`);
  process.exit(1);
});
