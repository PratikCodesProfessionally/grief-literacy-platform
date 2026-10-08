/**
 * Print-ready mandala line art for the Healing Mandala coloring book.
 *
 * The first three families are ports of the in-app templates in
 * client/src/pages/therapy/HealingMandala.tsx (procedural rings, traditional
 * floral, dot mandala) adapted for paper: pure black lines, no jitter, larger
 * dots, and line weights chosen per difficulty level. The rest are
 * print-only families that add variety across 30 pages.
 *
 * Every family draws around (0,0), 0° pointing up, and returns
 * { extent, body } where extent is the outermost radius it reaches. renderSvg()
 * scales that to fill the page and sets stroke widths so lines print at a
 * fixed physical weight whatever the design's own scale.
 *
 * Shapes are white-filled, so a shape drawn later hides the lines beneath it,
 * exactly like the app. Elements with class "n" are unfilled (pure line work).
 */

const r2 = (n) => Math.round(n * 100) / 100;
const rad = (deg) => ((deg - 90) * Math.PI) / 180;
/** Point at radius r and angle deg (0° = up, clockwise). */
const pt = (r, deg) => [r2(r * Math.cos(rad(deg))), r2(r * Math.sin(rad(deg)))];

const circle = (cx, cy, r, cls = 'm') => `<circle class="${cls}" cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}"/>`;
const path = (d, cls = 'm', transform = '') =>
  `<path class="${cls}" d="${d}"${transform ? ` transform="${transform}"` : ''}/>`;
const line = (x1, y1, x2, y2, cls = 'd', transform = '') =>
  `<line class="${cls} n" x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}"${transform ? ` transform="${transform}"` : ''}/>`;
const polygon = (pts, cls = 'm') => `<polygon class="${cls}" points="${pts.map((p) => p.join(',')).join(' ')}"/>`;

/** Annular sector between radii ri..ro and angles a0..a1 (degrees). */
function sector(ri, ro, a0, a1, cls = 'm') {
  const [x0, y0] = pt(ri, a0), [x1, y1] = pt(ri, a1), [X0, Y0] = pt(ro, a0), [X1, Y1] = pt(ro, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return path(`M ${x0} ${y0} A ${ri} ${ri} 0 ${large} 1 ${x1} ${y1} L ${X1} ${Y1} A ${ro} ${ro} 0 ${large} 0 ${X0} ${Y0} Z`, cls);
}

/** Scalloped border: bumps sitting on a circle, then the disc on top hides their inner halves. */
function scallopBorder(R, count, bump) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const [x, y] = pt(R, (i * 360) / count);
    out.push(circle(x, y, bump));
  }
  out.push(circle(0, 0, R));
  return out;
}

/** Heart with its tip at +y (toward the centre once placed at the top of a ring). */
function heartPath(s) {
  const k = (v) => r2(v * s);
  return `M 0 ${k(0.5)} C ${k(-0.62)} ${k(0.05)}, ${k(-0.58)} ${k(-0.6)}, 0 ${k(-0.25)} C ${k(0.58)} ${k(-0.6)}, ${k(0.62)} ${k(0.05)}, 0 ${k(0.5)} Z`;
}

function starPoints(cx, cy, points, outer, inner, rotation = 0) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const [x, y] = pt(r, rotation + (i * 180) / points);
    pts.push([r2(cx + x), r2(cy + y)]);
  }
  return pts;
}

// ── Families ported from the app ────────────────────────────────────────────

/** App template "Procedural Custom": sliced concentric rings under leaf petals. */
export function petalRings({ rings = 3, petals = 8 }) {
  const out = [];
  for (let ri = 0; ri < rings; ri++) {
    const rIn = 25 + ri * 28;
    const rOut = rIn + 22;
    for (let pi = 0; pi < petals; pi++) out.push(sector(rIn, rOut, (pi * 360) / petals, ((pi + 1) * 360) / petals));
  }
  for (let i = 0; i < petals; i++) {
    const a = (i * 360) / petals;
    const [ra, rb, rc] = [47, 140, 230];
    out.push(path(`M 0 ${-ra} C 30 ${-ra - 30}, 60 ${-rb}, 0 ${-rc} C -60 ${-rb}, -30 ${-ra - 30}, 0 ${-ra} Z`, 'm', `rotate(${a})`));
  }
  out.push(circle(0, 0, 14, 'b'));
  return { extent: Math.max(232, 25 + 28 * (rings - 1) + 22), body: out.join('') };
}

/**
 * App template "Traditional Floral" (without the app's leftover debug circle).
 * The app spaces petal layers a fixed 25px apart, which leaves a hole between
 * the petals and the outer leaves when there are only a few layers; here the
 * layers are spread to always reach the ring that carries the leaves.
 */
export function traditionalFloral({ petals = 12, layers = 3, scallops = 12, scallopR = 8 }) {
  const out = [circle(0, 0, 172), circle(0, 0, 20, 'b')];
  for (let i = 0; i < scallops; i++) {
    const [x, y] = pt(30 + (scallopR - 8), (i * 360) / scallops);
    out.push(circle(x, y, scallopR));
  }
  const step = 85 / layers;
  const len = layers === 1 ? 112 : step + 30;
  for (let li = 0; li < layers; li++) {
    const ra = 50 + li * step;
    const rb = ra + len;
    const d = li % 2 === 0
      ? `M 0 ${-ra} C 20 ${-ra - 20}, 30 ${-rb}, 0 ${-rb} C -30 ${-rb}, -20 ${-ra - 20}, 0 ${-ra} Z`
      : `M 0 ${-ra} L 15 ${-ra - 30} L 25 ${-rb} L 0 ${-rb - 10} L -25 ${-rb} L -15 ${-ra - 30} Z`;
    for (let i = 0; i < petals; i++) out.push(path(d, 'm', `rotate(${(i * 360) / petals + (li * 180) / petals})`));
  }
  for (let i = 0; i < petals; i++) {
    const a = (i * 360) / petals;
    const [ra, rb] = [170, 220];
    out.push(path(`M 0 ${-ra} C 35 ${-ra - 25}, 40 ${-rb}, 0 ${-rb + 10} C -40 ${-rb}, -35 ${-ra - 25}, 0 ${-ra} Z`, 'm', `rotate(${a})`));
    out.push(line(0, -ra, 0, -rb + 10, 'd', `rotate(${a})`));
  }
  return { extent: 222, body: out.join('') };
}

/**
 * App template "Dot Mandala". For paper the dots are sized to their spacing
 * (the app's 2–6px dots are too small to colour) and the dot rings sit inside
 * and outside the flame ring instead of underneath it.
 */
export function dotMandala({ inner = 2, petals = 12, outer = 1, flameDots = true }) {
  const out = [circle(0, 0, 30, 'b')];
  for (let i = 0; i < 16; i++) {
    const [x1, y1] = pt(10, (i * 360) / 16), [x2, y2] = pt(20, (i * 360) / 16);
    out.push(line(x1, y1, x2, y2, 'd'));
  }
  const band = 62 / inner;
  for (let i = 0; i < inner; i++) {
    const R = 40 + band * (i + 0.5);
    const n = Math.max(6, Math.round((2 * Math.PI * R) / (band * 1.15)));
    for (let j = 0; j < n; j++) {
      const [x, y] = pt(R, (j * 360) / n + (i % 2) * (180 / n));
      out.push(circle(x, y, band * 0.4));
    }
  }
  out.push(circle(0, 0, 104, 'd n'));
  if (!outer) out.push(circle(0, 0, 234, 'm n'));
  const flame = [
    'M 0 -185 C 15 -195, 20 -210, 0 -225 C -20 -210, -15 -195, 0 -185 Z',
    'M 0 -185 C 20 -180, 25 -165, 0 -145 C -25 -165, -20 -180, 0 -185 Z',
    'M 0 -145 C 15 -140, 20 -125, 0 -110 C -20 -125, -15 -140, 0 -145 Z',
  ];
  for (let i = 0; i < petals; i++) {
    const t = `rotate(${(i * 360) / petals})`;
    flame.forEach((d) => out.push(path(d, 'm', t)));
    if (flameDots) for (let d = 0; d < 3; d++) out.push(`<g transform="${t}">${circle(0, -155 - d * 10, 3.6, 'd')}</g>`);
  }
  let extent = outer ? 226 : 235;
  for (let k = 0; k < outer; k++) {
    const R = 245 + k * 24;
    const n = Math.round((2 * Math.PI * R) / 27);
    for (let j = 0; j < n; j++) {
      const [x, y] = pt(R, (j * 360) / n + (k % 2) * (180 / n));
      out.push(circle(x, y, 9.5));
    }
    extent = R + 10;
  }
  return { extent, body: out.join('') };
}

// ── Print-only families ─────────────────────────────────────────────────────

/** Layered lotus: outer petal rings first so inner rings overlap their bases. */
export function lotus({ rings = 2, petals = 8, veins = false, border = true }) {
  const out = [];
  const tips = [];
  for (let j = 0; j < rings; j++) tips.push(45 + 50 * j + 100 + 10 * j);
  const tipMax = tips[rings - 1];
  const borderR = tipMax + 14;
  const bumps = Math.round((2 * Math.PI * borderR) / 34);
  if (border) out.push(...scallopBorder(borderR, bumps, 15));
  for (let j = rings - 1; j >= 0; j--) {
    const b = 45 + 50 * j;
    const t = tips[j];
    const len = t - b;
    const w = ((2 * Math.PI * ((b + t) / 2)) / petals) * 0.62;
    const d = `M 0 ${-b} C ${r2(w)} ${r2(-b - len * 0.15)}, ${r2(w * 0.9)} ${r2(-t + len * 0.35)}, 0 ${-t} C ${r2(-w * 0.9)} ${r2(-t + len * 0.35)}, ${r2(-w)} ${r2(-b - len * 0.15)}, 0 ${-b} Z`;
    for (let i = 0; i < petals; i++) {
      const tr = `rotate(${r2((i * 360) / petals + (j % 2) * (180 / petals))})`;
      out.push(path(d, 'm', tr));
      if (veins) out.push(line(0, -b - len * 0.28, 0, -t + len * 0.25, 'd', tr));
    }
  }
  const small = Math.max(6, petals + 2);
  for (let i = 0; i < small; i++) {
    const [x, y] = pt(40, (i * 360) / small);
    out.push(circle(x, y, Math.min(11, (2 * Math.PI * 40) / small / 2.3)));
  }
  out.push(circle(0, 0, 26, 'b'));
  if (veins) out.push(circle(0, 0, 13, 'd'));
  return { extent: border ? borderR + 15 : tipMax, body: out.join('') };
}

/** Hearts ring around a flower, with a segmented band and an outer drop ring. */
export function hearts({ n = 6, detail = false }) {
  const out = [];
  const outerR = 238;
  if (detail) out.push(...scallopBorder(outerR, Math.round((2 * Math.PI * outerR) / 32), 14));
  else out.push(circle(0, 0, outerR));
  // Drops pointing outward between the hearts' lobes.
  const drops = n * 2;
  for (let i = 0; i < drops; i++) {
    out.push(path('M 0 -198 C 14 -205, 16 -220, 0 -232 C -16 -220, -14 -205, 0 -198 Z', 'm', `rotate(${r2((i * 360) / drops)})`));
  }
  const s = Math.min(110, ((2 * Math.PI * 145) / n) * 0.8);
  for (let i = 0; i < n; i++) {
    const tr = `rotate(${r2((i * 360) / n)}) translate(0 -145)`;
    out.push(path(heartPath(s), 'm', tr));
    if (detail) out.push(path(heartPath(s * 0.52), 'd', `${tr} translate(0 ${r2(s * 0.08)})`));
    const [x, y] = pt(150, (i * 360) / n + 180 / n);
    out.push(circle(x, y, Math.max(7, s * 0.14)));
  }
  const cells = detail ? n * 3 : n * 2;
  for (let i = 0; i < cells; i++) out.push(sector(64, 86, (i * 360) / cells, ((i + 1) * 360) / cells));
  const fp = detail ? 10 : 7;
  for (let i = 0; i < fp; i++) {
    out.push(`<ellipse class="m" cx="0" cy="-40" rx="${detail ? 11 : 15}" ry="22" transform="rotate(${r2((i * 360) / fp)})"/>`);
  }
  out.push(circle(0, 0, 20, 'b'));
  return { extent: detail ? outerR + 14 : outerR, body: out.join('') };
}

/** Sun rays around a centre, a band, then a ring of stars. */
export function sunAndStars({ rays = 8, stars = 8, detail = false }) {
  const out = [circle(0, 0, 250, 'n m')];
  out.push(circle(0, 0, 186), circle(0, 0, 165));
  if (detail) for (let i = 0; i < rays * 2; i++) out.push(sector(165, 186, (i * 360) / (rays * 2), ((i + 1) * 360) / (rays * 2)));
  const step = 360 / (rays * 2);
  for (let i = 0; i < rays * 2; i++) {
    const a = i * step;
    const tip = i % 2 === 0 ? 152 : 112;
    out.push(polygon([pt(52, a - step / 2), pt(tip, a), pt(52, a + step / 2)]));
    if (detail && i % 2 === 0) out.push(polygon([pt(70, a - step / 4), pt(tip - 34, a), pt(70, a + step / 4)], 'd'));
  }
  out.push(circle(0, 0, 52, 'b'), circle(0, 0, 30));
  if (detail) out.push(circle(0, 0, 14, 'd'));
  const rs = Math.min(27, ((2 * Math.PI * 218) / stars) * 0.34);
  for (let i = 0; i < stars; i++) {
    const [x, y] = pt(218, (i * 360) / stars);
    out.push(polygon(starPoints(x, y, 5, rs, rs * 0.45, (i * 360) / stars)));
    const [dx, dy] = pt(218, (i * 360) / stars + 180 / stars);
    out.push(circle(dx, dy, Math.max(4, rs * 0.28), 'd'));
  }
  return { extent: 251, body: out.join('') };
}

/** Pure line work: a star, zigzag and divided bands, and an overlapping-circle ring. */
export function geometric({ n = 8, bands = 1 }) {
  const out = [];
  const zigzag = (ra, rb, teeth, cls = 'm n') => {
    const pts = [];
    for (let i = 0; i <= teeth * 2; i++) pts.push(pt(i % 2 === 0 ? ra : rb, (i * 180) / teeth));
    return `<polyline class="${cls}" points="${pts.map((p) => p.join(',')).join(' ')}"/>`;
  };
  const ring = (r, cls = 'm n') => circle(0, 0, r, cls);
  const dividers = (ra, rb, count, offset = 0) => {
    for (let i = 0; i < count; i++) {
      const a = (i * 360) / count + offset;
      const [x1, y1] = pt(ra, a), [x2, y2] = pt(rb, a);
      out.push(line(x1, y1, x2, y2, 'm'));
    }
  };
  out.push(`<polygon class="b n" points="${starPoints(0, 0, n, 72, 34).map((p) => p.join(',')).join(' ')}"/>`);
  out.push(ring(30, 'b n'), ring(76));
  out.push(zigzag(76, 108, n), ring(108));
  let r = 108;
  if (bands >= 2) {
    dividers(108, 132, n * 2, 90 / n);
    out.push(ring(132));
    r = 132;
  }
  // Overlapping circles form lens shapes around the ring.
  const R = r + 48;
  const cr = ((2 * Math.PI * R) / n) * 0.62;
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(R, (i * 360) / n);
    out.push(circle(x, y, Math.min(cr, 48), 'm n'));
  }
  r = R + Math.min(cr, 48);
  out.push(ring(r));
  if (bands >= 3) {
    out.push(zigzag(r, r + 26, n * 2), ring(r + 26));
    r += 26;
  }
  out.push(ring(r + 12, 'b n'));
  return { extent: r + 13, body: out.join('') };
}

/** One paw print, toes pointing up (outward once placed at the top of a ring). */
function pawPrint(s, cls = 'm') {
  const k = (v) => r2(v * s);
  const toe = (x, y, rot) => `<ellipse class="${cls}" cx="${k(x)}" cy="${k(y)}" rx="${k(0.13)}" ry="${k(0.18)}" transform="rotate(${rot} ${k(x)} ${k(y)})"/>`;
  return `<path class="${cls}" d="M 0 ${k(-0.06)} C ${k(0.2)} ${k(-0.06)}, ${k(0.4)} ${k(0.12)}, ${k(0.36)} ${k(0.3)} C ${k(0.32)} ${k(0.44)}, ${k(0.14)} ${k(0.42)}, 0 ${k(0.38)} C ${k(-0.14)} ${k(0.42)}, ${k(-0.32)} ${k(0.44)}, ${k(-0.36)} ${k(0.3)} C ${k(-0.4)} ${k(0.12)}, ${k(-0.2)} ${k(-0.06)}, 0 ${k(-0.06)} Z"/>`
    + toe(-0.4, -0.2, -28) + toe(-0.15, -0.38, -8) + toe(0.15, -0.38, 8) + toe(0.4, -0.2, 28);
}

/** Paw prints around a flower, with little hearts between them - for children missing a pet. */
export function paws({ n = 6, detail = false }) {
  const out = [];
  const outerR = 240;
  if (detail) out.push(...scallopBorder(outerR, Math.round((2 * Math.PI * outerR) / 32), 14));
  else out.push(circle(0, 0, outerR));
  const cells = detail ? n * 3 : n * 2;
  for (let i = 0; i < cells; i++) out.push(sector(68, 92, (i * 360) / cells, ((i + 1) * 360) / cells));
  const s = Math.min(125, ((2 * Math.PI * 160) / n) * 0.72);
  for (let i = 0; i < n; i++) {
    out.push(`<g transform="rotate(${r2((i * 360) / n)}) translate(0 -160)">${pawPrint(s)}</g>`);
    const hs = Math.max(24, s * 0.32);
    out.push(path(heartPath(hs), detail ? 'd' : 'm', `rotate(${r2((i * 360) / n + 180 / n)}) translate(0 -${detail ? 200 : 185})`));
    if (detail) out.push(`<g transform="rotate(${r2((i * 360) / n + 180 / n)}) translate(0 -128)">${pawPrint(s * 0.34, 'd')}</g>`);
  }
  const fp = detail ? 9 : 6;
  for (let i = 0; i < fp; i++) {
    out.push(`<ellipse class="m" cx="0" cy="-40" rx="${detail ? 12 : 16}" ry="22" transform="rotate(${r2((i * 360) / fp)})"/>`);
  }
  out.push(circle(0, 0, 20, 'b'));
  return { extent: detail ? outerR + 14 : outerR, body: out.join('') };
}

// ── Shared shape helpers for the newer families ─────────────────────────────

/** Water drop: round end centred on the origin, tip at (0,-h). */
function dropPath(w, h) {
  const k = r2;
  return `M 0 ${k(-h)} C ${k(w * 0.5)} ${k(-h * 0.55)}, ${k(w)} ${k(-w * 0.9)}, ${k(w)} 0 A ${k(w)} ${k(w)} 0 0 1 ${k(-w)} 0 C ${k(-w)} ${k(-w * 0.9)}, ${k(-w * 0.5)} ${k(-h * 0.55)}, 0 ${k(-h)} Z`;
}

/** Pointed petal from p0 to p1, bulging `w` to each side. */
function petalBetween([x0, y0], [x1, y1], w) {
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const nx = (-dy / len) * w, ny = (dx / len) * w;
  const at = (t, s) => `${r2(x0 + dx * t + nx * s)} ${r2(y0 + dy * t + ny * s)}`;
  return `M ${r2(x0)} ${r2(y0)} C ${at(0.3, 1)}, ${at(0.7, 1)}, ${r2(x1)} ${r2(y1)} C ${at(0.7, -1)}, ${at(0.3, -1)}, ${r2(x0)} ${r2(y0)} Z`;
}

/** Closed wavy ring r(θ) = R + a·sin(waves·θ). */
function wavyRing(R, a, waves) {
  const steps = waves * 12;
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * 360;
    pts.push(pt(R + a * Math.sin((waves * t * Math.PI) / 180), t));
  }
  return `M ${pts.map((p) => p.join(' ')).join(' L ')} Z`;
}

/** Smooth curve through points (Catmull-Rom converted to cubic Béziers). */
function smoothPath(pts) {
  let d = `M ${pts[0].join(' ')}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [r2(p1[0] + (p2[0] - p0[0]) / 6), r2(p1[1] + (p2[1] - p0[1]) / 6)];
    const c2 = [r2(p2[0] - (p3[0] - p1[0]) / 6), r2(p2[1] - (p3[1] - p1[1]) / 6)];
    d += ` C ${c1.join(' ')}, ${c2.join(' ')}, ${p2.join(' ')}`;
  }
  return d;
}

// clipPath ids must be unique across every SVG inlined into the same book page.
let clipCounter = 0;

const placed = (angle, R, inner) => `<g transform="rotate(${r2(angle)}) translate(0 ${r2(-R)})">${inner}</g>`;

// ── Water droplets ──────────────────────────────────────────────────────────

/** Drops falling outward over pond ripples. */
export function waterDroplets({ n = 6, detail = false }) {
  const out = [];
  // Soft scalloped rim, like the edge of a splash.
  const rim = 222;
  out.push(...scallopBorder(rim, Math.round((2 * Math.PI * rim) / 30), 13));
  // Ripples, outermost first so each smaller ring sits on top. The innermost
  // ripple stays outside the drop tips so no thin slivers form around them.
  const ripples = detail ? [208, 195, 183] : [206, 188];
  ripples.forEach((R, i) => out.push(path(wavyRing(R, 5, n * 2 + (i % 2)), i === 0 ? 'm' : 'd')));
  // Main drops, tips outward as if falling away from the centre.
  const w = Math.min(36, ((2 * Math.PI * 98) / n) * 0.34);
  for (let i = 0; i < n; i++) {
    const a = (i * 360) / n;
    out.push(placed(a, 98, path(dropPath(w, w * 2.2))));
    if (detail) out.push(placed(a, 98, path(dropPath(w * 0.48, w * 1.05), 'd')));
  }
  out.push(path(wavyRing(70, 4, n), 'm'));
  if (detail) out.push(path(wavyRing(56, 3, n), 'd'));
  // Centre flower of little drops.
  const cd = detail ? 10 : 8;
  for (let i = 0; i < cd; i++) out.push(placed((i * 360) / cd, 30, path(dropPath(8, 24))));
  out.push(circle(0, 0, 24, 'b'));
  if (detail) out.push(circle(0, 0, 11, 'd'));
  return { extent: rim + 13, body: out.join('') };
}

// ── Lotus blooms (side view) ────────────────────────────────────────────────

/**
 * One lotus flower seen from the side, base toward the centre, opening outward.
 * Petals are deliberately broad and overlapping (a real lotus is cup-shaped);
 * narrow petals fanning from one point would read as a leaf, not a flower.
 */
function lotusBloom(s, detail) {
  const P = (x, y) => [x * s, y * s];
  const parts = [];
  if (detail) {
    parts.push(path(petalBetween(P(-0.08, 0.3), P(-0.64, 0.02), s * 0.2)), path(petalBetween(P(0.08, 0.3), P(0.64, 0.02), s * 0.2)));
  }
  parts.push(path(petalBetween(P(-0.04, 0.32), P(-0.46, -0.36), s * 0.26)), path(petalBetween(P(0.04, 0.32), P(0.46, -0.36), s * 0.26)));
  parts.push(path(petalBetween(P(0, 0.32), P(0, -0.6), s * 0.3)));
  if (detail) parts.push(line(0, 0.16 * s, 0, -0.36 * s, 'd'));
  // Little bowl the flower sits in.
  parts.push(path(`M ${r2(-0.3 * s)} ${r2(0.3 * s)} Q 0 ${r2(0.58 * s)} ${r2(0.3 * s)} ${r2(0.3 * s)} Q 0 ${r2(0.42 * s)} ${r2(-0.3 * s)} ${r2(0.3 * s)} Z`));
  return parts.join('');
}

/** A ring of side-view lotus flowers around a lotus rosette. */
export function lotusBlooms({ n = 6, detail = false }) {
  const out = [];
  const border = 246;
  if (detail) out.push(...scallopBorder(border, Math.round((2 * Math.PI * border) / 32), 14));
  else out.push(circle(0, 0, border));
  const s = Math.min(135, ((2 * Math.PI * 152) / n) * 0.82);
  for (let i = 0; i < n; i++) {
    out.push(placed((i * 360) / n, 152, lotusBloom(s, detail)));
    const [x, y] = pt(detail ? 200 : 185, (i * 360) / n + 180 / n);
    out.push(circle(x, y, detail ? 9 : 12));
  }
  const cells = n * 2;
  for (let i = 0; i < cells; i++) out.push(sector(76, 96, (i * 360) / cells, ((i + 1) * 360) / cells));
  const rp = detail ? 12 : 8;
  for (let i = 0; i < rp; i++) {
    const a = (i * 360) / rp;
    out.push(path(petalBetween(pt(16, a), pt(64, a), detail ? 9 : 12)));
  }
  out.push(circle(0, 0, 20, 'b'));
  return { extent: detail ? border + 14 : border, body: out.join('') };
}

// ── Shamrocks (St. Patrick) ─────────────────────────────────────────────────

/** Shamrock with its stem toward the centre; `leaves` = 4 gives a lucky clover. */
function shamrock(s, detail, leaves = 3) {
  const angles = leaves === 4 ? [45, 135, 225, 315] : [0, 120, 240];
  const parts = [`<path class="m n" d="M 0 ${r2(s * 0.1)} Q ${r2(s * 0.12)} ${r2(s * 0.55)} ${r2(s * 0.34)} ${r2(s * 0.85)}"/>`];
  for (const a of angles) {
    parts.push(`<g transform="rotate(${a}) translate(0 ${r2(-0.5 * s)})">${path(heartPath(s))}${detail ? line(0, 0.42 * s, 0, -0.12 * s, 'd') : ''}</g>`);
  }
  return parts.join('');
}

/** Ring of shamrocks and coins around a diamond band; the detailed version hides one four-leaf clover. */
export function shamrocks({ n = 6, detail = false }) {
  const out = [];
  const border = 244;
  if (detail) out.push(...scallopBorder(border, Math.round((2 * Math.PI * border) / 32), 14));
  else out.push(circle(0, 0, border));
  const s = Math.min(62, ((2 * Math.PI * 165) / n) * 0.36);
  for (let i = 0; i < n; i++) {
    const a = (i * 360) / n;
    out.push(placed(a, 165, shamrock(s, detail, detail && i === Math.floor(n / 3) ? 4 : 3)));
    const [x, y] = pt(detail ? 205 : 200, a + 180 / n);
    out.push(circle(x, y, detail ? 12 : 15));
    if (detail) out.push(circle(x, y, 6, 'd'));
  }
  // Diamond band.
  const dn = n * 2;
  for (let i = 0; i < dn; i++) {
    const a = (i * 360) / dn, h = 180 / dn;
    out.push(polygon([pt(92, a), pt(106, a + h), pt(120, a), pt(106, a - h)]));
  }
  out.push(circle(0, 0, 80, 'd n'));
  out.push(shamrock(detail ? 34 : 40, detail));
  return { extent: detail ? border + 14 : border, body: out.join('') };
}

// ── Fibonacci sunflower ─────────────────────────────────────────────────────

/**
 * Sunflower head built like the real thing: seed k sits at radius c·√k and
 * angle k·137.5° (the golden angle). Joining every F-th seed, for two
 * neighbouring Fibonacci numbers F, traces the two families of spirals you can
 * see in a sunflower; their crossings make the colourable cells. The petal
 * count is a Fibonacci number too.
 */
export function fibonacci({ seeds = 110, spirals = [8, 13], petals = 21, detail = false }) {
  const out = [];
  const Rs = 138;
  const c = Rs / Math.sqrt(seeds);
  const GOLDEN = 137.50776;
  const seed = (k) => pt(c * Math.sqrt(k), k * GOLDEN);
  // Petals behind the seed head.
  const layers = detail ? [[petals, 102, 0.5], [petals, 78, 0]] : [[petals, 92, 0]];
  for (const [count, len, offset] of layers) {
    const w = ((2 * Math.PI * Rs) / count) * 0.55;
    for (let i = 0; i < count; i++) {
      const a = ((i + offset) * 360) / count;
      out.push(path(petalBetween(pt(Rs - 12, a), pt(Rs + len, a), w)));
    }
  }
  out.push(circle(0, 0, Rs + 2, 'b'));
  // Parastichy spirals through the seeds. Each spiral runs a little past the
  // rim and is clipped to it, so every spiral ends cleanly on the edge.
  const kMin = Math.round(Math.max(seeds * 0.06, spirals[0] * 1.3));
  const clipId = `fib-clip-${++clipCounter}`;
  const lines = [];
  for (const F of spirals) {
    for (let j = 0; j < F; j++) {
      const chain = [];
      for (let k = kMin + j; k <= seeds + 2 * F; k += F) chain.push(seed(k));
      if (chain.length > 1) lines.push(`<path class="d n" d="${smoothPath(chain)}"/>`);
    }
  }
  out.push(`<clipPath id="${clipId}"><circle cx="0" cy="0" r="${Rs + 1}"/></clipPath><g clip-path="url(#${clipId})">${lines.join('')}</g>`);
  const coreR = c * Math.sqrt(kMin) + 3;
  out.push(circle(0, 0, coreR, 'b'));
  if (detail) out.push(circle(0, 0, coreR * 0.5, 'd'));
  const extent = Rs + Math.max(...layers.map((l) => l[1]));
  return { extent, body: out.join('') };
}

export const FAMILIES = {
  petalRings, traditionalFloral, dotMandala, lotus, hearts, sunAndStars, geometric, paws,
  waterDroplets, lotusBlooms, shamrocks, fibonacci,
};

/**
 * Line weights in points for each difficulty. Thick lines and big shapes for
 * the youngest colourers; finer lines for the detailed designs.
 */
export const LINE_WEIGHTS = {
  simple: { m: 3.4, d: 2.2, b: 4.4 },
  medium: { m: 2.4, d: 1.5, b: 3.2 },
  detailed: { m: 1.7, d: 1.05, b: 2.3 },
};

// A <style> inside an inline SVG applies to the whole HTML document, so each
// SVG's rules are scoped to its own id; otherwise the last design's stroke
// widths would win for every design on the page.
let svgCounter = 0;

/**
 * Render a design as a standalone SVG whose outer radius fills the viewBox.
 * @param {number} sizeIn printed width of the SVG in inches (sets physical stroke weight)
 * @param {{ stroke?: string }} [options] line colour (black for the interior)
 */
export function renderSvg(family, params, level, sizeIn, { stroke = '#000' } = {}) {
  const { extent, body } = FAMILIES[family](params);
  const half = 300;
  const scale = (half - 6) / extent;
  const unitsPerPt = (2 * half) / (sizeIn * 72);
  const w = LINE_WEIGHTS[level];
  const sw = (ptw) => r2((ptw * unitsPerPt) / scale);
  const id = `mandala-${++svgCounter}`;
  const s = `#${id}`;
  const style = `${s} *{fill:#fff;stroke:${stroke};stroke-linejoin:round;stroke-linecap:round}${s} .n{fill:none}`
    + `${s} .m{stroke-width:${sw(w.m)}}${s} .d{stroke-width:${sw(w.d)}}${s} .b{stroke-width:${sw(w.b)}}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" id="${id}" viewBox="${-half} ${-half} ${2 * half} ${2 * half}" width="${sizeIn}in" height="${sizeIn}in">`
    + `<style>${style}</style><g transform="scale(${r2(scale)})">${body}</g></svg>`;
}
