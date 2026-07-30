// Shared canvas-baked materials for the room props (plan-0009 §2.1).
// Every texture is drawn by seeded canvas ops at ≤ 1024² — no image files,
// no Microsoft marks (ADR-012 §10). Client-only: call inside the ssr:false
// tree, never at module top level.

import {
  CanvasTexture,
  DoubleSide,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";
import { mulberry32 } from "@/lib/prng";
import { EDUCATION } from "@/lib/resume";
import type { DetailLevel } from "../character/buildBody";

export interface RoomBuilderOptions {
  seed: number;
  detail: DetailLevel;
  materials: RoomMaterials;
}

export interface RoomMaterials {
  wood: MeshStandardMaterial;
  floor: MeshStandardMaterial;
  wall: MeshStandardMaterial;
  plastic: MeshStandardMaterial;
  plasticDark: MeshStandardMaterial;
  rubber: MeshStandardMaterial;
  metal: MeshStandardMaterial;
  /** Power LEDs — the tower's (2.3) and the CRT's, which shares this same
   *  instance because they report the same thing: the machine is on. Its
   *  `emissiveIntensity` is animated by `TowerPower` and is 0 at rest, so
   *  a scene that never boots shows dead plastic. Split the instance if
   *  the two lamps ever need to disagree. */
  led: MeshStandardMaterial;
  paper: MeshStandardMaterial;
  cardboard: MeshStandardMaterial;
  /** CRT glass — the distinct slot slice 3.1 will target. */
  screen: MeshStandardMaterial;
  mug: MeshStandardMaterial;
  poster: MeshStandardMaterial;
  windowDusk: MeshBasicMaterial;
  cdCase: MeshStandardMaterial;
  /** One material per labeled CD spine (from resume EDUCATION). */
  cdSpines: MeshStandardMaterial[];
  /** Cat tree (5.1): fleece-covered platforms and the sisal-wrapped post,
   *  matched to the reference photograph — navy fleece, tan rope. */
  fleece: MeshStandardMaterial;
  sisal: MeshStandardMaterial;
  /** The two cats' coats (ADR-013 §8). Nimbus is ginger; Ivy is a dilute
   *  calico, so she is mostly `catGrey` with `catCream` underneath and a
   *  little `catGinger` on the head — which is why the ginger slot is
   *  shared rather than named for one cat. `catCream` does both cats'
   *  muzzle, chest and paws. */
  catGinger: MeshStandardMaterial;
  catCream: MeshStandardMaterial;
  catGrey: MeshStandardMaterial;
  /** Corner lamp (ADR-014 §5). Two slots, and the split is the point: the
   *  bulb is meant to bloom and the shade is meant not to. `DoubleSide` on
   *  the shade because the cone is open-ended — see `lamp.ts`. */
  lampShade: MeshStandardMaterial;
  lampBulb: MeshStandardMaterial;
  dispose(): void;
}

function bake(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx, width, height);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Speckle helper — seeded dots for plaster/plastic grain. */
function speckle(
  ctx: CanvasRenderingContext2D,
  rnd: () => number,
  w: number,
  h: number,
  count: number,
  color: string,
  alpha: number,
) {
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  for (let i = 0; i < count; i++) {
    ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  ctx.globalAlpha = 1;
}

export function createRoomMaterials(seed: number): RoomMaterials {
  const rnd = mulberry32(seed ^ 0x524f4f4d);

  // Desk wood — warm mid brown, long wavy grain.
  const woodTex = bake(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#6d4a2e";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const y = rnd() * h;
      ctx.strokeStyle = rnd() > 0.5 ? "#5c3d24" : "#7d5636";
      ctx.globalAlpha = 0.35 + rnd() * 0.3;
      ctx.lineWidth = 1 + rnd() * 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 64) {
        ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 4 + (rnd() - 0.5) * 6);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });

  // Floor boards — darker, with seams; tiles 2×2.
  const floorTex = bake(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#4e3a28";
    ctx.fillRect(0, 0, w, h);
    const board = h / 8;
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? "#54402c" : "#483523";
      ctx.fillRect(0, i * board, w, board - 2);
      ctx.fillStyle = "#2f2216";
      ctx.fillRect(0, i * board + board - 2, w, 2);
    }
    for (let i = 0; i < 120; i++) {
      ctx.strokeStyle = "#3d2d1e";
      ctx.globalAlpha = 0.4;
      const y = rnd() * h;
      ctx.beginPath();
      ctx.moveTo(rnd() * w, y);
      ctx.lineTo(rnd() * w, y + (rnd() - 0.5) * 3);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
  floorTex.wrapS = floorTex.wrapT = RepeatWrapping;
  floorTex.repeat.set(2, 2);

  // Plaster wall — dusty neutral with speckle.
  const wallTex = bake(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#b3aca0";
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, rnd, w, h, 500, "#a29a8d", 0.5);
    speckle(ctx, rnd, w, h, 250, "#c1bab0", 0.5);
  });
  wallTex.wrapS = wallTex.wrapT = RepeatWrapping;
  wallTex.repeat.set(3, 2);

  // Aged case plastic — beige with a faint yellowing gradient.
  const plasticTex = bake(256, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#d9d0bd");
    g.addColorStop(1, "#cdc0a6");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, rnd, w, h, 350, "#c2b498", 0.4);
  });

  // Notebook page — ruled paper + a period-appropriate to-do list.
  const paperTex = bake(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#f1ede0";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#b9c4d6";
    ctx.lineWidth = 2;
    for (let y = 90; y < h; y += 52) {
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(w - 30, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "#d98c8c";
    ctx.beginPath();
    ctx.moveTo(70, 0);
    ctx.lineTo(70, h);
    ctx.stroke();
    ctx.fillStyle = "#3b3f52";
    ctx.font = "italic 40px Georgia, serif";
    ctx.fillText("To-Do:", 90, 80);
    ctx.font = "italic 32px Georgia, serif";
    const items = ["- Report", "- Backup data", "- Email client", "- System setup"];
    items.forEach((line, i) => ctx.fillText(line, 110, 140 + i * 52));
  });

  // Mug wrap — "Ctrl Alt Del" stacked, centered on the wrap seam's far side.
  const mugTex = bake(512, 256, (ctx, w, h) => {
    ctx.fillStyle = "#ece8e0";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#262626";
    ctx.font = "bold 44px Arial, sans-serif";
    ctx.textAlign = "center";
    ["Ctrl", "Alt", "Del"].forEach((word, i) =>
      ctx.fillText(word, w / 2, 90 + i * 56),
    );
  });

  // Poster — period pastiche: teal sky, clouds, a plain 2×2 window glyph,
  // "workstation·98" wordmark. Deliberately NOT the Microsoft flag/wordmark.
  const posterTex = bake(512, 672, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#3f7f9e");
    g.addColorStop(1, "#9fc4cf");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 14; i++) {
      ctx.globalAlpha = 0.12 + rnd() * 0.15;
      const cx = rnd() * w;
      const cy = rnd() * h * 0.7;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 60 + rnd() * 90, 20 + rnd() * 26, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Window glyph: plain white 2×2 frame outline.
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 10;
    ctx.strokeRect(w / 2 - 80, 180, 160, 160);
    ctx.beginPath();
    ctx.moveTo(w / 2, 180);
    ctx.lineTo(w / 2, 340);
    ctx.moveTo(w / 2 - 80, 260);
    ctx.lineTo(w / 2 + 80, 260);
    ctx.stroke();
    ctx.fillStyle = "#f4f8f9";
    ctx.font = "bold 58px Verdana, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("workstation", w / 2, 440);
    ctx.font = "bold 88px Verdana, sans-serif";
    ctx.fillText("98", w / 2, 540);
    ctx.strokeStyle = "#eef2f3";
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, w - 24, h - 24);
  });

  // Window "glass" — dusk gradient with a hill silhouette; MeshBasic so it
  // reads luminous before the 2.2 lighting rig exists.
  const windowTex = bake(512, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#16264d");
    g.addColorStop(0.55, "#41537f");
    g.addColorStop(0.8, "#b26a45");
    g.addColorStop(1, "#7c4230");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#131a2c";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.82);
    for (let x = 0; x <= w; x += 32) {
      ctx.lineTo(x, h * 0.82 - Math.abs(Math.sin(x * 0.011)) * 40 - rnd() * 8);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
  });

  // CD spines — credential labels from the resume (skip school boards).
  const spineLabels = EDUCATION.filter((e) => e.institution !== "Chinmaya Vidyalaya, New Delhi")
    .map((e) => e.credential);
  const spineHues = ["#3d5a80", "#6b4a6f", "#4a6f52", "#8a5a3b"];
  const cdSpines = spineLabels.map((label, i) => {
    const tex = bake(512, 64, (ctx, w, h) => {
      ctx.fillStyle = spineHues[i % spineHues.length];
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#f0ede4";
      ctx.font = "bold 30px Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(label, 16, 42, w - 32);
    });
    return new MeshStandardMaterial({ map: tex, roughness: 0.5 });
  });

  const materials: RoomMaterials = {
    wood: new MeshStandardMaterial({ map: woodTex, roughness: 0.65 }),
    floor: new MeshStandardMaterial({ map: floorTex, roughness: 0.85 }),
    wall: new MeshStandardMaterial({ map: wallTex, roughness: 0.95 }),
    plastic: new MeshStandardMaterial({ map: plasticTex, roughness: 0.8 }),
    plasticDark: new MeshStandardMaterial({ color: "#494a45", roughness: 0.8 }),
    rubber: new MeshStandardMaterial({ color: "#2b2b28", roughness: 0.95 }),
    metal: new MeshStandardMaterial({
      color: "#7d8187",
      roughness: 0.45,
      metalness: 0.6,
    }),
    // Dark green plastic until it lights. Emissive only — it adds no light
    // to the room, so the gate-2.3 brightness contract (screen luminance
    // cap 0.7 + Lighting's CAST_MAX 2.6) is untouched by it.
    led: new MeshStandardMaterial({
      color: "#0d2b18",
      emissive: "#4bff9b",
      emissiveIntensity: 0,
      roughness: 0.35,
    }),
    paper: new MeshStandardMaterial({ map: paperTex, roughness: 0.9 }),
    cardboard: new MeshStandardMaterial({ color: "#e4dfd2", roughness: 0.9 }),
    screen: new MeshStandardMaterial({ color: "#0b1512", roughness: 0.35 }),
    mug: new MeshStandardMaterial({ map: mugTex, roughness: 0.4 }),
    poster: new MeshStandardMaterial({ map: posterTex, roughness: 0.85 }),
    windowDusk: new MeshBasicMaterial({ map: windowTex }),
    cdCase: new MeshStandardMaterial({ color: "#2b2e35", roughness: 0.45 }),
    cdSpines,
    // Fabric and fur are the roughest things in the room — anything shiny
    // here reads as plastic at this scale.
    fleece: new MeshStandardMaterial({ color: "#2f3a52", roughness: 0.98 }),
    sisal: new MeshStandardMaterial({ color: "#bda27a", roughness: 0.95 }),
    catGinger: new MeshStandardMaterial({ color: "#c8763a", roughness: 0.95 }),
    catCream: new MeshStandardMaterial({ color: "#ecdcc2", roughness: 0.95 }),
    catGrey: new MeshStandardMaterial({ color: "#8f8d8c", roughness: 0.95 }),
    // Corner lamp (ADR-014 §5). Emissive only, both of them — like the
    // LEDs they add no light to the room, so the gate-2.3 brightness
    // contract (screen luminance cap 0.7 + Lighting's CAST_MAX 2.6) is
    // untouched. The lamp's actual illumination is a point light in
    // `Lighting.tsx`, with its own ceiling.
    //
    // The shade glows because it is lit from inside, but stays UNDER
    // Bloom's 0.68 luminance threshold: a blooming lampshade is a light
    // box, not a lamp. `DoubleSide` because `lamp.ts` builds the cone
    // open-ended so the bulb reads through it.
    lampShade: new MeshStandardMaterial({
      color: "#e8d7b8",
      emissive: "#ffcf94",
      emissiveIntensity: 0.45,
      roughness: 0.85,
      side: DoubleSide,
    }),
    // The bulb DOES bloom, and that is the point of the lamp (ADR-014 §5).
    // Pitched above the tower LED's shipped `#4bff9b` at 1.35, which is the
    // one emissive in this scene proved to bloom through this exact
    // pipeline — a measured reference beats guessing where tone mapping
    // leaves the 0.68 threshold.
    lampBulb: new MeshStandardMaterial({
      color: "#3a3024",
      emissive: "#ffd9a8",
      emissiveIntensity: 1.6,
      roughness: 0.4,
    }),
    dispose() {
      const all = [
        materials.wood,
        materials.floor,
        materials.wall,
        materials.plastic,
        materials.plasticDark,
        materials.rubber,
        materials.metal,
        materials.led,
        materials.paper,
        materials.cardboard,
        materials.screen,
        materials.mug,
        materials.poster,
        materials.windowDusk,
        materials.cdCase,
        materials.fleece,
        materials.sisal,
        materials.catGinger,
        materials.catCream,
        materials.catGrey,
        materials.lampShade,
        materials.lampBulb,
        ...materials.cdSpines,
      ];
      for (const material of all) {
        if ("map" in material) material.map?.dispose();
        material.dispose();
      }
    },
  };
  return materials;
}
