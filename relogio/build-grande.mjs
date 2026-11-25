import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";
import { kitScript } from "./scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const OUT = theme === "light" ? "relogio-grande-light.html" : "relogio-grande.html";
const WIDTH = 860;
const HEIGHT = 1300;
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
  { id: "bezel", name: "Lunete", does: "Anel polido que fecha a caixa por cima e prende o vidro de safira. É a primeira peça a sair e protege os ponteiros do pó e dos riscos.", lift: 980 },
  { id: "hands", name: "Ponteiros", does: "Horas, minutos e segundos centrais, mais o ponteiro do cronógrafo (o fino em destaque). Cada um é preso a uma ponta de eixo. O dos segundos dá oito pequenos saltos por segundo, um a cada batida do balanço.", lift: 910 },
  { id: "dial", name: "Mostrador e calendário", does: "Disco com índices aplicados, minuteria de 60 pontos e três mostradores auxiliares: dia da semana à esquerda, data à direita e fase da lua embaixo, com janelas de ano e mês no alto. Tudo segue a data real do seu aparelho.", lift: 840 },
  { id: "motion", name: "Minuteria", does: "Engrenagens que reduzem 12 para 1: o ponteiro dos minutos dá 12 voltas enquanto o das horas dá uma. Deslizam por fricção para ajustar a hora sem mexer no resto.", lift: 770 },
  { id: "cock", name: "Ponte do balanço", does: "Segura o eixo do balanço por cima e prende a ponta externa da mola espiral. A raquete ajusta o comprimento útil da mola e, com ele, o adiantamento.", lift: 700 },
  { id: "balance", name: "Balanço e mola espiral", does: "Volante que oscila 4 vezes por segundo (28.800 alternâncias por hora). A mola espiral o puxa de volta ao centro. É o pêndulo do relógio: a frequência dele define a hora.", lift: 375 },
  { id: "bridges", name: "Pontes e catraca", does: "Prendem as engrenagens por cima e abrigam os rubis onde giram os pivôs. A catraca com a lingueta impede a mola principal de desenrolar.", lift: 440 },
  { id: "escape", name: "Escapamento", does: "Âncora de rubis que trava e libera um dente da roda de escape a cada batida. Cada liberação deixa a rodagem avançar um passo e dá um impulso ao balanço.", lift: 245 },
  { id: "train", name: "Rodagem", does: "Cadeia de engrenagens que reduz a velocidade: a roda central dá 1 volta por hora, a dos segundos 1 por minuto e a de escape 16 por minuto.", lift: 180 },
  { id: "barrel", name: "Barrilete e mola principal", does: "Tambor com a mola principal: guarda a energia e a entrega devagar. Uma volta do barrilete dura cerca de 8 horas e a reserva de marcha é de cerca de 40 horas.", lift: 120 },
  { id: "plate", name: "Platina", does: "Base onde todas as peças se apoiam. Os mancais dos pivôs são rubis, que reduzem o atrito e o desgaste.", lift: 60 },
  { id: "rotor", name: "Massa oscilante", does: "Semicírculo pesado que gira livre com os movimentos do pulso e enrola a mola do barrilete por engrenagens redutoras. Fica por baixo da platina e só se vê desmontado.", lift: -80 },
  { id: "back", name: "Fundo com vidro", does: "Fundo de aço com vidro que deixa ver o movimento pelo lado de trás. É preso por parafusos e veda a caixa.", lift: -150 },
  { id: "pins", name: "Pinos", does: "Pinos de mola que prendem as pulseiras entre as hastes.", lift: 70 },
  { id: "strapT", name: "Pulseira superior", does: "Peça curta com a fivela e os passadores.", lift: 60 },
  { id: "strapB", name: "Pulseira inferior", does: "Peça longa, com a fileira de furos.", lift: -60 },
  { id: "chrono", name: "Cronógrafo", does: "", lift: 310 },
  { id: "bridgePa", name: "Ponte em pá", does: "", lift: 505 },
  { id: "bridgeHook", name: "Ponte em gancho", does: "", lift: 570 },
  { id: "bridgeHeart", name: "Ponte em coração", does: "", lift: 635 },
  { id: "crown", name: "Coroa", does: "", lift: 0 },
  { id: "pushS", name: "Pusher superior", does: "", lift: 0 },
  { id: "pushR", name: "Pusher inferior", does: "", lift: 0 },
  { id: "loopT", name: "Pulseira fechada (alto)", does: "", lift: 0 },
  { id: "loopB", name: "Pulseira fechada (baixo)", does: "", lift: 0 },
  { id: "case", name: "Caixa, coroa e pulseira", does: "Carrura com as hastes que prendem a pulseira de couro. A coroa dá corda e, puxada, ajusta a hora (e para o balanço para acertar o segundo). Os dois pushers laterais comandam o cronógrafo.", lift: 0 },
];
const ZS = 0.55;
const ZK = 0.8 / ZS;
for (const a of ASM) a.lift = Math.round(a.lift * ZK);
const MV = { strapT: [0, -150], strapB: [0, 150], crown: [120, 0], pushS: [105, -60], pushR: [105, 60] };
const ORDER = ["crown", "pushS", "pushR", "strapT", "strapB", "bezel", "hands", "dial", "motion", "cock", "bridgeHeart", "bridgeHook", "bridgePa", "bridges", "balance", "chrono", "escape", "train", "barrel", "plate", "rotor", "back"];
const ID = Object.fromEntries(ASM.map((a, i) => [a.id, i]));

const BOXES = [
  [-175, -175, -30, 175, 175, -18, "back"],
  [-175, -175, -12, 175, 175, 4, "rotor"],
  [-340, -1040, -18, 340, 1200, 50, "case"],
  [-150, -150, 0, 150, 150, 60, "plate"],
  [-175, -175, 50, 175, 175, 62, "bezel"],
].map(([x0, y0, z0, x1, y1, z1, id]) => ({ x0, y0, z0, x1, y1, z1, lift: ASM[ID[id]].lift }));
const fitPoints = BOXES.flatMap((b) =>
  [0, 1].flatMap((t) => k.boxCorners({ x: b.x0, y: b.y0, w: b.x1 - b.x0, d: b.y1 - b.y0, r: 0 }, b.z0 + b.lift * t, b.z1 + b.lift * t)),
);
const P = k.fitProjection(fitPoints, WIDTH, HEIGHT, { pad: 18, azimuth: 75, elevation: 55, zs: ZS });
const VB1 = [0, 0, WIDTH, HEIGHT];
const STAGE1 = Object.fromEntries(["bezel", "hands", "dial", "motion"].map((id) => [id, Math.round(700 * ZK)]));
const WELL_UP = 44;
for (const id of ["plate", "barrel", "train", "escape", "balance", "bridges", "chrono", "bridgePa", "bridgeHook", "bridgeHeart", "cock"]) STAGE1[id] = WELL_UP;
const VBM = (() => {
  const pts = k.boxCorners({ x: -225, y: -330, w: 450, d: 670, r: 0 }, -130, 62 + 440 * ZK).map((q) => k.iso(q, P));
  const xs = pts.map((q) => q[0]);
  const ys = pts.map((q) => q[1]);
  const x0 = Math.min(...xs) - 30;
  const y0 = Math.min(...ys) - 30;
  const hh = Math.max(...ys) + 30 - y0;
  return [x0, y0 + hh * 0.12, Math.max(...xs) + 30 - x0, hh];
})();
const VB0 = (() => {
  const pts = k.boxCorners({ x: -225, y: -330, w: 450, d: 670, r: 0 }, -130, 62).map((q) => k.iso(q, P));
  const xs = pts.map((q) => q[0]);
  const ys = pts.map((q) => q[1]);
  const x0 = Math.min(...xs) - 30;
  const y0 = Math.min(...ys) - 30;
  return [x0, y0, Math.max(...xs) + 30 - x0, Math.max(...ys) + 30 - y0];
})();

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const seg = (a, b) => k.segment(a, b, P);
const V = G.viewOf(P);
const frameZ = (x, y, z) => G.frameAlong([x, y, z], [0, 0, 1]);
const dotsAt = (pts, style = {}) => k.dotsSvg(pts.map(at), { size: 0.5, ...style });
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
const put = (asm, z, point, svg, bias = 0) => items.push({ asm, key: z * 10 + (k.depthOf(point, P) + bias) * 0.001, svg: ["case", "bezel", "back", "crown", "pushS", "pushR"].includes(asm) && !svg.startsWith('<g class="strap">') ? `<g class="gold">${svg}</g>` : asm === "dial" ? `<g class="cream">${svg}</g>` : svg });

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
  const svg = [`<path class="iso-halo" d="${k.haloOf({ x: -R_PLATE, y: -R_PLATE, w: 2 * R_PLATE, d: 2 * R_PLATE, r: R_PLATE }, -2, 2, P)}" style="filter:blur(8px)"/>`];
  svg.push(S(k.cylinder(0, 0, R_PLATE - 3, -2, 2, P, 120, 0.4), { tone: "lo", crease: "lo" }));
  const stripes = [];
  for (let a = 0; a < 360; a += 6) stripes.push(seg([...polar(0, 0, 112, rad(a)), 0], [...polar(0, 0, R_PLATE - 6, rad(a)), 0]));
  svg.push(L(stripes.join(""), { tone: "faint" }));
  svg.push(L(k.ring(0, 0, R_PLATE - 6, 0, P, 96) + k.ring(0, 0, 112, 0, P, 96), { tone: "lo" }));
  put("plate", 0, [0, 0, 0], svg.join(""), 0);
  const pivots = [O, BAR, THIRD, FOURTH, ESC, LEVER, BAL, IDLER, CAM, RST_P, HAM_P];
  for (const p of pivots) jewel("plate", 0, p, 1.7);
  for (let i = 0; i < 8; i++) screw("plate", 0, polar(0, 0, 136, rad(10 + 45 * i)), 3.2, 0.4 + i);
}

function barrel() {
  const out = [S(k.cylinder(BAR[0], BAR[1], 38, 5.4, 3.6, P, 72, 0.4), { tone: "mid", crease: "lo" })];
  out.push(L(k.ring(BAR[0], BAR[1], 34, 9, P, 64), { tone: "lo" }));
  out.push(`<g data-spring>${springSvg(0.8)}</g>`);
  out.push(S(ringSolid(9, 3, 22, 36, 48, BAR), { tone: "mid", crease: "lo" }));
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
  ].map(([a, b], i) => poly(organic(bendBez(a, b, i % 2 ? 9 : -9, 12), (t) => 10 + 5 * Math.abs(Math.cos(Math.PI * t))), z, h, st, 0.5, false));
  const lobe = [O, THIRD, FOURTH, ESC].map((p) => poly(circleRing(p, 8.5), z, h, st, 0.5));
  put("bridges", z + h, [20, 20, z + h], lobe.join("") + trainBridge.join(""), 0);
  const eBridge = [poly(capsule(O, polar(0, 0, 40, rad(-150)), 12), z, h, st, 0.5), poly(circleRing(polar(0, 0, 40, rad(-150)), 7), z, h, st, 0.5)];
  put("bridges", z + h, [-20, -20, z + h], eBridge.join(""), -5);
  const bb = [poly(capsule(BAR, add2(BAR, [10, -6]), 13), z, h, st, 0.5), poly(circleRing(BAR, 9), z, h, st, 0.5), poly(organic(bendBez(BAR, add2(BAR, clockVec(180, 30)), 8, 12), (t) => 11 - 3 * t), z, h, st, 0.5, false)];
  put("bridges", z + h, [BAR[0], BAR[1], z + h], bb.join(""), -3);
  const lb = [poly(capsule(LEVER, polar(LEVER[0], LEVER[1], 20, rad(160)), 10), z, h, st, 0.5), poly(circleRing(LEVER, 7), z, h, st, 0.5)];
  put("bridges", z + h, [LEVER[0], LEVER[1], z + h], lb.join(""), 2);
  for (const p of [O, THIRD, FOURTH, ESC, BAR, LEVER]) jewel("bridges", z + h, p);
  for (const [p, a] of [[polar(0, 0, 40, rad(-150)), 0.3], [add2(BAR, clockVec(180, 30)), 1.1], [polar(LEVER[0], LEVER[1], 20, rad(160)), 0.7]]) screw("bridges", z + h, p, 3, a);
  const mids = [[add2(O, clockVec(40, 18)), 0.2], [add2(THIRD, clockVec(60, 15)), 0.9], [add2(FOURTH, clockVec(40, 14)), 1.3], [add2(ESC, clockVec(300, 13)), 0.5], [add2(BAR, clockVec(60, 13)), 0.1], [add2(THIRD, clockVec(140, 14)), 1.0], [add2(LEVER, clockVec(230, 11)), 0.6]];
  for (const [p, a] of mids) screw("bridges", z + h, p, 2.4, a);
  chrono(z, h, st);
  heartBridge();
  hookBridge();
  paBridge();
  const rz = z + h;
  const rat = [S(k.extrude(shifted(ratchetRing(36, 11, 14.5), add2(BAR, [10, -6])), rz, 2.4, P, { convex: false }), { tone: "hi", crease: "lo" })];
  rat.push(L(k.ring(BAR[0] + 10, BAR[1] - 6, 9, rz + 2.4, P, 36), { tone: "faint" }));
  put("bridges", rz + 2.4, [BAR[0] + 10, BAR[1] - 6, rz + 2.4], rat.join(""), 6);
  const click = poly(capsule(add2(BAR, [24, -18]), add2(BAR, [14, -16]), 3), rz, 2.2, st);
  put("bridges", rz + 2.2, [BAR[0] + 20, BAR[1] - 18, rz + 2], click, 7);
}
const CAM = [72, -62];
const HAM_P = [98, -30];
const RST_P = [-72, -70];
function organic(spine, wFn) {
  const n = spine.length;
  const left = [];
  const right = [];
  spine.forEach((p, i) => {
    const a = spine[Math.max(0, i - 1)];
    const b = spine[Math.min(n - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / l;
    const ny = (b[0] - a[0]) / l;
    const w = wFn(i / (n - 1)) / 2;
    left.push([p[0] + nx * w, p[1] + ny * w]);
    right.push([p[0] - nx * w, p[1] - ny * w]);
  });
  return [...left, ...right.reverse()];
}
const bez = (p0, p1, p2, n = 14) => Array.from({ length: n + 1 }, (_, i) => {
  const t = i / n;
  return [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]];
});
const bendBez = (a, b, bend, n) => {
  const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return bez(a, [m[0] - ((b[1] - a[1]) / l) * bend, m[1] + ((b[0] - a[0]) / l) * bend], b, n);
};
const engrave = (x, y, z, text, size, tone = "lo") => k.faceTextSvg(textMatrix(x, y, z, 0, size), text, { size, tone, anchor: "middle" });
function circleRing(c, r, n = 20) {
  return Array.from({ length: n }, (_, i) => polar(c[0], c[1], r, (TAU * i) / n));
}

function heart(c, r) {
  const pts = [];
  for (let i = 0; i < 48; i++) {
    const t = (TAU * i) / 48;
    pts.push([c[0] + (r / 17) * 16 * Math.sin(t) ** 3, c[1] - (r / 17) * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]);
  }
  return pts;
}
function chrono(z, h, st) {
  const camZ = 20;
  const cam = [poly(heart(CAM, 17), camZ, 2.4, { tone: "hi", crease: "lo" }, 0.3, false), S(k.cylinder(CAM[0], CAM[1], 4, camZ + 2.4, 2, P, 20, 0.2), { tone: "mid", crease: "lo" })];
  gearTable.push({ id: "cam", cx: CAM[0], cy: CAM[1], z: camZ + 1.2, off: 0, arbor: "Ch", ratio: 1 });
  put("chrono", camZ + 4.4, [CAM[0], CAM[1], camZ + 4.4], `<g data-gear="cam" transform="${rotAt(CAM[0], CAM[1], camZ + 1.2, 0)}">${cam.join("")}</g>`, -8);
  const hamSpine = bendBez(HAM_P, add2(CAM, [14, 4]), -8, 10);
  const ham = [poly(organic(hamSpine, (t) => 4.5 - 2 * t), 24, 2.2, { tone: "hi", crease: "lo" }, 0.3, false), poly(circleRing(add2(CAM, [14, 4]), 3.6, 14), 24, 2.2, { tone: "mid", crease: "lo" })];
  put("chrono", 26.2, [HAM_P[0], HAM_P[1], 26.2], `<g data-ham transform="${rotAt(HAM_P[0], HAM_P[1], 25, 0)}">${ham.join("")}</g>`, -7);
  const rst = bendBez(RST_P, add2(CAM, [-10, -4]), 14, 14);
  put("chrono", 28.2, [RST_P[0], RST_P[1], 28.2], poly(organic(rst, (t) => 6 - 3 * t), 26, 2.2, { tone: "hi", crease: "lo" }, 0.3, false) + poly(circleRing(add2(CAM, [-10, -4]), 3, 12), 26, 2.2, { tone: "mid", crease: "lo" }), -6);
  gear({ id: "col", asm: "chrono", Z: 12, mod: 1.5, c: [104, 14], z: 20, h: 3, tone: "mid", arbor: "Ch", ratio: 1, off: 0, spokes: 0 });
  const brake = bendBez([116, 58], [92, 30], 8, 12);
  put("chrono", 28, [100, 44, 28], poly(organic(brake, (t) => 6 - 3 * t), 25, 2.2, { tone: "hi", crease: "lo" }, 0.3, false) + poly(circleRing([116, 58], 4, 14), 25, 2.2, { tone: "mid", crease: "lo" }), -5);
  const clutch = bendBez([124, -44], [126, 32], 9, 16);
  put("chrono", 30, [124, -6, 30], poly(organic(clutch, (t) => 5 - 2 * Math.abs(t - 0.5)), 26, 2.2, { tone: "hi", crease: "lo" }, 0.3, false) + poly(circleRing([124, -44], 3.6, 14), 26, 2.2, { tone: "mid", crease: "lo" }) + poly(circleRing([126, 32], 3.6, 14), 26, 2.2, { tone: "mid", crease: "lo" }), -4);
  jewel("chrono", 28, [124, -44], 1.6);
  jewel("chrono", 28, [126, 32], 1.6);
}
function heartBridge() {
  const z = 28;
  const h = 3.2;
  const st = { tone: "mid", crease: "lo" };
  const C = [8, -4];
  put("bridgeHeart", z + h, [C[0], C[1], z + h], poly(heart(C, 38), z, h, st, 0.5, false), 0);
  for (const [p, a] of [[add2(C, [-14, -10]), 0.3], [add2(C, [16, -10]), 0.9], [add2(C, [2, 20]), 1.4]]) screw("bridgeHeart", z + h, p, 3.2, a);
  jewel("bridgeHeart", z + h, add2(C, [2, 4]), 2.3);
  put("bridgeHeart", z + h + 1, [C[0], C[1], z + h + 1], engrave(C[0] + 1, C[1] - 6, z + h + 0.1, "ANATOMY", 4.6, "hi") + engrave(C[0] + 1, C[1] + 8, z + h + 0.1, "17 RUBIS", 3.2, "mid"), 4);
}
function hookBridge() {
  const z = 28;
  const h = 3.2;
  const st = { tone: "mid", crease: "lo" };
  const spine = bez([-100, -36], [-40, -118], [96, -54], 18);
  put("bridgeHook", z + h, [0, -70, z + h], poly(organic(spine, (t) => 16 - 7 * t + 4 * Math.sin(Math.PI * t)), z, h, st, 0.5, false) + poly(circleRing([96, -54], 13, 22), z, h, st, 0.5), 0);
  for (const i of [0, 5, 10, 15, 18]) screw("bridgeHook", z + h, spine[i], 3.2, 0.3 + i);
  jewel("bridgeHook", z + h, [96, -54], 2.4);
}
function paBridge() {
  const z = 28;
  const h = 3.2;
  const st = { tone: "mid", crease: "lo" };
  const spine = bendBez([50, 86], [112, 40], -10, 16);
  put("bridgePa", z + h, [80, 62, z + h], poly(organic(spine, (t) => 32 * Math.pow(Math.sin(Math.PI * (0.14 + 0.72 * t)), 0.6)), z, h, st, 0.5, false), 0);
  for (const i of [4, 12]) screw("bridgePa", z + h, spine[i], 3.2, 0.5 + i);
  jewel("bridgePa", z + h, spine[8], 2.2);
  put("bridgePa", z + h + 1, [80, 62, z + h + 1], engrave(spine[2][0] - 2, spine[2][1] + 12, z + h + 0.1, "+", 4.4, "hi") + engrave(spine[14][0] + 6, spine[14][1] + 12, z + h + 0.1, "–", 4.4, "hi"), 4);
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

const ZD = 42;
const R_DIAL = 140;
const textMatrix = (x, y, z, a, size) => {
  const o = at([0, 0, 0]);
  const ex = at([1, 0, 0]);
  const ey = at([0, 1, 0]);
  const col = (vx, vy) => [(ex[0] - o[0]) * vx + (ey[0] - o[0]) * vy, (ex[1] - o[1]) * vx + (ey[1] - o[1]) * vy];
  const u = col(Math.cos(a), Math.sin(a));
  const v = col(-Math.sin(a), Math.cos(a));
  const s0 = at([x - Math.sin(a) * size * 0.36, y + Math.cos(a) * size * 0.36, z]);
  const r = (n) => Math.round(n * 1000) / 1000;
  return `matrix(${r(u[0])} ${r(u[1])} ${r(v[0])} ${r(v[1])} ${r(s0[0])} ${r(s0[1])})`;
};
const label = (x, y, a, text, size, tone = "mid", attr = "") => k.faceTextSvg(textMatrix(x, y, ZD + 2.2, a, size), text, { size, tone, anchor: "middle" }).replace("<text ", `<text ${attr} `);
const SUB_T = [0, -56];
const SUB_L = [62, 0];
const SUB_R = [0, 50];
const MOON = [0, 50];
const RES = [-62, 0];
const WEEK = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
const ROMAN = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
const SERIF = 'style="font-family:Georgia,\'Times New Roman\',serif;font-weight:700;letter-spacing:0"';

function dial() {
  const top = ZD + 2;
  const out = [S(k.cylinder(0, 0, R_DIAL, ZD, 2, P, 120, 0.4), { tone: "hi", crease: "lo" })];
  const waves = [];
  for (let r = 16; r <= 118; r += 5) {
    const pts = [];
    for (let i = 0; i < 144; i++) {
      const a = (TAU * i) / 144;
      { const amp = 0.7 + (r / 118) * 0.9; pts.push([(r + amp * Math.sin(a * 14)) * Math.cos(a), (r + amp * Math.sin(a * 14)) * Math.sin(a)]); }
    }
    waves.push(k.onTop(pts, top, P, true));
  }
  out.push(L(waves.join(""), { tone: "faint" }));
  out.push(L(k.ring(0, 0, 132, top, P, 120) + k.ring(0, 0, 129, top, P, 120) + k.ring(0, 0, 126, top, P, 120) + k.ring(0, 0, R_DIAL - 1, top, P, 120), { tone: "lo" }));
  out.push(dotsAt(Array.from({ length: 12 }, (_, h) => [...clockVec(h * 30, 120), top]), { tone: "hi", size: 0.9 }));
  const minor = [];
  const major = [];
  for (let i = 0; i < 60; i++) {
    const a = rad(i * 6) - Math.PI / 2;
    const tick = k.lineOnTop(polar(0, 0, 126, a), polar(0, 0, 132, a), top, P);
    (i % 5 === 0 ? major : minor).push(tick);
  }
  out.push(L(minor.join(""), { tone: "lo" }), L(major.join(""), { tone: "hi" }));
  for (let h = 0; h < 12; h++) {
    const p = clockVec(h * 30, 102);
    out.push(label(p[0], p[1], rad(h * 30), ROMAN[h], 15, "hi", SERIF));
  }
  const sunk = (c, r) => S(k.cylinder(c[0], c[1], r, top, 0.6, P, 56), { tone: "lo", crease: "lo" });
  out.push(sunk(SUB_T, 28), L(k.ring(SUB_T[0], SUB_T[1], 27, top + 0.6, P, 56) + k.ring(SUB_T[0], SUB_T[1], 23, top + 0.6, P, 56) + k.ring(SUB_T[0], SUB_T[1], 10, top + 0.6, P, 40), { tone: "mid" }));
  for (let i = 0; i < 12; i++) {
    const p = clockVec(i * 30, 18.5);
    out.push(label(SUB_T[0] + p[0], SUB_T[1] + p[1], rad(i * 30), i === 0 ? "24" : String(i * 2), 4.4, "hi"));
  }
  out.push(label(SUB_T[0], SUB_T[1] + 6.5, 0, "24 h", 3.2, "mid"));
  out.push(sunk(SUB_L, 20), L(k.ring(SUB_L[0], SUB_L[1], 19, top + 0.6, P, 48) + k.ring(SUB_L[0], SUB_L[1], 9, top + 0.6, P, 32), { tone: "mid" }));
  WEEK.forEach((w, i) => {
    const p = clockVec((i * 360) / 7, 13.6);
    out.push(label(SUB_L[0] + p[0], SUB_L[1] + p[1], rad((i * 360) / 7), w, 3.1, "hi"));
  });
  out.push(sunk(RES, 20), L(k.ring(RES[0], RES[1], 19, top + 0.6, P, 48), { tone: "mid" }));
  const arcA = [];
  for (let i = 0; i <= 28; i++) arcA.push(polar(RES[0], RES[1], 11, rad(240 + (70 * i) / 28 - 90)));
  const arcB = arcA.map((_, i) => polar(RES[0], RES[1], 15, rad(240 + (70 * i) / 28 - 90)));
  const red = [];
  for (let i = 0; i <= 4; i++) red.push(polar(RES[0], RES[1], 13, rad(240 + (70 * i) / 28 - 90)));
  out.push(L(k.onTop(arcA, top + 0.6, P) + k.onTop(arcB, top + 0.6, P) + k.lineOnTop(arcA[0], arcB[0], top + 0.6, P) + k.lineOnTop(arcA[28], arcB[28], top + 0.6, P), { tone: "hi" }));
  out.push(L(k.onTop(red, top + 0.6, P), { tone: "red" }));
  const pA = clockVec(240, 7.5);
  const pB = clockVec(310, 7.5);
  out.push(label(RES[0] + pA[0], RES[1] + pA[1], rad(240), "0", 4, "hi"));
  out.push(label(RES[0] + pB[0], RES[1] + pB[1], rad(310), "40", 4, "hi"));
  out.push(label(RES[0], RES[1] + 12.5, 0, "RESERVA", 2.8, "mid"));
  const dc = SUB_R;
  out.push(L(k.ring(dc[0], dc[1], 25, top, P, 64) + k.ring(dc[0], dc[1], 32.5, top, P, 64), { tone: "mid" }));
  const dticks = [];
  for (let d = 1; d <= 31; d++) {
    const a = rad(((d - 1) * 360) / 31 - 90);
    dticks.push(k.lineOnTop([dc[0] + Math.cos(a) * 25, dc[1] + Math.sin(a) * 25], [dc[0] + Math.cos(a) * 27, dc[1] + Math.sin(a) * 27], top, P));
    if (d % 2 === 1) {
      const p = clockVec(((d - 1) * 360) / 31, 29.8);
      out.push(label(dc[0] + p[0], dc[1] + p[1], rad(((d - 1) * 360) / 31), String(d), 3.6, "hi"));
    }
  }
  out.push(L(dticks.join(""), { tone: "hi" }));
  out.push(`<path class="night" d="${k.ring(MOON[0], MOON[1], 16, top + 0.7, P, 48)}"/>`);
  const clip = G.circleOf(frameZ(MOON[0], MOON[1], top + 0.7), 0, 15, P);
  const stars = [];
  for (const [dx, dy] of [[-9, -6], [-5, 7], [3, -10], [9, 3], [0, 1], [11, -5], [-11, 2], [5, 10]]) stars.push(at([MOON[0] + dx, MOON[1] + dy, top + 0.8]));
  out.push(`<clipPath id="moon-clip"><path d="${clip}"/></clipPath><g clip-path="url(#moon-clip)"><g class="stars">${k.dotsSvg(stars, { size: 0.8, tone: "mid" })}</g><g data-moon>${moonSvg(0.4)}</g></g>`);
  out.push(label(-32, -26, 0, "ANATOMY", 5.6, "hi"));
  out.push(label(0, 121, 0, "AUTOMÁTICO", 3.8, "mid"));
  for (const p of [[44, -38], [-44, 38]]) out.push(`<path class="knob" d="${k.ring(p[0], p[1], 4.4, top + 0.4, P, 20)}"/>`);
  put("dial", top + 0.7, [0, 0, top], out.join(""), -50);
  for (const [id, c, len] of [["h24", SUB_T, 21], ["dow", SUB_L, 12], ["date", SUB_R, 24], ["res", RES, 13]]) {
    const z = top + 0.9;
    const handSvg = [poly(capsule([c[0], c[1] + 4], [c[0], c[1] - len], 1.6), z, 0.8, { tone: "hi", crease: "none" }, 0), S(k.cylinder(c[0], c[1], 2.2, z, 1, P, 14), { tone: "hi", crease: "lo" })];
    put("dial", z + 1, [c[0], c[1], z], `<g data-sub="${id}" transform="${rotAt(c[0], c[1], z, 0)}">${handSvg.join("")}</g>`, 0);
  }
}
function moonSvg(p) {
  const out = [];
  for (const k2 of [-1, 0, 1]) {
    const cx = MOON[0] + (p - 0.5) * 59 + k2 * 59;
    if (Math.abs(cx - MOON[0]) > 34) continue;
    out.push(`<path class="moon" d="${k.ring(cx, MOON[1] + 1, 10, ZD + 2.8, P, 32)}"/>`);
  }
  return out.join("");
}

function hands() {
  const st = { tone: "hi", crease: "lo", lit: true };
  const hour = [[0, 10], [-1.2, 0], [-3.4, -24], [-2.8, -40], [0, -62], [2.8, -40], [3.4, -24], [1.3, 0]];
  const minute = [[0, 12], [-1.1, 0], [-1.2, -62], [-2.6, -88], [0, -124], [2.6, -88], [1.2, -62], [1.1, 0]];
  const mk = (pts, z, h, id) => `<g data-hand="${id}" transform="${rotAt(0, 0, z, 0)}"><g class="ink">${poly(pts, z, h, st, 0.3)}${id === "hour" ? L(k.onTop(circleRing([0, -49], 4.2, 18), z + h, P, true), { tone: "lo" }) : ""}</g></g>`;
  put("hands", 49, [0, 0, 49], mk(hour, 48, 1.8, "hour"), 0);
  put("hands", 52, [0, 0, 52], mk(minute, 51, 1.8, "min"), 1);
  const chrono = [];
  chrono.push(poly([[-0.5, 24], [-0.5, -128], [0.5, -128], [0.5, 24]], 54, 1.0, { tone: "lit", crease: "none" }));
  chrono.push(poly(circleRing([0, 22], 3.4, 16), 54, 1.0, { tone: "lit", crease: "lo" }));
  put("hands", 55, [0, 0, 55], `<g data-hand="chrono" transform="${rotAt(0, 0, 54, 0)}">${chrono.join("")}</g>`, 2);
  const sec = [];
  sec.push(poly([[-0.6, 28], [-0.6, -126], [0.6, -126], [0.6, 28]], 57, 1.2, { tone: "hi", crease: "none" }));
  sec.push(poly(circleRing([0, 30], 4.6, 20), 57, 1.2, { tone: "hi", crease: "lo" }));
  sec.push(L(k.onTop(circleRing([0, 30], 2.4, 14), 58.2, P, true), { tone: "lo" }));
  put("hands", 58, [0, 0, 58], `<g data-hand="sec" transform="${rotAt(0, 0, 57, 0)}">${sec.join("")}</g>`, 3);
  put("hands", 59, [0, 0, 59], S(k.cylinder(0, 0, 5.4, 58, 1.8, P, 28, 0.3), { tone: "hi", crease: "lo" }), 4);
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
  const z = -26;
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: -164, y: -164, w: 328, d: 328, r: 164 }, z, 2, P)}" style="filter:blur(10px)"/>`];
  out.push(S(ringSolid(z, 8, 118, 164, 120), { tone: "hi", crease: "lo" }));
  out.push(L(k.ring(0, 0, 118, z + 8, P, 96) + k.ring(0, 0, 112, z + 4, P, 96), { tone: "lo" }));
  const bolts = [];
  for (let i = 0; i < 8; i++) bolts.push(at([...polar(0, 0, 144, rad(22.5 + 45 * i)), z + 8]));
  out.push(k.dotsSvg(bolts, { size: 1.4, tone: "mid" }));
  out.push(L(k.ring(0, 0, 144, z + 8, P, 96), { tone: "faint" }));
  out.push(`<path class="glass" d="${k.ring(0, 0, 117, z + 5, P, 96)}"/>`);
  out.push(L(k.ring(0, 0, 100, z + 5, P, 96) + k.ring(0, 0, 96, z + 5, P, 96), { tone: "faint" }));
  const gl = [];
  for (let i = 0; i <= 16; i++) gl.push(polar(0, 0, 104, rad(200 + (60 * i) / 16)));
  for (let i = 16; i >= 0; i--) gl.push(polar(8, 6, 86, rad(200 + (60 * i) / 16)));
  out.push(`<path class="glare" d="${k.onTop(gl, z + 5.1, P, true)}"/>`);
  put("back", z + 8, [0, 0, z + 8], out.join(""), KEY_BACK - 2);
}

const FACE = Math.atan2(k.towardViewer(P)[1], k.towardViewer(P)[0]);
function halfRing(r0, r1, front, n = 48) {
  const a0 = FACE + (front ? -Math.PI / 2 : Math.PI / 2);
  const out = [];
  for (let i = 0; i <= n; i++) out.push(polar(0, 0, r1, a0 + (Math.PI * i) / n));
  for (let i = n; i >= 0; i--) out.push(polar(0, 0, r0, a0 + (Math.PI * i) / n));
  return out;
}
const seamCover = (r0, r1, z, h = 10) =>
  [FACE - Math.PI / 2, FACE + Math.PI / 2]
    .map((a) => {
      const po = polar(0, 0, r1 - 1.4, a);
      const pi = polar(0, 0, r0 + 0.6, a);
      return `<path class="seam" d="${k.lineOnTop(polar(0, 0, r0 + 0.3, a), polar(0, 0, r1 - 0.3, a), z, P)}"/><path class="seam" d="${seg([po[0], po[1], z], [po[0], po[1], z - h + 0.6])}"/><path class="seam" d="${seg([pi[0], pi[1], z], [pi[0], pi[1], z - h + 0.6])}"/>`;
    })
    .join("");
const Z_CASE0 = -18;
const Z_CASE1 = 50;
const KEY_BACK = -1e6;
const KEY_FRONT = 1e6;

function caseMiddle() {
  const halo = `<path class="iso-halo" d="${k.haloOf({ x: -166, y: -166, w: 332, d: 332, r: 166 }, Z_CASE0, 2, P)}" style="filter:blur(10px)"/>`;
  put("case", Z_CASE0, [0, 0, Z_CASE0], halo, KEY_BACK - 5);
  const h = Z_CASE1 - Z_CASE0;
  const wall = S(ringSolid(Z_CASE0, h, 150, 166, 120), { tone: "mid", crease: "lo" });
  put("case", Z_CASE1, [0, -100, Z_CASE1], wall, KEY_BACK);
  const aIn = FACE + Math.PI / 2;
  const inTop = [];
  const inBot = [];
  for (let i = 0; i <= 60; i++) {
    const p = polar(0, 0, 150, aIn + (Math.PI * i) / 60);
    inTop.push(at([p[0], p[1], Z_CASE1]));
    inBot.push(at([p[0], p[1], Z_CASE0]));
  }
  const innerWall = `<path style="fill:var(--anatomy-shade-1);stroke:var(--anatomy-shade-1);stroke-width:.6" d="${k.pathOf([...inTop, ...inBot.slice().reverse()], true)}"/>` + L(k.pathOf(inBot), { tone: "faint" });
  put("case", Z_CASE1, [0, -100, Z_CASE1], innerWall, KEY_BACK + 1);
  const opening = k.ring(0, 0, 150, Z_CASE1, P, 96);
  const front = [`<clipPath id="nearclip"><path clip-rule="evenodd" d="M-3000 -3000H6000V6000H-3000Z${opening}Z"/></clipPath><g clip-path="url(#nearclip)">${wall}</g>`];
  front.push(L(k.sideArc(0, 0, 166, 6, P, 60) + k.sideArc(0, 0, 166, 26, P, 60), { tone: "faint" }));
  put("case", Z_CASE1, [0, 100, Z_CASE1], front.join(""), KEY_FRONT);
  const lug = (sx, sy) => {
    const xi = 84;
    const xo = 108;
    const arc = [];
    for (let i = 0; i <= 6; i++) {
      const x = xi + ((xo - xi) * i) / 6;
      arc.push([sx * x, sy * Math.sqrt(166 * 166 - x * x)]);
    }
    const pts = [...arc, [sx * xo, sy * 190], [sx * 96, sy * 214], [sx * xi, sy * 206]];
    const svg = [poly(pts, -6, 22, { tone: "mid", crease: "lo" }, 0.8, false)];
    svg.push(dotsAt([[sx * 94, sy * 196, 16]], { tone: "hi", size: 1.2 }));
    svg.push(L([-1, 0, 1].map((i) => k.onTop(capsule([sx * (92 + i * 5), sy * 150], [sx * (94 + i * 4), sy * 190], 2.4), 16, P, true)).join(""), { tone: "lo" }));
    return svg.join("");
  };
  for (const sx of [-1, 1]) {
    put("case", 6, [sx * 48, -190, 6], lug(sx, -1), KEY_BACK - 100);
    put("case", 6, [sx * 48, 190, 6], lug(sx, 1), KEY_FRONT + 100);
  }
  put("case", 16, [-172, 0, 16], poly([[-182, -16], [-164, -16], [-164, 16], [-182, 16]], 8, 16, { tone: "hi", crease: "lo" }, 0.6) + L(k.lineOnTop([-178, -10], [-178, 10], 24, P), { tone: "lo", free: true }), KEY_FRONT + 20);
  put("case", 16, [-168, 26, 16], dotsAt([[-166, 30, 18], [-166, -30, 18]], { tone: "hi", size: 1.3 }) + L(k.ring(-166, 30, 3, 18, P, 14) + k.ring(-166, -30, 3, 18, P, 14), { tone: "mid" }), KEY_FRONT + 25);
  const crown = [];
  const F = frameX(166, 0, 16);
  crown.push(S(G.solidOf([[0, 6], [10, 6]], F, P), { tone: "mid", crease: "none" }));
  crown.push(S(G.solidOf([[-1, 9], [2, 9]], frameX(166, 0, 16), P), { tone: "hi", crease: "lo" }));
  const F2 = frameX(176, 0, 16);
  crown.push(S(G.solidOf([[0, 10.5], [3, 10.5], [3, 9], [14, 9], [14, 10.5], [16, 10.5]], F2, P), { tone: "hi", crease: "lo", inner: L(G.ribsOf(F2, 3, 14, 9, 24, P, { seams: true }), { tone: "faint" }) }));
  put("crown", 16, [130, 0, 16], S(G.solidOf([[0, 2.2], [66, 2.2]], frameX(100, 0, 16), P), { tone: "mid", crease: "none" }), 0);
  put("crown", 16, [184, 0, 16], `<g data-crown>${crown.join("")}</g>`, KEY_FRONT + 50);
  for (const [id, deg2] of [["start", 60], ["reset", 120]]) {
    const dir = [Math.sin(rad(deg2)), -Math.cos(rad(deg2))];
    const base = [dir[0] * 165, dir[1] * 165];
    const Fp = G.frameAlong([base[0], base[1], 16], [dir[0], dir[1], 0]);
    const stem = S(G.solidOf([[0, 4.6], [14, 4.6]], Fp, P), { tone: "mid", crease: "none" });
    const head = S(G.solidOf([[14, 7.2], [26, 7.2], [26, 6]], Fp, P), { tone: "hi", crease: "lo", inner: L(G.arcOf(Fp, 18, 7.2, P) + G.arcOf(Fp, 22, 7.2, P), { tone: "faint" }) });
    put(id === "start" ? "pushS" : "pushR", 16, [base[0] + dir[0] * 14, base[1] + dir[1] * 14, 16], `<g data-pusher="${id}" data-dir="${dir[0].toFixed(3)},${dir[1].toFixed(3)}" class="push">${stem}${head}</g>`, KEY_FRONT + 40);
  }
}

function strap() {
  const z = -6;
  const t = 22;
  const W = 166;
  const top = z + t;
  const Y0 = 140;
  const piece = (sign, len, wEnd, round, holes) => {
    const y0 = sign * Y0;
    const y1 = y0 + sign * len;
    const pts = [[-W / 2, y0], [W / 2, y0]];
    if (round) {
      const r = wEnd / 2;
      const yc = y1 - sign * r;
      pts.push([r, yc]);
      for (let i = 1; i < 12; i++) pts.push([r * Math.cos((Math.PI * i) / 12), yc + sign * r * Math.sin((Math.PI * i) / 12)]);
      pts.push([-r, yc]);
    } else pts.push([wEnd / 2, y1], [-wEnd / 2, y1]);
    const svg = [poly(pts, z, t, { tone: "mid", crease: "lo" }, 1.4, false)];
    const cell = [];
    const rows = Math.floor((len - (round ? 80 : 34)) / 40);
    for (let r = 0; r < rows; r++) {
      const ya = y0 + sign * (14 + r * 40);
      const frac = (r + 0.5) / rows;
      const w = W - (W - wEnd) * frac - 26;
      for (const cx of [-w / 4, w / 4]) cell.push(k.planOutline({ x: cx - w / 4 + 2, y: Math.min(ya, ya + sign * 33), w: w / 2 - 4, d: 33, r: 6 }, top, P, 3));
    }
    svg.push(L(cell.join(""), { tone: "faint" }));
    const stitches = [];
    for (let d = 8; d < len - (round ? 70 : 12); d += 9) {
      const hw = (W - (W - wEnd) * (d / len)) / 2 - 6;
      stitches.push(at([-hw, y0 + sign * d, top]), at([hw, y0 + sign * d, top]));
    }
    svg.push(k.dotsSvg(stitches, { size: 0.9, tone: "hi" }));
    if (holes) {
      const hs = [];
      for (let i = 0; i < 9; i++) hs.push(k.planOutline({ x: -6, y: y0 + sign * (len * 0.39 + i * 41.5) - 2.6, w: 12, d: 5.2, r: 1.8 }, top, P, 3));
      svg.push(L(hs.join(""), { tone: "hi" }));
      svg.push(label2(-52, y0 + sign * len * 0.3, top, Math.PI / 2, "Genuine Leather", 8.5));
    }
    return svg;
  };
  const yB = -(Y0 + 640);
  const up = piece(-1, 628, 156, false, false);
  const keep = [];
  for (const dy of [105, 168]) keep.push(S(k.slabOf({ x: -90, y: yB + dy - 5, w: 180, d: 10, r: 4.9 }, z - 1, t + 3, P, 6, 1.5), { tone: "mid", crease: "lo" }));
  const bk = (x, y, w, d, h = 10, zz = z + 2) => S(k.slabOf({ x, y, w, d, r: Math.min(w, d) / 2 - 0.1 }, zz, h, P, 6, 1.5), { tone: "hi", crease: "lo" });
  const buckle = [bk(-92, yB - 82, 12, 96), bk(80, yB - 82, 12, 96), bk(-92, yB - 82, 184, 12), bk(-92, yB + 2, 184, 12), bk(-4, yB - 82, 8, 84, 6, top)];
  put("strapT", 8, [0, -400, 6], `<g class="strap">${up.join("")}${keep.join("")}</g><g class="buckle">${buckle.join("")}</g>`, -2e6);
  put("strapB", 8, [0, 500, 6], `<g class="strap">${piece(1, 880, 142, true, true).join("")}</g>`, KEY_FRONT - 200);
}
function loops() {
  const W = 166;
  const T = 22;
  const RW = 380;
  const ZC = 5 - Math.sqrt(RW * RW - 140 * 140);
  const th0 = Math.asin(140 / RW);
  const th1 = (58 * Math.PI) / 180;
  const N = 28;
  const view = [Math.cos(rad(75)) * Math.cos(rad(55)), Math.sin(rad(75)) * Math.cos(rad(55)), Math.sin(rad(55)) * ZS];
  const facing = (n) => n[0] * view[0] + n[1] * view[1] + n[2] * view[2];
  const SH = ["var(--anatomy-shade-0)", "var(--anatomy-shade-1)", "var(--anatomy-shade-2)", "var(--anatomy-shade-3)", "var(--anatomy-top)"];
  const up = theme === "dark" ? 1 : 0;
  const tone = (f) => SH[Math.min(4, (f > 0.8 ? 4 : f > 0.62 ? 3 : f > 0.42 ? 2 : f > 0.2 ? 1 : 0) + up)];
  const f1 = (v) => v.toFixed(1);
  for (const sign of [-1, 1]) {
    const w3 = (x, th, r) => [x, sign * r * Math.sin(th), ZC + r * Math.cos(th)];
    const faces = [];
    const addFace = (pts3, normal, fill, extra = "") => {
      const c = pts3.reduce((a2, q) => [a2[0] + q[0] / pts3.length, a2[1] + q[1] / pts3.length, a2[2] + q[2] / pts3.length], [0, 0, 0]);
      const d = "M" + pts3.map((q) => at(q).map(f1).join(" ")).join("L") + "Z";
      faces.push({ depth: k.depthOf(c, P), svg: `<path d="${d}" style="fill:${fill};stroke:${fill};stroke-width:.7;stroke-linejoin:round"${extra}/>` });
    };
    for (let i = 0; i < N; i++) {
      const ta = th0 + ((th1 - th0) * i) / N;
      const tb = th0 + ((th1 - th0) * (i + 1)) / N;
      const tm = (ta + tb) / 2;
      const nOut = [0, sign * Math.sin(tm), Math.cos(tm)];
      const fo = facing(nOut);
      const ro = RW + T / 2;
      const ri = RW - T / 2;
      if (fo > 0) addFace([w3(-W / 2, ta, ro), w3(-W / 2, tb, ro), w3(W / 2, tb, ro), w3(W / 2, ta, ro)], nOut, tone(fo));
      else addFace([w3(-W / 2, ta, ri), w3(-W / 2, tb, ri), w3(W / 2, tb, ri), w3(W / 2, ta, ri)], nOut, SH[up]);
      addFace([w3(W / 2, ta, ro), w3(W / 2, tb, ro), w3(W / 2, tb, ri), w3(W / 2, ta, ri)], [1, 0, 0], SH[up]);
    }
    const te = th1;
    const tn = [0, sign * Math.cos(te), -Math.sin(te)];
    if (facing(tn) > 0) addFace([w3(-W / 2, te, RW + T / 2), w3(W / 2, te, RW + T / 2), w3(W / 2, te, RW - T / 2), w3(-W / 2, te, RW - T / 2)], tn, SH[1 + up]);
    faces.sort((a2, b2) => a2.depth - b2.depth);
    const out = faces.map((f) => f.svg);
    const creases = [];
    const stitch = [];
    for (let i = 0; i <= N * 2; i++) {
      const th = th0 + ((th1 - th0) * i) / (N * 2);
      const nOut = [0, sign * Math.sin(th), Math.cos(th)];
      if (facing(nOut) <= 0) continue;
      const ro = RW + T / 2 + 0.3;
      for (const x of [-W / 2 + 8, W / 2 - 8]) stitch.push(at(w3(x, th, ro)));
      if (i % 9 === 4) creases.push(k.pathOf([at(w3(-W / 2 + 18, th, ro)), at(w3(W / 2 - 18, th, ro))]));
    }
    const edgeL = [];
    const edgeR = [];
    for (let i = 0; i <= N; i++) {
      const th = th0 + ((th1 - th0) * i) / N;
      if (facing([0, sign * Math.sin(th), Math.cos(th)]) <= 0) continue;
      edgeL.push(at(w3(-W / 2, th, RW + T / 2)));
      edgeR.push(at(w3(W / 2, th, RW + T / 2)));
    }
    if (edgeL.length > 1) out.push(`<path class="iso-line" data-tone="hi" d="${k.pathOf(edgeL)}"/><path class="iso-line" data-tone="hi" d="${k.pathOf(edgeR)}"/>`);
    out.push(k.dotsSvg(stitch, { size: 0.9, tone: "hi" }));
    if (creases.length) out.push(`<path class="iso-line" data-tone="lo" data-free="" d="${creases.join("")}" style="opacity:.5"/>`);
    put(sign < 0 ? "loopT" : "loopB", 8, [0, sign * 300, 4], `<g class="strap">${out.join("")}</g>`, sign < 0 ? -2e6 : KEY_FRONT - 200);
  }
}
function label2(x, y, z, a, text, size) {
  return k.faceTextSvg(textMatrix(x, y, z, a, size), text, { size, tone: "lo", anchor: "middle" });
}
function pins() {
  for (const sy of [-1, 1]) {
    const F = frameX(-106, sy * 176, 5);
    const svg = S(G.solidOf([[0, 2.4], [212, 2.4]], F, P), { tone: "hi", crease: "none" }) + S(G.solidOf([[0, 3.4], [6, 3.4]], F, P), { tone: "mid", crease: "none" });
    put(sy < 0 ? "strapT" : "strapB", 5, [0, sy * 176, 5], svg, sy < 0 ? -3e6 : KEY_FRONT - 300);
  }
}

function leafPoly(a, r) {
  const c = polar(0, 0, r, a);
  const t = [Math.cos(a + Math.PI / 2), Math.sin(a + Math.PI / 2)];
  const rr = [Math.cos(a), Math.sin(a)];
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const u = (i / 8) * 2 - 1;
    const w = 3.1 * (1 - u * u);
    pts.push([c[0] + t[0] * u * 5.2 + rr[0] * w, c[1] + t[1] * u * 5.2 + rr[1] * w]);
  }
  for (let i = 7; i >= 1; i--) {
    const u = (i / 8) * 2 - 1;
    const w = 3.1 * (1 - u * u);
    pts.push([c[0] + t[0] * u * 5.2 - rr[0] * w, c[1] + t[1] * u * 5.2 - rr[1] * w]);
  }
  return pts;
}
function bezel() {
  const z = Z_CASE1;
  const h = 10;
  const leaves = { back: [], front: [] };
  for (let i = 0; i < 44; i++) {
    const a = (TAU * i) / 44;
    for (const [r, off] of [[148, 0], [158, 0.5]]) {
      const aa = a + (off * TAU) / 44;
      (Math.cos(aa - FACE) > 0.05 ? leaves.front : leaves.back).push(k.onTop(leafPoly(aa, r), z + h, P, true));
      void off;
    }
  }
  const ringTop = [S(ringSolid(ZD + 2, z - ZD - 2, 140, 150, 120), { tone: "hi", crease: "lo" }), S(ringSolid(z, h, 140, 166, 120), { tone: "hi", crease: "lo" })];
  ringTop.push(L(k.ring(0, 0, 166, z + 5, P, 96) + k.ring(0, 0, 140, z + h, P, 96), { tone: "faint" }));
  ringTop.push(L([...leaves.back, ...leaves.front].join(""), { tone: "lo" }));
  const front = ringTop;
  put("bezel", z + h, [0, 100, z + h], front.join(""), KEY_FRONT + 10);
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
strap();
loops();
pins();
bezel();

const subOf = (key) => (key < -1.5e6 ? -3 : key > 1.5e6 ? 3 : key < -5e5 ? -1 : key > 5e5 ? 1 : 0);
const sorted = items.sort((a, b) => a.key - b.key);
const groups = [];
for (const it of sorted) {
  const last = groups[groups.length - 1];
  const sub = subOf(it.key);
  if (last && last.asm === it.asm && last.sub === sub) last.svg.push(it.svg);
  else groups.push({ asm: it.asm, sub, svg: [it.svg] });
}
const body = groups.map((g, i) => `<g class="it" data-a="${g.asm}" data-sub="${g.sub}" data-rank="${i}" data-m="${(MV[g.asm] || [0, 0]).join(",")},${ASM[ID[g.asm]].lift}">${g.svg.join("")}</g>`).join("");


const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A complete automatic mechanical chronograph wristwatch with a leather strap, seen from above. The dial shows hours, minutes and seconds with real time, a weekday sub-dial, a date sub-dial, year and month windows and a moon phase, all following the real date. Two pushers run a chronograph hand and the crown sets the time. Inside, a balance wheel beats four times a second and a gear train with true tooth counts drives the hands. A button takes the watch apart in layers: bezel, hands, dial, motion works, bridges, balance, escapement, gear train, barrel, plate, rotor and case back.",
  body,
});

const live = `
const P = ${JSON.stringify(P)};
const ASM = ${JSON.stringify(ASM)};
const ORDER = ${JSON.stringify(ORDER)};
const GEARS = ${JSON.stringify(gearTable)};
const BAL = ${JSON.stringify(BAL)}, LEVER = ${JSON.stringify(LEVER)};
const SPRING_CENTER = ${JSON.stringify(BAR)}, HAM_P = ${JSON.stringify(HAM_P)};
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
const nodes = [...svgRoot.querySelectorAll(".it[data-a]")].map((el) => ({ el, a: el.dataset.a, m: el.dataset.m.split(",").map(Number), rank: Number(el.dataset.rank) }));
const nodeParent = nodes[0].el.parentNode;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const VB0 = ${JSON.stringify(VB0)}, VB1 = ${JSON.stringify(VB1)}, VBM = ${JSON.stringify(VBM)}, STAGE1 = ${JSON.stringify(STAGE1)};
let domOrder = "";
const buttons = [...document.querySelectorAll("[data-pick]")];
const gearEls = GEARS.map((g) => ({ ...g, el: svgRoot.querySelector('[data-gear="' + g.id + '"]') }));
const handEls = Object.fromEntries([...svgRoot.querySelectorAll("[data-hand]")].map((e) => [e.dataset.hand, e]));
const leverEl = svgRoot.querySelector("[data-lever]");
const balEl = svgRoot.querySelector("[data-balance]");
const rollerEl = svgRoot.querySelector("[data-roller]");
const hairEl = svgRoot.querySelector("[data-hair]");
const rotorEl = svgRoot.querySelector("[data-rotor]");
const crownEl = svgRoot.querySelector("[data-crown]");
const subEls = Object.fromEntries([...svgRoot.querySelectorAll("[data-sub]")].map((e) => [e.dataset.sub, e]));
const yearEl = svgRoot.querySelector("[data-year]"), monthEl = svgRoot.querySelector("[data-month]"), moonEl = svgRoot.querySelector("[data-moon]");
const pushEls = Object.fromEntries([...svgRoot.querySelectorAll("[data-pusher]")].map((e) => [e.dataset.pusher, e]));
const chronoBtn = document.querySelector("[data-chrono-btn]"), resetBtn = document.querySelector("[data-chrono-reset]");
const MONTHS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
const WEEKDAYS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
const SUB_T = ${JSON.stringify(SUB_T)}, RES = ${JSON.stringify(RES)}, SUB_L = ${JSON.stringify(SUB_L)}, SUB_R = ${JSON.stringify(SUB_R)}, MOON = ${JSON.stringify(MOON)}, ZD = ${ZD};
const springEl = svgRoot.querySelector("[data-spring]");
const spring = Object.fromEntries(ASM.map((a) => [a.id, { x: 0, v: 0, target: 0, at: 0 }]));
const now = new Date();
const state = { stage: 0, vb: VB0.slice(), apart: false, sel: null, clock: 0, touring: false, tourT: 0, idle: 0, say: "", tsim: now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000, offset: 0, slow: false, mid: new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(), chrono: { running: false, t: 0 }, press: null, moonP: -1, cal: "", setting: false, reserve: 36, rotor: 0, rotorV: 0, wound: 0.8, crownX: 0, dragging: false };
let frame = 0, last = 0, visible = false;
const STAGGER = 0.035, STIFF = 64, DRAG = 14.2;
const AMP = 270, LEVER_AMP = 7.5, BEAT = 8;
const ease = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const RATIO = { C: 1, B: -1 / 8, T: -8, F: 60, E: -960, I: -60, S: 60, M: -1 / 3, H: 1 / 12, Cd: 1 };
const LIFTS = Object.fromEntries(ASM.map((a) => [a.id, a.lift]));
function setStage(n) {
  if (state.stage === n) return;
  const opening = n > state.stage;
  const together = n === 1 || state.stage === 1 && n === 0;
  state.stage = n;
  state.apart = n > 0;
  const tg = (id) => (n === 2 ? 1 : n === 1 && STAGE1[id] ? STAGE1[id] / LIFTS[id] : 0);
  const seq = (opening ? ORDER : [...ORDER].reverse()).filter((id) => spring[id].target !== tg(id));
  seq.forEach((id, i) => { spring[id].target = tg(id); spring[id].at = state.clock + (together ? 0 : i * STAGGER); spring[id].armed = true; });
  run();
}
const setApart = (on) => setStage(on ? 2 : 0);
function select(id) {
  state.sel = id;
  if (!id) svgRoot.removeAttribute("data-focus"); else svgRoot.setAttribute("data-focus", "");
  const grp = { strapT: ["strapT", "loopT"], strapB: ["strapB", "loopB"] }[id] || [id];
  nodes.forEach((n) => (grp.includes(n.a) ? n.el.setAttribute("data-on", "") : n.el.removeAttribute("data-on")));
  buttons.forEach((b) => b.toggleAttribute("data-on", b.dataset.pick === id));
  const a = ASM.find((x) => x.id === id);
  info.innerHTML = a ? "<strong>" + a.name + "</strong>" + (a.does ? " — " + a.does : "") : "Clique em uma peça para ver o nome dela.";
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
  if (state.chrono.running) state.chrono.t += dt * speed;
  if (!state.setting) { state.tsim += dt * speed; state.reserve = Math.max(0, state.reserve - dt * speed / 3600); }
  const w = state.rotorV;
  if (Math.abs(w) > 0.01) {
    state.rotor += w * dt; state.rotorV *= Math.exp(-dt / 2.2);
    state.reserve = Math.min(45, state.reserve + Math.abs(w) * dt / 360 * 0.3);
  }
  return moving;
}
let lastW = -1, hamAng = 0;
const hamEl = svgRoot.querySelector("[data-ham]");
function moonSvg(p) {
  const out = [];
  for (const k2 of [-1, 0, 1]) {
    const cx = MOON[0] + (p - 0.5) * 59 + k2 * 59;
    if (Math.abs(cx - MOON[0]) > 34) continue;
    out.push('<path class="moon" d="' + ring(cx, MOON[1] + 1, 10, ZD + 2.8, P, 32) + '"/>');
  }
  return out.join("");
}
function calendar(td) {
  planRotSet(subEls.h24, SUB_T[0], SUB_T[1], 45, (((td % 86400) + 86400) % 86400) / 86400 * 360);
  const ms = state.mid + td * 1000;
  const d = new Date(ms);
  const key = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
  if (key !== state.cal) {
    state.cal = key;
    if (yearEl) yearEl.textContent = String(d.getFullYear());
    if (monthEl) monthEl.textContent = MONTHS[d.getMonth()];
    const idx = (d.getDay() + 6) % 7;
    planRotSet(subEls.dow, SUB_L[0], SUB_L[1], 45, idx * 360 / 7);
    planRotSet(subEls.date, SUB_R[0], SUB_R[1], 45, (d.getDate() - 1) * 360 / 31);
    state.dateText = WEEKDAYS[idx] + " " + d.getDate() + " " + MONTHS[d.getMonth()].toLowerCase();
  }
  planRotSet(subEls.res, RES[0], RES[1], 45, 240 + Math.min(1, state.reserve / 45) * 70);
  const jd = ms / 86400000 + 2440587.5;
  const age = (((jd - 2451550.1) % 29.530588) + 29.530588) % 29.530588;
  const p = Math.round(age / 29.530588 * 400) / 400;
  if (p !== state.moonP) { state.moonP = p; moonEl.innerHTML = moonSvg(p); state.moonText = "lua " + Math.round((1 - Math.cos(2 * Math.PI * p)) / 2 * 100) + " %"; }
}
function planRotSet(el, cx, cy, z, a) { el.setAttribute("transform", planRot(iso, P, cx, cy, z, a)); }
function pressPusher(id) {
  const el = pushEls[id];
  const [dx, dy] = el.dataset.dir.split(",").map(Number);
  el.setAttribute("transform", translateAlong(P, [-dx * 4, -dy * 4, 0]));
  setTimeout(() => el.removeAttribute("transform"), 160);
}
function chronoStartStop() { state.chrono.running = !state.chrono.running; pressPusher("start"); chronoBtn.textContent = state.chrono.running ? "Parar cronógrafo" : "Iniciar cronógrafo"; run(); }
function chronoReset() { if (state.chrono.running) return; state.chrono.t = 0; pressPusher("reset"); run(); }
function draw() {
  for (const n of nodes) {
    const share = spring[n.a] ? spring[n.a].x : 0;
    if (share === 0) n.el.removeAttribute("transform"); else n.el.setAttribute("transform", translateAlong(P, [n.m[0] * share, n.m[1] * share, n.m[2] * share]));
    const aim = spring[n.a] ? spring[n.a].target * n.m[2] : 0;
    n.lvl = aim > 60 || aim < -60 ? Math.round(aim / 40) * 40 : 0;
  }
  const fade = { loopT: 1 - clamp01(spring.strapT.x * 4), strapT: clamp01(spring.strapT.x * 4), loopB: 1 - clamp01(spring.strapB.x * 4), strapB: clamp01(spring.strapB.x * 4), pins: clamp01(spring.pins.x * 4) };
  for (const n of nodes) if (n.a in fade) n.el.style.opacity = String(fade[n.a].toFixed(3));
  const goal = [VB0, VBM, VB1][state.stage];
  for (let i = 0; i < 4; i++) state.vb[i] += (goal[i] - state.vb[i]) * 0.07;
  svgRoot.setAttribute("viewBox", state.vb.map((v) => v.toFixed(2)).join(" "));
  const byLevel = [...nodes].sort((a, b) => a.lvl - b.lvl || a.rank - b.rank);
  const sig = byLevel.map((n) => n.rank).join(",");
  if (sig !== domOrder) { domOrder = sig; for (const n of byLevel) nodeParent.appendChild(n.el); }
  const T = state.tsim, beats = T * BEAT, td0 = T + state.offset;
  const nb = Math.floor(beats), ph = beats - nb, s = ease(0, 0.26, ph);
  const thetaC = (nb + s) / 80;
  const thetaD = thetaC + state.offset * 0.1;
  const val = (arbor) => (arbor === "Cd" || arbor === "M" || arbor === "H" ? thetaD : thetaC);
  for (const g of gearEls) {
    const ang = g.arbor === "Ch" ? (state.chrono.t % 60) * 6 : (((g.off + RATIO[g.arbor] * val(g.arbor)) % 360) + 360) % 360;
    g.el.setAttribute("transform", planRot(iso, P, g.cx, g.cy, g.z, ang));
  }
  const rot = (el, cx, cy, z, a) => el.setAttribute("transform", planRot(iso, P, cx, cy, z, a));
  rot(handEls.hour, 0, 0, 48, thetaD / 12);
  rot(handEls.min, 0, 0, 51, thetaD);
  rot(handEls.chrono, 0, 0, 54, (state.chrono.t % 60) * 6);
  rot(handEls.sec, 0, 0, 57, 60 * thetaC);
  calendar(td0);
  const bal = AMP * Math.sin(Math.PI * beats);
  rot(balEl, BAL[0], BAL[1], 29.5, bal);
  rot(rollerEl, BAL[0], BAL[1], 25, bal);
  const lv = LEVER_AMP * (nb % 2 === 0 ? 1 : -1) * (2 * s - 1);
  rot(leverEl, LEVER[0], LEVER[1], 25, lv);
  hairEl.setAttribute("d", hairPath(bal));
  rot(rotorEl, 0, 0, -22, state.rotor);
  hamAng += ((state.chrono.running ? -6 : 0) - hamAng) * 0.2;
  if (hamEl) rot(hamEl, HAM_P[0], HAM_P[1], 25, hamAng);
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
  const label = state.sel ? ASM.find((a) => a.id === state.sel).name : hms + " · " + (state.dateText || "") + " · " + (state.moonText || "") + (state.chrono.running || state.chrono.t > 0 ? " · cron " + state.chrono.t.toFixed(1) + " s" : "") + (state.slow ? " · câmera lenta" : "") + (state.setting ? " · acertando" : "") + (phase ? " · " + phase : "");
  if (label !== state.say) { state.say = label; readout.textContent = label; }
  clockEl.textContent = hms + "  ·  reserva " + Math.round(state.reserve) + " h";
  toggle.textContent = ["Desmontar", "Desmontar mais", "Montar"][state.stage];
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
  step(dt);
  draw();
  frame = visible ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
const take = () => { state.touring = false; state.idle = 0; };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
toggle.addEventListener("click", () => { take(); setStage((state.stage + 1) % 3); });
chronoBtn.addEventListener("click", () => { take(); chronoStartStop(); });
resetBtn.addEventListener("click", () => { take(); chronoReset(); });
slowBtn.addEventListener("click", () => { take(); state.slow = !state.slow; slowBtn.toggleAttribute("data-on", state.slow); });
crownBtn.addEventListener("click", () => { take(); state.setting = !state.setting; crownBtn.toggleAttribute("data-on", state.setting); crownBtn.textContent = state.setting ? "Empurrar coroa" : "Puxar coroa"; });
shakeBtn.addEventListener("click", () => { take(); state.rotorV += 900; run(); });
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
});
const endDrag = () => { state.dragging = false; dragLast = null; };
stage.addEventListener("pointerup", endDrag);
stage.addEventListener("pointercancel", endDrag);
function pickAt(event) {
  for (const el of document.elementsFromPoint(event.clientX, event.clientY)) {
    if (!stage.contains(el) || el.classList.contains("iso-halo")) continue;
    const g = el.closest(".it[data-a]");
    if (!g || (g.style.opacity !== "" && parseFloat(g.style.opacity) < 0.3)) continue;
    return g.dataset.a === "loopT" ? "strapT" : g.dataset.a === "loopB" ? "strapB" : g.dataset.a;
  }
  return null;
}
stage.addEventListener("click", (event) => { take(); const id = pickAt(event); select(id && id !== state.sel ? id : null); });
stage.addEventListener("keydown", (event) => {
  const ids = ASM.map((a) => a.id);
  const at = state.sel ? ids.indexOf(state.sel) : -1;
  if (event.key === " " || event.key === "Enter") { event.preventDefault(); take(); setStage((state.stage + 1) % 3); }
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
.tf-info{flex:1 1 0;margin:0;color:var(--anatomy-text);font-size:13px;line-height:1.5;min-width:0}
.tf-info strong{color:var(--anatomy-strong)}
.tf-bar{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);width:min(720px,calc(100vw - 24px));box-sizing:border-box;margin:0;padding:10px 12px;flex-wrap:nowrap;align-items:flex-start;background:var(--anatomy-card);border:1px solid var(--anatomy-faint);z-index:10}
.tf-bar .tf-btn{flex:none}
.tf-parts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1px;margin-top:10px;background:var(--anatomy-faint);border:1px solid var(--anatomy-faint)}
.tf-part{display:flex;gap:10px;align-items:baseline;text-align:left;font:13px/1.35 ui-sans-serif,system-ui,sans-serif;color:var(--anatomy-text);background:var(--anatomy-card);border:0;padding:10px 12px;cursor:pointer}
.tf-part i{font:normal 11px var(--anatomy-mono);color:var(--anatomy-muted)}
.tf-part:hover,.tf-part[data-on]{background:var(--anatomy-face);color:var(--anatomy-strong)}
.tf-part[data-on] i{color:var(--anatomy-strong)}
.iso-stage{touch-action:pan-y;cursor:pointer;user-select:none}
.iso-fill{fill-rule:evenodd}
.iso-plate-corners,.iso-legend{display:none!important}
.tf-parts,.tf-clock,.tf-bar .tf-btn:not([data-toggle]){display:none!important}
.push{cursor:pointer}
.seam{fill:none;stroke:var(--anatomy-top);stroke-width:2.6;stroke-linecap:butt}
.stars circle{fill:var(--anatomy-paper)!important;opacity:.9!important}
.glare{fill:#fff;opacity:.22;pointer-events:none}
.glass{fill:var(--anatomy-blue);opacity:.18;stroke:none;pointer-events:none}
.night{fill:var(--anatomy-blue);opacity:.6;stroke:var(--anatomy-blue);stroke-width:.5}
.moon{fill:var(--anatomy-hi);stroke:none}
.knob{fill:var(--anatomy-paper);stroke:var(--anatomy-mid);stroke-width:.6}
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
  title: "Relógio de alta complicação",
  hint: "Clique em uma peça para ver o nome · botão: desmontar",
  readout: "28.800 alt/h",
  keys: [
    { mark: "lit", label: "Conjunto selecionado" },
    { mark: "raised", label: "Os outros conjuntos" },
  ],
  caption:
    "Relógio automático de alta complicação, inteiro e montado, com caixa em ouro rosé de bisel gravado, algarismos romanos e mostrador ondulado. Mostra a hora, as 24 horas, o dia da semana, a reserva de marcha, a data e a fase da lua do seu aparelho. Cor e acabamento inspirados no desenho de referência. Os pushers comandam o cronógrafo e a coroa ajusta a hora. Por dentro, o balanço oscila 4 vezes por segundo e a rodagem, com número de dentes real, move os ponteiros. O botão separa as camadas, de cima para baixo.",
  body: `<div class="iso-stage" tabindex="0" role="group" aria-label="Relógio mecânico: Espaço desmonta ou monta, setas escolhem um conjunto, Escape limpa a seleção" aria-valuetext="nenhum conjunto selecionado">${svg}</div>`,
});
const bodyHtml = `<style>${PANEL_CSS}</style>${fig}<div class="tf-bar"><button type="button" class="tf-btn" data-toggle>Desmontar</button><button type="button" class="tf-btn" data-chrono-btn>Iniciar cronógrafo</button><button type="button" class="tf-btn" data-chrono-reset>Zerar</button><button type="button" class="tf-btn" data-slow>Câmera lenta ⅛</button><button type="button" class="tf-btn" data-crown-btn>Puxar coroa</button><button type="button" class="tf-btn" data-shake>Agitar o pulso</button><span class="tf-clock" data-clock></span><p class="tf-info" data-info></p></div>${legend}`;
writeFileSync(join(HERE, OUT), k.pageHtml({ title: "Relógio de alta complicação", theme, body: bodyHtml, script: kitScript() + live, width: 1040 }));
console.log("wrote", OUT, "items:", items.length, "gears:", gearTable.length);
