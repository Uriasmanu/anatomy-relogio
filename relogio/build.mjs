import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";
import { kitScript } from "./scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const OUT = theme === "light" ? "relogio-light.html" : "relogio.html";
const WIDTH = 900;
const HEIGHT = 840;
const TAU = Math.PI * 2;
const rad = (d) => (d * Math.PI) / 180;

const M = 1.15;
const clockVec = (deg, d) => [Math.sin(rad(deg)) * d, -Math.cos(rad(deg)) * d];
const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
const O = [0, 0];
const BAR = add2(O, clockVec(300, (M * 90) / 2));
const THIRD = add2(O, clockVec(60, (M * 90) / 2));
const FOURTH = add2(THIRD, clockVec(190, (M * 85) / 2));
const ESC = add2(FOURTH, clockVec(250, (M * 102) / 2));
const dirTo = (a, b) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy);
  return [dx / l, dy / l];
};
const LEVER = add2(ESC, clockVec(185, 24));
const BAL = add2(LEVER, clockVec(185, 28));
const midFO = [FOURTH[0] / 2, FOURTH[1] / 2];
const nFO = [-FOURTH[1], FOURTH[0]];
const lFO = Math.hypot(...nFO);
const hApex = Math.sqrt(34.5 * 34.5 - (Math.hypot(...FOURTH) / 2) ** 2);
const IDLER = [midFO[0] + (nFO[0] / lFO) * hApex * -1, midFO[1] + (nFO[1] / lFO) * hApex * -1];
const MINW = add2(O, clockVec(310, M * 24));
const M2 = (M * 24) / 25;

const R_PLATE = 150;
const R_DIAL_IN = 140;
const R_DIAL_OUT = 152;

const ASM = [
  { id: "bezel", name: "Lunete e vidro", does: "Anel de aço que prende o vidro de safira sobre o mostrador. É a primeira peça a sair e protege os ponteiros do pó e dos riscos.", lift: 168 },
  { id: "hands", name: "Ponteiros", does: "Horas, minutos e segundos centrais. Cada um é preso a uma ponta de eixo da rodagem. O dos segundos dá oito pequenos saltos por segundo, um a cada batida do balanço.", lift: 144 },
  { id: "dial", name: "Mostrador esqueleto", does: "Anel com os índices e a minuteria de 60 pontos. É vazado para que o movimento fique à mostra.", lift: 122 },
  { id: "motion", name: "Minuteria", does: "Engrenagens que reduzem 12 para 1: o ponteiro dos minutos dá 12 voltas enquanto o das horas dá uma. Deslizam por fricção para ajustar a hora sem mexer no resto.", lift: 100 },
  { id: "cock", name: "Ponte do balanço", does: "Segura o eixo do balanço por cima e prende a ponta externa da mola espiral. A raquete ajusta o comprimento útil da mola e, com ele, o adiantamento.", lift: 84 },
  { id: "balance", name: "Balanço e mola espiral", does: "Volante que oscila 4 vezes por segundo (28.800 alternâncias por hora). A mola espiral o puxa de volta ao centro. É o pêndulo do relógio: a frequência dele define a hora.", lift: 68 },
  { id: "bridges", name: "Pontes e catraca", does: "Prendem as engrenagens por cima e abrigam os rubis onde giram os pivôs. A catraca com a lingueta impede a mola principal de desenrolar.", lift: 52 },
  { id: "escape", name: "Escapamento", does: "Âncora de rubis que trava e libera um dente da roda de escape a cada batida. Cada liberação deixa a rodagem avançar um passo e dá um impulso ao balanço.", lift: 38 },
  { id: "train", name: "Rodagem", does: "Cadeia de engrenagens que reduz a velocidade: a roda central dá 1 volta por hora, a dos segundos 1 por minuto e a de escape 16 por minuto.", lift: 24 },
  { id: "barrel", name: "Barrilete e mola principal", does: "Tambor com a mola principal: guarda a energia e a entrega devagar. Uma volta do barrilete dura cerca de 8 horas e a reserva de marcha é de cerca de 40 horas.", lift: 10 },
  { id: "plate", name: "Platina", does: "Base onde todas as peças se apoiam. Os mancais dos pivôs são rubis, que reduzem o atrito e o desgaste.", lift: 0 },
  { id: "rotor", name: "Massa oscilante", does: "Semicírculo pesado que gira livre com os movimentos do pulso e enrola a mola do barrilete por engrenagens redutoras. Fica por baixo da platina e só se vê desmontado.", lift: -52 },
  { id: "back", name: "Fundo com vidro", does: "Fundo de aço com vidro que deixa ver o movimento pelo lado de trás. É preso por parafusos e veda a caixa.", lift: -96 },
  { id: "case", name: "Caixa e coroa", does: "Carrura com as hastes que prendem a pulseira. A coroa dá corda e, puxada, ajusta a hora (e para o balanço para acertar o segundo).", lift: 0 },
];
const ORDER = ["bezel", "hands", "dial", "motion", "cock", "balance", "bridges", "escape", "train", "barrel", "rotor", "back"];
const ID = Object.fromEntries(ASM.map((a, i) => [a.id, i]));

const BOXES = [
  [-175, -175, -20, 175, 175, -10, "back"],
  [-175, -175, -12, 175, 175, 4, "rotor"],
  [-175, -175, -10, 175, 175, 8, "case"],
  [-150, -150, 0, 150, 150, 60, "plate"],
  [-150, -150, 0, 150, 150, 40, "bezel"],
].map(([x0, y0, z0, x1, y1, z1, id]) => ({ x0, y0, z0, x1, y1, z1, lift: ASM[ID[id]].lift }));
const fitPoints = BOXES.flatMap((b) =>
  [0, 1].flatMap((s) => k.boxCorners({ x: b.x0, y: b.y0, w: b.x1 - b.x0, d: b.y1 - b.y0, r: 0 }, b.z0 + b.lift * s, b.z1 + b.lift * s)),
);
fitPoints.push([185, 0, -10], [-185, 0, -10]);
const P = k.fitProjection(fitPoints, WIDTH, HEIGHT, { pad: 20, azimuth: 30, elevation: 40 });

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const seg = (a, b) => k.segment(a, b, P);
const V = G.viewOf(P);
const frameZ = (x, y, z) => G.frameAlong([x, y, z], [0, 0, 1]);
const frameX = (x, y, z) => G.frameAlong([x, y, z], [1, 0, 0]);

function planRot(iso, P, cx, cy, z, deg) {
  const s0 = iso([cx, cy, z], P);
  const o = iso([0, 0, 0], P);
  const e1 = iso([1, 0, 0], P);
  const e2 = iso([0, 1, 0], P);
  const a = e1[0] - o[0];
  const b = e1[1] - o[1];
  const c = e2[0] - o[0];
  const d = e2[1] - o[1];
  const det = a * d - b * c;
  const t = (deg * Math.PI) / 180;
  const cs = Math.cos(t);
  const sn = Math.sin(t);
  const r00 = cs;
  const r01 = -sn;
  const r10 = sn;
  const r11 = cs;
  const m00 = a * r00 + c * r10;
  const m01 = a * r01 + c * r11;
  const m10 = b * r00 + d * r10;
  const m11 = b * r01 + d * r11;
  const i00 = d / det;
  const i01 = -c / det;
  const i10 = -b / det;
  const i11 = a / det;
  const A = m00 * i00 + m01 * i10;
  const B = m10 * i00 + m11 * i10;
  const C = m00 * i01 + m01 * i11;
  const D = m10 * i01 + m11 * i11;
  const e = s0[0] - (A * s0[0] + C * s0[1]);
  const f = s0[1] - (B * s0[0] + D * s0[1]);
  const r = (v) => Math.round(v * 1000) / 1000;
  return `matrix(${r(A)} ${r(B)} ${r(C)} ${r(D)} ${r(e)} ${r(f)})`;
}
const rotAt = (cx, cy, z, deg) => planRot(k.iso, P, cx, cy, z, deg);

const items = [];
const put = (asm, z, point, svg, bias = 0) => items.push({ asm, key: z * 10 + (k.depthOf(point, P) + bias) * 0.001, svg });

const polar = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
function capsule(a, b, w) {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const pts = [];
  for (let i = 0; i <= 8; i++) pts.push(polar(b[0], b[1], w / 2, ang - Math.PI / 2 + (Math.PI * i) / 8));
  for (let i = 0; i <= 8; i++) pts.push(polar(a[0], a[1], w / 2, ang + Math.PI / 2 + (Math.PI * i) / 8));
  return pts;
}
const gearRing = (Z, mod, tip = 1, root = 1.25) => {
  const rp = (mod * Z) / 2;
  const ra = rp + mod * tip;
  const rr = rp - mod * root;
  const p = TAU / Z;
  const pts = [];
  for (let i = 0; i < Z; i++) {
    const c = i * p;
    pts.push(polar(0, 0, rr, c - 0.46 * p), polar(0, 0, ra, c - 0.2 * p), polar(0, 0, ra, c + 0.2 * p), polar(0, 0, rr, c + 0.46 * p));
  }
  return pts;
};
const shifted = (ring, c) => ring.map(([x, y]) => [x + c[0], y + c[1]]);
const ratchetRing = (Z, r0, r1) => {
  const p = TAU / Z;
  const pts = [];
  for (let i = 0; i < Z; i++) pts.push(polar(0, 0, r1, i * p), polar(0, 0, r0, i * p + 0.12 * p), polar(0, 0, r0, (i + 1) * p - 0.02 * p));
  return pts;
};
const escapeRing = (Z, r0, r1) => {
  const p = TAU / Z;
  const pts = [];
  for (let i = 0; i < Z; i++) pts.push(polar(0, 0, r0, i * p - 0.12 * p), polar(0, 0, r1, i * p + 0.05 * p), polar(0, 0, r1 - 0.4, i * p + 0.2 * p), polar(0, 0, r0, i * p + 0.56 * p));
  return pts;
};
const gearTable = [];
function gear(spec) {
  const { id, asm, Z, mod = M, c, z, h = 2.4, tone = "hi", arbor, ratio, off = 0, ring, spokes = 5, hub = 0.16, rimline = 0.8, extra = "" } = spec;
  const outline = ring || gearRing(Z, mod);
  const body = k.extrude(shifted(outline, c), z, h, P, { convex: false });
  const rp = (mod * Z) / 2;
  const top = z + h;
  const lines = [];
  if (spokes) {
    const r0 = rp * hub;
    const r1 = rp * rimline;
    const gap = Math.max(0.05, 1.6 / r1);
    for (let i = 0; i < spokes; i++) {
      const a0 = (TAU * i) / spokes + gap + 0.3;
      const a1 = (TAU * (i + 1)) / spokes - gap + 0.3;
      const win = [];
      const n = 10;
      for (let j = 0; j <= n; j++) win.push(polar(c[0], c[1], r1, a0 + ((a1 - a0) * j) / n));
      for (let j = n; j >= 0; j--) win.push(polar(c[0], c[1], r0, a0 + ((a1 - a0) * j) / n));
      lines.push(k.onTop(win, top, P, true));
    }
  }
  const svg = S(body, { tone, crease: "lo", inner: L(lines.join(""), { tone: "faint" }) }) + extra;
  gearTable.push({ id, cx: c[0], cy: c[1], z: z + h / 2, off, arbor, ratio });
  put(asm, top, [c[0], c[1], top], `<g data-gear="${id}" transform="${rotAt(c[0], c[1], z + h / 2, off)}">${svg}</g>`, 0);
}
const jewels = [];
const jewel = (asm, z, p, r = 1.9) => {
  const [x, y] = at([p[0], p[1], z]);
  put(asm, z + 0.5, [p[0], p[1], z], `<circle class="jw-ring" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 1.5).toFixed(1)}"/><circle class="jw" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"/>`, 1);
  jewels.push(p);
};
const screw = (asm, z, p, r = 3.2, a = 0.5) => {
  const out = [L(k.ring(p[0], p[1], r, z, P, 18), { tone: "mid" }), L(k.lineOnTop(polar(p[0], p[1], r, a), polar(p[0], p[1], r, a + Math.PI), z, P), { tone: "mid" })];
  put(asm, z + 0.5, [p[0], p[1], z], out.join(""), 2);
};
const poly = (pts, z, h, style, bevel = 0, convex = true) => S(k.extrude(pts, z, h, P, { convex, bevel }), style);
const ringSolid = (z, h, rIn, rOut, steps = 96, c = [0, 0]) => G.ringBand(0, h, rIn, rOut, frameZ(c[0], c[1], z), P, { steps, hole: [h, rIn] });

const mesh = (A, B) => {
  const phi = Math.atan2(B.c[1] - A.c[1], B.c[0] - A.c[0]);
  const fA = (((phi - A.off) * A.Z) / TAU) % 1;
  const target = 0.5 - (fA < 0 ? fA + 1 : fA);
  return phi + Math.PI - (target * TAU) / B.Z;
};
const deg = (r) => (((r * 180) / Math.PI) % 360 + 360) % 360;

function movement() {
  const g = {};
  const def = (id, o) => (g[id] = { Z: o.Z, c: o.c, off: o.off || 0 });
  def("barrel", { Z: 80, c: BAR });
  def("cwheel", { Z: 80, c: O });
  def("w3", { Z: 75, c: THIRD });
  def("w4", { Z: 96, c: FOURTH });
  def("q", { Z: 30, c: FOURTH });
  def("cannon", { Z: 12, c: O });
  def("mp", { Z: 10, c: MINW });
  g.cpin = { Z: 10, c: O, off: mesh(g.barrel, { Z: 10, c: O }) };
  g.p3 = { Z: 10, c: THIRD, off: mesh(g.cwheel, { Z: 10, c: THIRD }) };
  g.p4 = { Z: 10, c: FOURTH, off: mesh(g.w3, { Z: 10, c: FOURTH }) };
  g.pe = { Z: 6, c: ESC, off: mesh(g.w4, { Z: 6, c: ESC }) };
  g.idler = { Z: 30, c: IDLER, off: mesh(g.q, { Z: 30, c: IDLER }) };
  g.cs = { Z: 30, c: O, off: mesh(g.idler, { Z: 30, c: O }) };
  g.mw = { Z: 36, c: MINW, off: mesh(g.cannon, { Z: 36, c: MINW }) };
  g.hw = { Z: 40, c: O, off: mesh(g.mp, { Z: 40, c: O }) };
  const D = (id) => deg(g[id].off);

  const mid = BAR;
  gear({ id: "barrel", asm: "barrel", Z: 80, c: BAR, z: 3, h: 2.4, arbor: "B", ratio: -1 / 8, off: D("barrel"), spokes: 0, tone: "mid" });
  gear({ id: "cpin", asm: "train", Z: 10, c: O, z: 3, h: 3, tone: "mid", arbor: "C", ratio: 1, off: D("cpin"), spokes: 0 });
  gear({ id: "cwheel", asm: "train", Z: 80, c: O, z: 10, h: 2.4, arbor: "C", ratio: 1, off: D("cwheel"), spokes: 6 });
  gear({ id: "p3", asm: "train", Z: 10, c: THIRD, z: 10, h: 2.4, tone: "mid", arbor: "T", ratio: -8, off: D("p3"), spokes: 0 });
  gear({ id: "w3", asm: "train", Z: 75, c: THIRD, z: 14, h: 2.4, arbor: "T", ratio: -8, off: D("w3"), spokes: 6 });
  gear({ id: "p4", asm: "train", Z: 10, c: FOURTH, z: 14, h: 2.4, tone: "mid", arbor: "F", ratio: 60, off: D("p4"), spokes: 0 });
  gear({ id: "w4", asm: "train", Z: 96, c: FOURTH, z: 18, h: 2.4, arbor: "F", ratio: 60, off: D("w4"), spokes: 7 });
  gear({ id: "q", asm: "train", Z: 30, c: FOURTH, z: 21, h: 2, arbor: "F", ratio: 60, off: D("q"), spokes: 4, tone: "mid" });
  gear({ id: "idler", asm: "train", Z: 30, c: IDLER, z: 21, h: 2, arbor: "I", ratio: -60, off: D("idler"), spokes: 4, tone: "mid" });
  gear({ id: "cs", asm: "train", Z: 30, c: O, z: 21, h: 2, arbor: "S", ratio: 60, off: D("cs"), spokes: 4, tone: "mid" });
  gear({ id: "pe", asm: "escape", Z: 6, c: ESC, z: 18, h: 2.4, tone: "mid", arbor: "E", ratio: -960, off: D("pe"), spokes: 0 });
  const aLever = Math.atan2(LEVER[1] - ESC[1], LEVER[0] - ESC[0]);
  gear({ id: "ewheel", asm: "escape", Z: 15, c: ESC, z: 22, h: 2.4, ring: escapeRing(15, 10.2, 15.2), arbor: "E", ratio: -960, off: deg(aLever + rad(33)), spokes: 5, hub: 0.2, rimline: 0.62, tone: "hi" });
  gear({ id: "cannon", asm: "motion", Z: 12, c: O, z: 33, h: 2.4, tone: "mid", arbor: "Cd", ratio: 1, off: D("cannon"), spokes: 0 });
  gear({ id: "mw", asm: "motion", Z: 36, c: MINW, z: 33, h: 2.4, arbor: "M", ratio: -1 / 3, off: D("mw"), spokes: 5 });
  gear({ id: "mp", asm: "motion", Z: 10, c: MINW, z: 36.5, h: 2.4, tone: "mid", arbor: "M", ratio: -1 / 3, off: D("mp"), spokes: 0 });
  gear({ id: "hw", asm: "motion", Z: 40, mod: M2, c: O, z: 36.5, h: 2.4, arbor: "H", ratio: 1 / 12, off: D("hw"), spokes: 6 });
  void mid;
}

function plate() {
  const RING_IN = 126;
  const svg = [`<path class="iso-halo" d="${k.haloOf({ x: -R_PLATE, y: -R_PLATE, w: 2 * R_PLATE, d: 2 * R_PLATE, r: R_PLATE }, -2, 2, P)}" style="filter:blur(8px)"/>`];
  svg.push(S(ringSolid(-2, 2, RING_IN, R_PLATE - 4, 120), { tone: "lo", crease: "lo" }));
  const pivots = [O, BAR, THIRD, FOURTH, ESC, LEVER, BAL, IDLER];
  const arms = [];
  for (const p of pivots) {
    const a = Math.atan2(p[1] || 0.001, p[0] || 1);
    const foot = polar(0, 0, RING_IN + 1, a + (p === O ? rad(-30) : 0));
    arms.push(poly(capsule(p, foot, 10), -2, 2, { tone: "lo", crease: "lo" }, 0.3));
    arms.push(poly(circleRing(p, 9, 22), -2, 2, { tone: "lo", crease: "lo" }, 0.3));
  }
  svg.push(arms.join(""));
  const stripes = [];
  for (let a = 0; a < 360; a += 6) stripes.push(seg([...polar(0, 0, RING_IN, rad(a)), 0], [...polar(0, 0, R_PLATE - 4, rad(a)), 0]));
  svg.push(L(stripes.join(""), { tone: "faint" }));
  svg.push(L(k.ring(0, 0, R_PLATE - 4, 0, P, 96) + k.ring(0, 0, RING_IN, 0, P, 96), { tone: "lo" }));
  put("plate", 0, [0, 0, 0], svg.join(""), 0);
  for (const p of pivots) jewel("plate", 0, p, 1.7);
}

function barrel() {
  const out = [S(k.cylinder(BAR[0], BAR[1], 38, 5.4, 3.6, P, 72, 0.4), { tone: "mid", crease: "lo" })];
  out.push(L(k.ring(BAR[0], BAR[1], 34, 9, P, 64), { tone: "lo" }));
  out.push(`<g data-spring>${springSvg(0.8)}</g>`);
  out.push(S(k.cylinder(BAR[0], BAR[1], 7, 9, 2, P, 28, 0.3), { tone: "hi", crease: "lo" }));
  put("barrel", 11, [BAR[0], BAR[1], 11], out.join(""), 1);
}
function springSvg(w) {
  const r0 = 8;
  const r1 = 12 + w * 22;
  const turns = 8;
  const pts = [];
  const N = 220;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = turns * TAU * t;
    pts.push([BAR[0] + (r0 + (r1 - r0) * t) * Math.cos(a), BAR[1] + (r0 + (r1 - r0) * t) * Math.sin(a), 9.1]);
  }
  const outer = [];
  for (let i = 0; i <= 90; i++) {
    const t = i / 90;
    const a = 3 * TAU * t + 1;
    const rr = 33.5 - t * (33.5 - Math.max(r1 + 2, 18)) * 0.6;
    outer.push([BAR[0] + rr * Math.cos(a), BAR[1] + rr * Math.sin(a), 9.1]);
  }
  return L(k.pathOf(pts.map(at)), { tone: "hi" }) + L(k.pathOf(outer.map(at)), { tone: "mid" });
}

function lever() {
  const a = Math.atan2(BAL[1] - LEVER[1], BAL[0] - LEVER[0]);
  const aE = Math.atan2(ESC[1] - LEVER[1], ESC[0] - LEVER[0]);
  const z = 24;
  const out = [];
  const tip = polar(LEVER[0], LEVER[1], 24.5, a);
  out.push(poly(capsule(LEVER, tip, 4.4), z, 2.2, { tone: "hi", crease: "lo" }, 0.3));
  for (const s of [-1, 1]) {
    const hornBase = polar(LEVER[0], LEVER[1], 21.5, a);
    const horn = polar(hornBase[0], hornBase[1], 4, a + s * 0.6);
    out.push(poly(capsule(hornBase, horn, 1.8), z, 2.2, { tone: "hi", crease: "lo" }));
  }
  const palletTips = [];
  for (const s of [-1, 1]) {
    const tipP = polar(LEVER[0], LEVER[1], 17, aE + s * 0.9);
    out.push(poly(capsule(LEVER, tipP, 4), z, 2.2, { tone: "hi", crease: "lo" }, 0.3));
    palletTips.push(tipP);
  }
  out.push(poly(capsule(LEVER, polar(LEVER[0], LEVER[1], 9, a + Math.PI), 4), z, 2.2, { tone: "mid", crease: "lo" }));
  const stones = palletTips.map((p) => poly(capsule(p, polar(p[0], p[1], 3.6, aE + Math.PI / 2), 2.4), z + 0.2, 2.2, { tone: "hi", crease: "lo" }));
  put("escape", z + 2.2, [LEVER[0], LEVER[1], z + 2.2], `<g data-lever transform="${rotAt(LEVER[0], LEVER[1], z + 1, 0)}">${out.join("")}${stones.join("")}${k.dotsSvg(palletTips.map((p) => at([p[0], p[1], z + 2.4])), { size: 0.9, tone: "hi" })}</g>`, 4);
}

function balance() {
  const z = 28;
  const R_OUT = 28;
  const out = [];
  out.push(`<g data-balance transform="${rotAt(BAL[0], BAL[1], z + 1.5, 0)}">`);
  out.push(S(ringSolid(z, 3, 25, R_OUT, 64, BAL), { tone: "hi", crease: "lo" }));
  const bal = BAL;
  for (let i = 0; i < 3; i++) {
    const a = rad(90 + 120 * i);
    out.push(poly(capsule(bal, polar(bal[0], bal[1], R_OUT - 2, a), 3.8), z, 2.4, { tone: "hi", crease: "lo" }, 0.3));
  }
  out.push(S(k.cylinder(bal[0], bal[1], 5, z, 4.2, P, 28, 0.3), { tone: "mid", crease: "lo" }));
  const screws = [];
  for (let i = 0; i < 16; i++) screws.push(at([...polar(bal[0], bal[1], 28.4, rad(22.5 * i)), z + 3]));
  out.push(k.dotsSvg(screws, { size: 0.7, tone: "hi" }));
  const wts = [];
  for (const a of [45, 135, 225, 315]) wts.push(at([...polar(bal[0], bal[1], 28.4, rad(a)), z + 3.2]));
  out.push(k.dotsSvg(wts, { size: 1.5, tone: "mid" }));
  out.push("</g>");
  put("balance", z + 4.2, [bal[0], bal[1], z + 3], out.join(""), 0);
  const roller = [S(k.cylinder(bal[0], bal[1], 5.4, 24, 2.2, P, 28, 0.2), { tone: "mid", crease: "lo" })];
  const imp = at([bal[0] + 3.6, bal[1], 26.2]);
  put("balance", 26.2, [bal[0], bal[1], 26.2], `<g data-roller transform="${rotAt(bal[0], bal[1], 25, 0)}">${roller.join("")}<circle class="jw" cx="${imp[0].toFixed(1)}" cy="${imp[1].toFixed(1)}" r="1.3"/></g>`, 3);
  put("balance", z + 3.5, [bal[0], bal[1], z + 3.5], `<path data-hair class="iso-line" data-tone="mid" d="${hairPath(0)}" style="stroke-width:.55"/>`, 6);
}
function hairPath(theta) {
  const pts = [];
  const N = 140;
  const turns = 11;
  const r0 = 5.8;
  const r1 = 24.8;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = turns * TAU * t + rad(theta) * (1 - t);
    const r = r0 + (r1 - r0) * t * (1 + 0.012 * Math.sin(rad(theta)));
    pts.push(at([BAL[0] + r * Math.cos(a), BAL[1] + r * Math.sin(a), 28 + 3.3]));
  }
  return k.pathOf(pts);
}

function bridges() {
  const z = 28;
  const h = 3.2;
  const st = { tone: "mid", crease: "lo" };
  const trainBridge = [
    [O, THIRD],
    [THIRD, FOURTH],
    [FOURTH, ESC],
  ].map(([a, b]) => poly(capsule(a, b, 13), z, h, st, 0.5));
  const lobe = [O, THIRD, FOURTH, ESC].map((p) => poly(circleRing(p, 8.5), z, h, st, 0.5));
  put("bridges", z + h, [20, 20, z + h], lobe.join("") + trainBridge.join(""), 0);
  const eBridge = [poly(capsule(O, polar(0, 0, 40, rad(-150)), 12), z, h, st, 0.5), poly(circleRing(polar(0, 0, 40, rad(-150)), 7), z, h, st, 0.5)];
  put("bridges", z + h, [-20, -20, z + h], eBridge.join(""), -5);
  const bb = [poly(capsule(BAR, add2(BAR, [10, -6]), 13), z, h, st, 0.5), poly(circleRing(BAR, 9), z, h, st, 0.5), poly(capsule(BAR, add2(BAR, clockVec(180, 30)), 11), z, h, st, 0.5)];
  put("bridges", z + h, [BAR[0], BAR[1], z + h], bb.join(""), -3);
  const lb = [poly(capsule(LEVER, polar(LEVER[0], LEVER[1], 20, rad(160)), 10), z, h, st, 0.5), poly(circleRing(LEVER, 7), z, h, st, 0.5)];
  put("bridges", z + h, [LEVER[0], LEVER[1], z + h], lb.join(""), 2);
  for (const p of [O, THIRD, FOURTH, ESC, BAR, LEVER]) jewel("bridges", z + h, p);
  for (const [p, a] of [[polar(0, 0, 40, rad(-150)), 0.3], [add2(BAR, clockVec(180, 30)), 1.1], [polar(LEVER[0], LEVER[1], 20, rad(160)), 0.7]]) screw("bridges", z + h, p, 3, a);
  const rz = z + h;
  const rat = [S(k.extrude(shifted(ratchetRing(36, 11, 14.5), add2(BAR, [10, -6])), rz, 2.4, P, { convex: false }), { tone: "hi", crease: "lo" })];
  rat.push(L(k.ring(BAR[0] + 10, BAR[1] - 6, 9, rz + 2.4, P, 36), { tone: "faint" }));
  put("bridges", rz + 2.4, [BAR[0] + 10, BAR[1] - 6, rz + 2.4], rat.join(""), 6);
  const click = poly(capsule(add2(BAR, [24, -18]), add2(BAR, [14, -16]), 3), rz, 2.2, st);
  put("bridges", rz + 2.2, [BAR[0] + 20, BAR[1] - 18, rz + 2], click, 7);
}
function circleRing(c, r, n = 20) {
  return Array.from({ length: n }, (_, i) => polar(c[0], c[1], r, (TAU * i) / n));
}

function cock() {
  const z = 34;
  const h = 3.2;
  const st = { tone: "mid", crease: "lo" };
  const a1 = add2(BAL, [-38, -4]);
  const a2 = add2(BAL, [36, 10]);
  const arms = [poly(capsule(BAL, a1, 12), z, h, st, 0.5), poly(capsule(BAL, a2, 12), z, h, st, 0.5), poly(circleRing(BAL, 10), z, h, st, 0.5), poly(circleRing(a1, 7), z, h, st, 0.5), poly(circleRing(a2, 7), z, h, st, 0.5)];
  put("cock", z + h, [BAL[0], BAL[1], z + h], arms.join(""), 0);
  const reg = poly(capsule(add2(BAL, [-14, 18]), add2(BAL, [-30, 30]), 5), z + h, 1.6, { tone: "hi", crease: "lo" });
  put("cock", z + h + 1.6, [BAL[0] - 20, BAL[1] + 24, z + h + 1.6], reg, 2);
  jewel("cock", z + h, BAL, 2.1);
  screw("cock", z + h, a1, 3, 0.4);
  screw("cock", z + h, a2, 3, 1.0);
  put("cock", z + h, [BAL[0], BAL[1], z + h], L(k.lineOnTop(add2(BAL, [-14, 18]), add2(BAL, [-30, 30]), z + h + 1.7, P), { tone: "lo" }), 3);
}

function dial() {
  const z = 36;
  const out = [S(ringSolid(z, 2.2, R_DIAL_IN, R_DIAL_OUT, 120), { tone: "mid", crease: "lo" })];
  const dots = [];
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) continue;
    dots.push(at([...polar(0, 0, R_DIAL_OUT - 2.6, rad(i * 6)), z + 2.2]));
  }
  out.push(k.dotsSvg(dots, { size: 0.65, tone: "hi" }));
  for (let i = 0; i < 12; i++) {
    const a = rad(i * 30 - 90);
    const big = i % 3 === 0;
    const r0 = R_DIAL_IN + 1.6;
    const r1 = R_DIAL_OUT - 5.4;
    const w = big ? 5 : 3.2;
    const p0 = polar(0, 0, r0, a);
    const p1 = polar(0, 0, r1, a);
    out.push(poly(capsule(p0, p1, w), z + 2.2, 1.6, { tone: "hi", crease: "lo" }, 0));
  }
  put("dial", z + 2.2, [0, 0, z + 2.2], out.join(""), -50);
}

function hands() {
  const st = { tone: "hi", crease: "lo" };
  const hour = [[0, 9], [-4.2, 0], [-2.6, -42], [0, -66], [2.6, -42], [4.2, 0]];
  const minute = [[0, 10], [-3, 0], [-2, -82], [0, -119], [2, -82], [3, 0]];
  const mk = (pts, z, h, id) => `<g data-hand="${id}" transform="${rotAt(0, 0, z, 0)}">${poly(pts, z, h, st, 0.3)}</g>`;
  put("hands", 44, [0, 0, 44], mk(hour, 42, 1.8, "hour"), 0);
  put("hands", 47, [0, 0, 47], mk(minute, 45, 1.8, "min"), 1);
  const sec = [];
  sec.push(poly([[-0.6, 26], [-0.6, -126], [0.6, -126], [0.6, 26]], 48, 1.2, { tone: "hi", crease: "none" }));
  sec.push(poly(circleRing([0, 26], 3.2, 16), 48, 1.2, { tone: "hi", crease: "lo" }));
  sec.push(poly(circleRing([0, -92], 3.8, 16), 48, 1.2, { tone: "hi", crease: "lo" }));
  put("hands", 49, [0, 0, 49], `<g data-hand="sec" transform="${rotAt(0, 0, 48, 0)}">${sec.join("")}</g>`, 2);
  put("hands", 50.5, [0, 0, 51], S(k.cylinder(0, 0, 5.2, 49.2, 1.8, P, 28, 0.3), { tone: "hi", crease: "lo" }), 3);
}

function rotor() {
  const z = -8;
  const rotorPts = [];
  const R = 104;
  const r = 20;
  for (let i = 0; i <= 40; i++) rotorPts.push(polar(0, 0, R, Math.PI * (i / 40)));
  for (let i = 40; i >= 0; i--) rotorPts.push(polar(0, 0, r, Math.PI * (i / 40)));
  const out = [`<g data-rotor transform="${rotAt(0, 0, z + 2, 0)}">`];
  out.push(S(k.extrude(rotorPts, z, 3, P, { convex: false }), { tone: "hi", crease: "lo" }));
  out.push(L(k.ring(0, 0, 60, z + 3, P, 48), { tone: "faint" }));
  const hatch = [];
  for (let i = 1; i < 18; i++) hatch.push(k.lineOnTop(polar(0, 0, 20, Math.PI * (i / 18)), polar(0, 0, 104, Math.PI * (i / 18)), z + 3, P));
  out.push(L(hatch.join(""), { tone: "faint" }));
  out.push(S(k.cylinder(0, 0, 14, z, 4.6, P, 36, 0.3), { tone: "mid", crease: "lo" }));
  out.push("</g>");
  put("rotor", z + 4.6, [0, 0, z + 4.6], out.join(""), 5);
  for (const [c, a] of [[[-38, 34], 0.2], [[40, 44], 0.9]]) {
    const gs = S(k.extrude(shifted(gearRing(24, M * 0.9), c), z - 1.6, 1.4, P, { convex: false }), { tone: "mid", crease: "lo" });
    put("rotor", z - 0.2, [c[0], c[1], z - 1], gs + L(k.ring(c[0], c[1], 6, z - 0.2, P, 18), { tone: "faint" }), 0);
    void a;
  }
  put("rotor", z - 3, [0, 0, z - 3], poly(capsule([-38, 34], [40, 44], 10), z - 3.4, 1.2, { tone: "lo", crease: "lo" }, 0.2), -10);
}

function caseBack() {
  const z = -18;
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: -170, y: -170, w: 340, d: 340, r: 170 }, z, 2, P)}" style="filter:blur(10px)"/>`];
  out.push(S(ringSolid(z, 8, 118, 170, 120), { tone: "mid", crease: "lo" }));
  out.push(L(k.ring(0, 0, 118, z + 8, P, 96) + k.ring(0, 0, 112, z + 4, P, 96), { tone: "lo" }));
  const bolts = [];
  for (let i = 0; i < 8; i++) bolts.push(at([...polar(0, 0, 144, rad(22.5 + 45 * i)), z + 8]));
  out.push(k.dotsSvg(bolts, { size: 1.4, tone: "mid" }));
  out.push(L(k.ring(0, 0, 144, z + 8, P, 96), { tone: "faint" }));
  put("back", z + 8, [0, 0, z + 8], out.join(""), 0);
}

function caseMiddle() {
  const z0 = -10;
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: -172, y: -172, w: 344, d: 344, r: 172 }, z0, 2, P)}" style="filter:blur(10px)"/>`];
  const lugs = [];
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const pts = [[sx * 36, sy * 150], [sx * 60, sy * 150], [sx * 54, sy * 192], [sx * 40, sy * 192]];
      lugs.push(poly(pts, z0 + 2, 14, { tone: "mid", crease: "lo" }, 0.8));
    }
  }
  const lugBack = lugs.filter((_, i) => i < 2).join("");
  put("case", 6, [0, -190, 0], lugBack, -300);
  out.push(S(ringSolid(z0, 18, 150, 172, 120), { tone: "mid", crease: "lo" }));
  out.push(L(k.ring(0, 0, 150, z0 + 18, P, 96), { tone: "lo" }));
  out.push(L(k.sideArc(0, 0, 172, z0 + 9, P, 60), { tone: "faint" }));
  put("case", 8, [0, 0, 8], out.join(""), 0);
  put("case", 9, [0, 190, 0], lugs.filter((_, i) => i >= 2).join(""), 300);
  const crown = [];
  const F = frameX(172, 0, 0);
  crown.push(S(G.solidOf([[0, 6], [10, 6]], F, P), { tone: "mid", crease: "none" }));
  const F2 = frameX(182, 0, 0);
  crown.push(S(G.solidOf([[0, 10.5], [3, 10.5], [3, 9], [14, 9], [14, 10.5], [16, 10.5]], F2, P), { tone: "hi", crease: "lo", inner: L(G.ribsOf(F2, 3, 14, 9, 22, P), { tone: "faint" }) }));
  put("case", 8.5, [190, 0, 0], `<g data-crown>${crown.join("")}</g>`, 5);
}

function bezel() {
  const z = 30;
  const out = [S(ringSolid(z, 8, 142, 172, 120), { tone: "hi", crease: "lo" })];
  out.push(L(k.ring(0, 0, 142, z + 8, P, 96) + k.ring(0, 0, 160, z + 8, P, 96), { tone: "lo" }));
  put("bezel", z + 8, [0, 0, z + 8], out.join(""), 0);
}

plate();
movement();
barrel();
lever();
balance();
bridges();
cock();
dial();
hands();
rotor();
caseBack();
caseMiddle();
bezel();

const ZLIFT = Object.fromEntries(ASM.map((a) => [a.id, a.lift]));
const sorted = items.sort((a, b) => a.key - b.key);
const groups = [];
for (const it of sorted) {
  const last = groups[groups.length - 1];
  if (last && last.asm === it.asm) last.svg.push(it.svg);
  else groups.push({ asm: it.asm, svg: [it.svg] });
}
const body = groups.map((g) => `<g class="it" data-a="${g.asm}" data-m="0,0,${ZLIFT[g.asm]}">${g.svg.join("")}</g>`).join("");

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A skeleton automatic mechanical wristwatch seen from above. A balance wheel oscillates four times a second, a Swiss lever escapement releases an escape wheel one step per beat, a gear train with true tooth counts turns the center wheel once an hour and the seconds wheel once a minute, and the three hands show the real time. A button takes the watch apart in layers: bezel, hands, dial, motion works, bridges, balance, escapement, gear train, barrel, plate, rotor and case back.",
  body,
});

const live = `
const P = ${JSON.stringify(P)};
const ASM = ${JSON.stringify(ASM)};
const ORDER = ${JSON.stringify(ORDER)};
const GEARS = ${JSON.stringify(gearTable)};
const BAL = ${JSON.stringify(BAL)}, LEVER = ${JSON.stringify(LEVER)};
const SPRING_CENTER = ${JSON.stringify(BAR)};
${planRot.toString()}
const stage = document.querySelector(".iso-stage");
const svgRoot = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const toggle = document.querySelector("[data-toggle]");
const slowBtn = document.querySelector("[data-slow]");
const crownBtn = document.querySelector("[data-crown-btn]");
const shakeBtn = document.querySelector("[data-shake]");
const info = document.querySelector("[data-info]");
const clockEl = document.querySelector("[data-clock]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const nodes = [...svgRoot.querySelectorAll(".it[data-a]")].map((el) => ({ el, a: el.dataset.a, m: el.dataset.m.split(",").map(Number) }));
const buttons = [...document.querySelectorAll("[data-pick]")];
const gearEls = GEARS.map((g) => ({ ...g, el: svgRoot.querySelector('[data-gear="' + g.id + '"]') }));
const handEls = Object.fromEntries([...svgRoot.querySelectorAll("[data-hand]")].map((e) => [e.dataset.hand, e]));
const leverEl = svgRoot.querySelector("[data-lever]");
const balEl = svgRoot.querySelector("[data-balance]");
const rollerEl = svgRoot.querySelector("[data-roller]");
const hairEl = svgRoot.querySelector("[data-hair]");
const rotorEl = svgRoot.querySelector("[data-rotor]");
const crownEl = svgRoot.querySelector("[data-crown]");
const springEl = svgRoot.querySelector("[data-spring]");
const spring = Object.fromEntries(ASM.map((a) => [a.id, { x: 0, v: 0, target: 0, at: 0 }]));
const now = new Date();
const state = { apart: false, sel: null, clock: 0, touring: !still.matches, tourT: 0, idle: 0, say: "", tsim: now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000, offset: 0, slow: false, setting: false, reserve: 36, rotor: 0, rotorV: 0, wound: 0.8, crownX: 0, dragging: false };
let frame = 0, last = 0, visible = false;
const STAGGER = 0.035, STIFF = 64, DRAG = 14.2;
const AMP = 270, LEVER_AMP = 7.5, BEAT = 8;
const ease = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const RATIO = { C: 1, B: -1 / 8, T: -8, F: 60, E: -960, I: -60, S: 60, M: -1 / 3, H: 1 / 12, Cd: 1 };
function setApart(on) {
  if (state.apart === on) return;
  state.apart = on;
  const seq = (on ? ORDER : [...ORDER].reverse()).filter((id) => spring[id].target !== (on ? 1 : 0));
  seq.forEach((id, i) => { spring[id].target = on ? 1 : 0; spring[id].at = state.clock + i * STAGGER; spring[id].armed = true; });
  run();
}
function select(id) {
  state.sel = id;
  if (!id) svgRoot.removeAttribute("data-focus"); else svgRoot.setAttribute("data-focus", "");
  nodes.forEach((n) => (n.a === id ? n.el.setAttribute("data-on", "") : n.el.removeAttribute("data-on")));
  buttons.forEach((b) => b.toggleAttribute("data-on", b.dataset.pick === id));
  const a = ASM.find((x) => x.id === id);
  info.textContent = a ? a.does : "Passe o mouse sobre uma peça ou escolha um conjunto abaixo. O balanço oscila a 4 Hz e a hora mostrada é a real.";
  stage.setAttribute("aria-valuetext", a ? a.name : "nenhum conjunto selecionado");
  run();
}
function step(dt) {
  state.clock += dt;
  const calm = still.matches;
  let moving = false;
  for (const id of ORDER) {
    const s = spring[id];
    if (s.armed && state.clock < s.at) { moving = true; continue; }
    s.armed = false;
    if (calm) { s.x = s.target; s.v = 0; continue; }
    for (let i = 0; i < 4; i++) { s.v += ((s.target - s.x) * STIFF - s.v * DRAG) * dt / 4; s.x += s.v * dt / 4; }
    if (Math.abs(s.target - s.x) < 5e-4 && Math.abs(s.v) < 5e-4) { s.x = s.target; s.v = 0; } else moving = true;
  }
  const speed = state.slow ? 1 / 8 : 1;
  if (!state.setting) { state.tsim += dt * speed; state.reserve = Math.max(0, state.reserve - dt * speed / 3600); }
  const w = state.rotorV;
  if (Math.abs(w) > 0.01) {
    state.rotor += w * dt; state.rotorV *= Math.exp(-dt / 2.2);
    state.reserve = Math.min(45, state.reserve + Math.abs(w) * dt / 360 * 0.3);
  }
  return moving;
}
let lastW = -1;
function draw() {
  for (const n of nodes) {
    const share = spring[n.a] ? spring[n.a].x : 0;
    if (share === 0) n.el.removeAttribute("transform"); else n.el.setAttribute("transform", translateAlong(P, [n.m[0] * share, n.m[1] * share, n.m[2] * share]));
  }
  const T = state.tsim, beats = T * BEAT;
  const nb = Math.floor(beats), ph = beats - nb, s = ease(0, 0.26, ph);
  const thetaC = (nb + s) / 80;
  const thetaD = thetaC + state.offset * 0.1;
  const val = (arbor) => (arbor === "Cd" || arbor === "M" || arbor === "H" ? thetaD : thetaC);
  for (const g of gearEls) {
    const ang = (((g.off + RATIO[g.arbor] * val(g.arbor)) % 360) + 360) % 360;
    g.el.setAttribute("transform", planRot(iso, P, g.cx, g.cy, g.z, ang));
  }
  const rot = (el, cx, cy, z, a) => el.setAttribute("transform", planRot(iso, P, cx, cy, z, a));
  rot(handEls.hour, 0, 0, 42, thetaD / 12);
  rot(handEls.min, 0, 0, 45, thetaD);
  rot(handEls.sec, 0, 0, 48, 60 * thetaC);
  const bal = AMP * Math.sin(Math.PI * beats);
  rot(balEl, BAL[0], BAL[1], 29.5, bal);
  rot(rollerEl, BAL[0], BAL[1], 25, bal);
  const lv = LEVER_AMP * (nb % 2 === 0 ? 1 : -1) * (2 * s - 1);
  rot(leverEl, LEVER[0], LEVER[1], 25, lv);
  hairEl.setAttribute("d", hairPath(bal));
  rot(rotorEl, 0, 0, -22, state.rotor);
  const w = Math.round(Math.min(1, state.reserve / 45) * 200) / 200;
  if (w !== lastW) { lastW = w; springEl.innerHTML = springSvg(w); }
  const cx = state.setting ? 10 : 0;
  state.crownX += (cx - state.crownX) * 0.25;
  crownEl.setAttribute("transform", translateAlong(P, [state.crownX, 0, 0]));
  const td = ((T + state.offset) % 86400 + 86400) % 86400;
  const hh = Math.floor(td / 3600), mm = Math.floor((td % 3600) / 60), ss = Math.floor(td % 60);
  const hms = String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0");
  const moving = ORDER.some((id) => spring[id].x !== spring[id].target || spring[id].armed);
  const phase = moving ? (state.apart ? "desmontando" : "montando") : spring.hands.x === 1 ? "desmontado" : "";
  const label = state.sel ? ASM.find((a) => a.id === state.sel).name : hms + " · 28.800 alt/h" + (state.slow ? " · câmera lenta" : "") + (state.setting ? " · acertando" : "") + (phase ? " · " + phase : "");
  if (label !== state.say) { state.say = label; readout.textContent = label; }
  clockEl.textContent = hms + "  ·  reserva " + Math.round(state.reserve) + " h";
  toggle.textContent = state.apart ? "Montar" : "Desmontar";
}
function springSvg(w) {
  const r0 = 8, r1 = 12 + w * 22, turns = 8, N = 220;
  const pts = [], outer = [];
  for (let i = 0; i <= N; i++) { const t = i / N, a = turns * 2 * Math.PI * t, r = r0 + (r1 - r0) * t; pts.push(iso([SPRING_CENTER[0] + r * Math.cos(a), SPRING_CENTER[1] + r * Math.sin(a), 9.1], P)); }
  for (let i = 0; i <= 90; i++) { const t = i / 90, a = 3 * 2 * Math.PI * t + 1, rr = 33.5 - t * (33.5 - Math.max(r1 + 2, 18)) * 0.6; outer.push(iso([SPRING_CENTER[0] + rr * Math.cos(a), SPRING_CENTER[1] + rr * Math.sin(a), 9.1], P)); }
  return '<path class="iso-line" data-tone="hi" d="' + pathOf(pts) + '"/><path class="iso-line" data-tone="mid" d="' + pathOf(outer) + '"/>';
}
function hairPath(theta) {
  const pts = [], N = 140, turns = 11, r0 = 5.8, r1 = 24.8;
  for (let i = 0; i <= N; i++) { const t = i / N, a = turns * 2 * Math.PI * t + theta * Math.PI / 180 * (1 - t), r = r0 + (r1 - r0) * t * (1 + 0.012 * Math.sin(theta * Math.PI / 180)); pts.push(iso([BAL[0] + r * Math.cos(a), BAL[1] + r * Math.sin(a), 31.3], P)); }
  return pathOf(pts);
}
const TOUR = [...ORDER];
function tour(dt) {
  state.tourT += dt;
  const cycle = 4 + 1.9 * TOUR.length + 3;
  const c = state.tourT % cycle;
  if (c < 2.4) { if (state.apart) setApart(false); if (state.sel) select(null); }
  else if (c < 4) setApart(true);
  else {
    const i = Math.floor((c - 4) / 1.9);
    if (i < TOUR.length) { if (state.sel !== TOUR[i]) select(TOUR[i]); }
    else { if (state.sel) select(null); if (c > cycle - 1.5) setApart(false); }
  }
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (state.touring) tour(dt);
  else { state.idle += dt; if (state.idle > 8 && !still.matches) { state.touring = true; state.tourT = 0; } }
  step(dt);
  draw();
  frame = visible ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
const take = () => { state.touring = false; state.idle = 0; };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
toggle.addEventListener("click", () => { take(); setApart(!state.apart); });
slowBtn.addEventListener("click", () => { take(); state.slow = !state.slow; slowBtn.toggleAttribute("data-on", state.slow); });
crownBtn.addEventListener("click", () => { take(); state.setting = !state.setting; crownBtn.toggleAttribute("data-on", state.setting); crownBtn.textContent = state.setting ? "Empurrar coroa" : "Puxar coroa"; });
shakeBtn.addEventListener("click", () => { take(); state.rotorV += 900; run(); });
buttons.forEach((b) => {
  b.addEventListener("click", () => { take(); select(state.sel === b.dataset.pick ? null : b.dataset.pick); if (!state.apart && b.dataset.pick !== "case") setApart(true); });
  b.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") { take(); select(b.dataset.pick); } });
});
function planAt(event) {
  const pt = svgRoot.createSVGPoint(); pt.x = event.clientX; pt.y = event.clientY;
  const q = pt.matrixTransform(svgRoot.getScreenCTM().inverse());
  const o = iso([0, 0, 45], P), e1 = iso([1, 0, 45], P), e2 = iso([0, 1, 45], P);
  const a = e1[0] - o[0], b = e1[1] - o[1], c = e2[0] - o[0], d = e2[1] - o[1], det = a * d - b * c;
  const dx = q.x - o[0], dy = q.y - o[1];
  return [(d * dx - c * dy) / det, (-b * dx + a * dy) / det];
}
let dragLast = null;
stage.addEventListener("pointerdown", (event) => {
  if (!state.setting) return;
  take(); state.dragging = true; stage.setPointerCapture(event.pointerId);
  const [x, y] = planAt(event); dragLast = Math.atan2(x, -y);
});
stage.addEventListener("pointermove", (event) => {
  if (state.dragging && dragLast !== null) {
    const [x, y] = planAt(event); const a = Math.atan2(x, -y);
    let d = a - dragLast; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
    state.offset += d * 180 / Math.PI * 10; dragLast = a; run(); return;
  }
  if (event.pointerType === "touch") return;
  const hit = event.target.closest ? event.target.closest(".it[data-a]") : null;
  const id = hit ? hit.dataset.a : null;
  if (id !== state.sel) { take(); select(id); }
});
const endDrag = () => { state.dragging = false; dragLast = null; };
stage.addEventListener("pointerup", endDrag);
stage.addEventListener("pointercancel", endDrag);
stage.addEventListener("pointerleave", () => { if (state.sel && !state.dragging) select(null); });
stage.addEventListener("click", (event) => { if (state.setting) return; const hit = event.target.closest(".it[data-a]"); take(); if (event.pointerType === "touch" && hit) { select(hit.dataset.a); return; } setApart(!state.apart); });
stage.addEventListener("keydown", (event) => {
  const ids = ASM.map((a) => a.id);
  const at = state.sel ? ids.indexOf(state.sel) : -1;
  if (event.key === " " || event.key === "Enter") { event.preventDefault(); take(); setApart(!state.apart); }
  else if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); take(); if (state.setting) state.offset += 60; else select(ids[(at + 1) % ids.length]); }
  else if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); take(); if (state.setting) state.offset -= 60; else select(ids[(at - 1 + ids.length) % ids.length]); }
  else if (event.key === "Escape") { take(); select(null); }
  else if (event.key === "Home") { take(); setApart(false); }
  else if (event.key === "End") { take(); setApart(true); }
});
select(null);
visible = true; step(0); draw(); visible = false;
`;

const legend = `<div class="tf-parts">${ASM.map((a, i) => `<button type="button" class="tf-part" data-pick="${a.id}"><i>${String(i + 1).padStart(2, "0")}</i>${a.name}</button>`).join("")}</div>`;
const PANEL_CSS = `
.tf-bar{display:flex;flex-wrap:wrap;gap:12px 14px;align-items:center;margin-top:14px}
.tf-btn{font:500 12.5px/1 var(--anatomy-mono);color:var(--anatomy-strong);background:var(--anatomy-card);border:1px solid var(--anatomy-mid);padding:11px 16px;cursor:pointer;letter-spacing:.06em;text-transform:uppercase}
.tf-btn:hover,.tf-btn[data-on]{border-color:var(--anatomy-hi);background:var(--anatomy-face)}
.tf-btn:focus-visible,.iso-stage:focus-visible,.tf-part:focus-visible{outline:1px solid var(--anatomy-hi);outline-offset:3px}
.tf-clock{margin-left:auto;font:500 13px var(--anatomy-mono);color:var(--anatomy-text);white-space:pre}
.tf-info{flex:1 1 100%;margin:4px 0 0;color:var(--anatomy-text);font-size:13px;line-height:1.55;min-height:3.1em}
.tf-parts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1px;margin-top:10px;background:var(--anatomy-faint);border:1px solid var(--anatomy-faint)}
.tf-part{display:flex;gap:10px;align-items:baseline;text-align:left;font:13px/1.35 ui-sans-serif,system-ui,sans-serif;color:var(--anatomy-text);background:var(--anatomy-card);border:0;padding:10px 12px;cursor:pointer}
.tf-part i{font:normal 11px var(--anatomy-mono);color:var(--anatomy-muted)}
.tf-part:hover,.tf-part[data-on]{background:var(--anatomy-face);color:var(--anatomy-strong)}
.tf-part[data-on] i{color:var(--anatomy-strong)}
.iso-stage{touch-action:pan-y;cursor:pointer;user-select:none}
.iso-fill{fill-rule:evenodd}
.jw{fill:var(--anatomy-red);stroke:none;opacity:.9}
.jw-ring{fill:none;stroke:var(--anatomy-mid);stroke-width:.5}
.it[data-on] .iso-fill{fill:var(--anatomy-face)}
.it[data-on] .iso-top{fill:var(--anatomy-lit-top)}
.it[data-on] .iso-shade{fill:var(--anatomy-lit-shade)}
.it[data-on] .iso-edge{stroke:var(--anatomy-lit)}
.it[data-on] .iso-solid[data-seamless]>.iso-top{stroke:var(--anatomy-lit-top)}
.it[data-on] .iso-solid[data-seamless]>.iso-shade{stroke:var(--anatomy-lit-shade)}
[data-focus] .it:not([data-on]) .iso-edge[data-tone="hi"],[data-focus] .it:not([data-on]) .iso-line[data-tone="hi"]{stroke:var(--anatomy-mid)}
[data-focus] .it:not([data-on]) .iso-edge[data-tone="mid"],[data-focus] .it:not([data-on]) .iso-line[data-tone="mid"]{stroke:var(--anatomy-lo)}
[data-focus] .it:not([data-on]) .iso-edge[data-tone="lo"],[data-focus] .it:not([data-on]) .iso-line[data-tone="lo"]{stroke:var(--anatomy-faint)}
@media (max-width:560px){.iso-stage{overflow:hidden;margin:-14px -4px -22px}.iso-stage .iso-svg{width:124%;max-width:none;margin-left:-12%}.tf-clock{margin-left:0;flex:1 1 100%}}
`;

const fig = k.plateHtml({
  fig: "Fig 1",
  title: "Relógio mecânico",
  hint: "Clique ou toque: desmontar",
  readout: "28.800 alt/h",
  keys: [
    { mark: "lit", label: "Conjunto selecionado" },
    { mark: "raised", label: "Os outros conjuntos" },
  ],
  caption:
    "Relógio automático esqueleto, visto do lado do mostrador. O balanço oscila 4 vezes por segundo, o escapamento libera um dente da roda de escape a cada batida e a rodagem, com número de dentes real, faz a roda central girar 1 vez por hora e a dos segundos 1 por minuto. Os ponteiros mostram a hora do seu aparelho. O botão separa as camadas, de cima para baixo.",
  body: `<div class="iso-stage" tabindex="0" role="group" aria-label="Relógio mecânico: Espaço desmonta ou monta, setas escolhem um conjunto, Escape limpa a seleção" aria-valuetext="nenhum conjunto selecionado">${svg}</div>`,
});
const bodyHtml = `<style>${PANEL_CSS}</style>${fig}<div class="tf-bar"><button type="button" class="tf-btn" data-toggle>Desmontar</button><button type="button" class="tf-btn" data-slow>Câmera lenta ⅛</button><button type="button" class="tf-btn" data-crown-btn>Puxar coroa</button><button type="button" class="tf-btn" data-shake>Agitar o pulso</button><span class="tf-clock" data-clock></span><p class="tf-info" data-info></p></div>${legend}`;
writeFileSync(join(HERE, OUT), k.pageHtml({ title: "Relógio mecânico", theme, body: bodyHtml, script: kitScript() + live, width: 1040 }));
console.log("wrote", OUT, "items:", items.length, "gears:", gearTable.length);
