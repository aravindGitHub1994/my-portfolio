// Tattoo art (plan-0009 §1.3, ADR-012 §3): painted SIMPLIFIED recreations
// as pure canvas vector ops — paths only, no embedded images; the
// reference photos never leave assets-src/. Drawn into the right-forearm
// albedo canvas: wrist glyph stack, ninja-star, molecule, pocket-watch +
// roses, feather/wing, and the red-and-black koi + lotus.
//
// Canvas mapping (CapsuleGeometry): x wraps around the arm, y runs along
// it — canvas TOP = wrist end (flipY). The koi sits centred so its red
// faces the CRT light pool in the typing pose (verified in the harness).

const INK = "#1f1a17";
const RED = "#b32c26";

export function drawTattoos(ctx: CanvasRenderingContext2D, size: number) {
  const s = size / 512; // author at 512, scale to actual

  ctx.save();
  ctx.scale(s, s);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // --- Inner-wrist glyph stack (canvas top = wrist). -----------------
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  ctx.lineWidth = 5;
  // Glyph 1: circled dot.
  ctx.beginPath();
  ctx.arc(256, 36, 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(256, 36, 4, 0, Math.PI * 2);
  ctx.fill();
  // Glyph 2: triangle.
  ctx.beginPath();
  ctx.moveTo(256, 62);
  ctx.lineTo(268, 84);
  ctx.lineTo(244, 84);
  ctx.closePath();
  ctx.stroke();
  // Glyph 3: three bars.
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(242, 100 + i * 10);
    ctx.lineTo(270, 100 + i * 10);
    ctx.stroke();
  }

  // --- Ninja star (four-point). --------------------------------------
  ctx.fillStyle = INK;
  ctx.beginPath();
  const cx = 140;
  const cy = 170;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const b = a + Math.PI / 4;
    ctx.lineTo(cx + Math.cos(a) * 34, cy + Math.sin(a) * 34);
    ctx.lineTo(cx + Math.cos(b) * 10, cy + Math.sin(b) * 10);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f0e8dd";
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();

  // --- Molecule (hex ring + bonds + atoms). --------------------------
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  const mx = 396;
  const my = 200;
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const px = mx + Math.cos(a) * 26;
    const py = my + Math.sin(a) * 26;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = INK;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    ctx.beginPath();
    ctx.arc(mx + Math.cos(a) * 26, my + Math.sin(a) * 26, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(mx, my - 26);
  ctx.lineTo(mx, my - 48);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(mx, my - 52, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // --- Pocket-watch + roses. -----------------------------------------
  const wx = 120;
  const wy = 320;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(wx, wy, 34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(wx, wy, 27, 0, Math.PI * 2);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Crown + bow.
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(wx, wy - 34);
  ctx.lineTo(wx, wy - 44);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(wx, wy - 50, 7, 0, Math.PI * 2);
  ctx.stroke();
  // Hands at ten-past-ten.
  ctx.beginPath();
  ctx.moveTo(wx, wy);
  ctx.lineTo(wx - 12, wy - 14);
  ctx.moveTo(wx, wy);
  ctx.lineTo(wx + 16, wy - 8);
  ctx.stroke();
  // Tick marks.
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(wx + Math.cos(a) * 22, wy + Math.sin(a) * 22);
    ctx.lineTo(wx + Math.cos(a) * 26, wy + Math.sin(a) * 26);
    ctx.stroke();
  }
  // Roses: spiral blooms flanking the watch.
  for (const [rx, ry, rr] of [
    [78, 288, 17],
    [162, 292, 14],
    [96, 362, 15],
  ]) {
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let t = 0; t < Math.PI * 5; t += 0.3) {
      const rad = (t / (Math.PI * 5)) * rr;
      const px = rx + Math.cos(t) * rad;
      const py = ry + Math.sin(t) * rad;
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Leaves.
    ctx.beginPath();
    ctx.ellipse(rx + rr + 6, ry + 6, 9, 4, 0.7, 0, Math.PI * 2);
    ctx.stroke();
  }

  // --- Feather / wing (outer edge). ----------------------------------
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(448, 120);
  ctx.quadraticCurveTo(470, 220, 440, 330);
  ctx.stroke();
  ctx.lineWidth = 3;
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const bx = 448 + (440 - 448) * t + Math.sin(t * Math.PI) * 16;
    const by = 120 + (330 - 120) * t;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx - 26, by + 4, bx - 34, by + 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + 16, by + 6, bx + 20, by + 18);
    ctx.stroke();
  }

  // --- Koi + lotus (centrepiece — the red must read). ----------------
  // Koi body: S-curve, solid red with black fin/patch accents.
  const koi = new Path2D();
  koi.moveTo(250, 190);
  koi.bezierCurveTo(310, 210, 310, 260, 262, 292);
  koi.bezierCurveTo(226, 316, 232, 356, 270, 378);
  koi.bezierCurveTo(240, 386, 208, 372, 200, 340);
  koi.bezierCurveTo(192, 306, 222, 280, 248, 258);
  koi.bezierCurveTo(272, 236, 268, 210, 250, 190);
  ctx.fillStyle = RED;
  ctx.fill(koi);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.stroke(koi);
  // Head + eye.
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.ellipse(252, 186, 22, 16, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(260, 180, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Black pectoral fins + tail wash.
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(282, 226, 16, 7, 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(222, 262, 14, 6, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(270, 378);
  ctx.quadraticCurveTo(296, 396, 288, 416);
  ctx.quadraticCurveTo(268, 404, 254, 392);
  ctx.closePath();
  ctx.fill();
  // Scales: short black arcs on the red body.
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  for (const [sx2, sy2] of [
    [258, 232],
    [244, 252],
    [252, 274],
    [236, 296],
    [246, 318],
    [234, 340],
  ]) {
    ctx.beginPath();
    ctx.arc(sx2, sy2, 8, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }
  // Lotus under the tail: black petals, red hearts.
  const lx = 322;
  const ly = 372;
  for (let i = -2; i <= 2; i++) {
    const a = i * 0.42 - Math.PI / 2;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(
      lx + Math.cos(a) * 20,
      ly + Math.sin(a) * 20,
      13,
      24,
      a + Math.PI / 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.ellipse(lx, ly - 14, 9, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
