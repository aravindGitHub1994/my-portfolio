// Generate the day-mode (light) diagram variants from the committed dark SVGs.
//
//   node scripts/diagrams-light.js
//
// Rather than re-rendering from the *.mmd sources (which can drift in layout
// between mermaid-cli versions), this remaps the palette of the existing dark
// public/diagrams/<name>.svg to the day "Warm-sunlit" tokens (globals.css
// `html[data-theme="day"]`), writing public/diagrams/<name>.light.svg with
// identical geometry. ProjectModal swaps to these when `resolved === "day"`.
//
// Replacement is literal and ordered: 6-digit hex before 3-digit so "#cccccc"
// is not partially clobbered by "#ccc". Re-run after editing any *.mmd/<name>.svg.
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "public", "diagrams");
const FILES = ["taxonomy", "budget", "gmc", "personas"];

// [from, to] — dark mermaid/portfolio palette → day tokens.
const MAP = [
  // --- 6-digit hex (before any 3-digit) ---
  ["#cccccc", "#2d2417"],            // light-grey gradient stop / text → espresso
  ["#F9FFFE", "#2d2417"],            // cluster label text → espresso
  ["#FFFFFF", "#2d2417"],            // drop-shadow flood (opacity 0.06) → soft dark
  ["#c0c7d1", "#4a5563"],            // silver markers / edges / store stroke → slate
  ["#9bb06a", "#4a5d28"],            // moss stroke → day moss
  ["#d4af37", "#82661b"],            // gold stroke → day gold
  ["#e8ddb5", "#2d2417"],            // node text (cream) → espresso
  ["#b8a9d9", "#64497e"],            // lilac → day lilac
  ["#181840", "#eef0e2"],            // frontend fill (navy) → faint moss cream
  ["#0f0f2a", "#f6efd9"],            // backend fill → faint gold cream
  ["#07071a", "#eef1f4"],            // store fill → faint slate cream
  ["#1f2020", "#fbf6ea"],            // default node fill → raised surface
  // (#a44141 error red, #000000 keep as-is)
  // --- 3-digit hex ---
  ["#ccc", "#2d2417"],               // default text/label → espresso
  ["#ddd", "#2d2417"],               // error text → espresso
  // (#000 keep)
  // --- rgb() forms (mirror the hex node palette) ---
  ["rgb(232, 221, 181)", "rgb(45, 36, 23)"],     // text cream → espresso
  ["rgb(24, 24, 64)", "rgb(238, 240, 226)"],     // frontend fill
  ["rgb(15, 15, 42)", "rgb(246, 239, 217)"],     // backend fill
  ["rgb(7, 7, 26)", "rgb(238, 241, 244)"],       // store fill
  ["rgb(155, 176, 106)", "rgb(74, 93, 40)"],     // moss
  ["rgb(212, 175, 55)", "rgb(130, 102, 27)"],    // gold
  ["rgb(192, 199, 209)", "rgb(74, 85, 99)"],     // silver → slate
  ["rgb(184, 169, 217)", "rgb(100, 73, 126)"],   // lilac
  // --- hsl() / rgba() structural backgrounds ---
  ["hsl(0, 0%, 34.4117647059%)", "#ece0c6"],                 // edgeLabel bg → surface-2
  ["hsl(180, 1.5873015873%, 28.3529411765%)", "#fbf6ea"],    // cluster fill → surface
  ["hsl(180, 0%, 18.3529411765%)", "#ece0c6"],               // gradient dark stop
  ["rgba(87.75, 87.75, 87.75, 0.5)", "rgba(45, 36, 23, 0.1)"], // labelBkg
  ["rgba(255, 255, 255, 0.25)", "rgba(45, 36, 23, 0.22)"],     // cluster stroke
  ["rgba(185,185,185,1)", "rgba(45,36,23,0.18)"],             // neo drop-shadow
  ["fill:lightgrey", "fill:#4a5563"],                        // arrowheadPath
];

for (const name of FILES) {
  let svg = fs.readFileSync(path.join(DIR, `${name}.svg`), "utf8");
  for (const [from, to] of MAP) svg = svg.split(from).join(to);
  fs.writeFileSync(path.join(DIR, `${name}.light.svg`), svg, "utf8");
  console.log(`wrote ${name}.light.svg (${svg.length} bytes)`);
}
