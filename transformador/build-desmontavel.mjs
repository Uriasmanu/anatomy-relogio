import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";
import { kitScript } from "./scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const OUT = theme === "light" ? "transformador-desmontavel-light.html" : "transformador-desmontavel.html";

const WIDTH = 1000;
const HEIGHT = 700;

const WALL = 5;
const Z_BASE = 38;
const Z_FLOOR = 44;
const Z_WALL = 248;
const Z_LID = 262;
const TX0 = -54;
const TX1 = 146;
const TY0 = -150;
const TY1 = 270;

const ASM = [
  { id: "hv", name: "Buchas de alta tensão", does: "Isoladores de porcelana por onde a alta tensão da rede entra no transformador, atravessando a tampa sem tocar o aço. Saem inclinadas para afastar as fases entre si." },
  { id: "lv", name: "Buchas de baixa tensão", does: "Fazem o mesmo no lado de baixa tensão. São menores porque a tensão é menor. Normalmente são três fases e o neutro." },
  { id: "cons", name: "Conservador de óleo", does: "Reservatório de expansão: recebe o óleo quando ele esquenta e dilata. Liga-se ao tanque pelo relé Buchholz e respira por um filtro de sílica-gel." },
  { id: "lid", name: "Tampa e corrimão", does: "Fecha o tanque, apoia as buchas e o conservador e traz os tampões de inspeção, os olhais de içamento e o corrimão de acesso." },
  { id: "core", name: "Parte ativa", does: "Núcleo de aço-silício com as bobinas de alta e baixa tensão, onde a tensão é de fato transformada. Não aparece no modelo 3D de referência: foi incluída aqui para mostrar o que a tampa esconde." },
  { id: "radR", name: "Radiadores do lado das buchas", does: "Trocadores de calor: o óleo quente sobe pelo coletor de cima, desce pelos painéis, que o resfriam, e volta pelo de baixo." },
  { id: "radL", name: "Radiadores do lado oposto", does: "Segundo banco de painéis, ligado ao outro lado da cuba. Os dois bancos juntos definem quanto calor o transformador dissipa." },
  { id: "cab", name: "Armário de comando e escada", does: "Armário com termômetros, controle dos ventiladores e bornes de comando. Os eletrodutos levam os cabos até ele; a escada dá acesso à tampa." },
  { id: "tank", name: "Cuba e base", does: "Cuba de aço que guarda o óleo isolante e a parte ativa. A base de perfis a apoia no chão e as flanges recebem os coletores dos radiadores." },
];
const OPEN_ORDER = ["hv", "lv", "cons", "lid", "core", "radR", "radL", "cab"];

const HV = [
  { base: [111, -67], phi: -45 },
  { base: [101, 43], phi: 0 },
  { base: [112, 142], phi: 38 },
];
const HV_LIFT = 255;
const HV_TILT = (16 * Math.PI) / 180;
const hvAxis = (phi) => {
  const p = (phi * Math.PI) / 180;
  return [Math.sin(HV_TILT) * Math.cos(p), Math.sin(HV_TILT) * Math.sin(p), Math.cos(HV_TILT)];
};
const LV = [[-17, -21], [-20, 32], [-15, 84], [-15, 148]];
const CONS = { x0: -45, len: 192, y: -208, z: 392, r: 32 };
const RAD = { y0: -98, pitch: 47.3, count: 8, thick: 36, z0: 76, z1: 252, depth: 64 };
const RAD_R_X = 160;
const RAD_L_X = -130;
const CAB = { x: 19, y: 270, w: 97, d: 22, z0: 87, z1: 191 };
const CORE_Y = [-35, 60, 155];
const CORE_X = 46;

const MOVE = {
  hv: null,
  lv: [0, 0, 235],
  cons: [0, -80, 70],
  lid: [0, 0, 200],
  core: [0, 0, 140],
  radR: [125, 0, 0],
  radL: [-125, 0, 0],
  cab: [0, 100, 0],
  tank: [0, 0, 0],
};

const HV_MOVES = HV.map((h) => G.mul3(hvAxis(h.phi), HV_LIFT));
const BOXES = [
  { box: [-62, -158, -6, 155, 282, 262], move: [0, 0, 0] },
  { box: [-58, -154, 248, 158, 278, 345], move: MOVE.lid },
  { box: [-5, -100, 54, 97, 216, 236], move: MOVE.core },
  { box: [70, -110, 330, 190, 200, 500], move: HV_MOVES[1] },
  { box: [70, -110, 330, 190, 200, 500], move: HV_MOVES[0] },
  { box: [70, -110, 330, 190, 200, 500], move: HV_MOVES[2] },
  { box: [-42, -40, 286, 12, 170, 375], move: MOVE.lv },
  { box: [-45, -270, 262, 160, -140, 430], move: MOVE.cons },
  { box: [148, -120, 70, 224, 255, 255], move: MOVE.radR },
  { box: [-132, -120, 70, -62, 255, 255], move: MOVE.radL },
  { box: [-45, 270, 0, 116, 300, 250], move: MOVE.cab },
];
const fitPoints = BOXES.flatMap(({ box: [x0, y0, z0, x1, y1, z1], move }) =>
  [0, 1].flatMap((share) => k.boxCorners({ x: x0 + move[0] * share, y: y0 + move[1] * share, w: x1 - x0, d: y1 - y0, r: 0 }, z0 + move[2] * share, z1 + move[2] * share)));
const P = k.fitProjection(fitPoints, WIDTH, HEIGHT, { pad: 22, azimuth: 35, elevation: 30 });

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const seg = (a, b) => k.segment(a, b, P);
const slab = (plan, z, h, steps = 3, bevel = 0.4) => k.slabOf(plan, z, h, P, steps, bevel);
const cyl = (x, y, r, z, h, steps = 24, bevel = 0) => k.cylinder(x, y, r, z, h, P, steps, bevel);
const dotsAt = (pts, style = {}) => D(pts.map(at), { size: 0.5, ...style });
const frameX = (x, y, z) => G.frameAlong([x, y, z], [1, 0, 0]);
const frameY = (x, y, z) => G.frameAlong([x, y, z], [0, 1, 0]);
const frameZ = (x, y, z) => G.frameAlong([x, y, z], [0, 0, 1]);
const V = G.viewOf(P);

const items = [];
const put = (layer, asm, point, svg, bias = 0, move = null) =>
  items.push({ layer, asm, key: k.depthOf(point, P) + bias, svg, move, lift: move ? G.dot3(move, V) : 0 });

function perimeterDots(plan, z, inset, gap) {
  const x0 = plan.x + inset;
  const x1 = plan.x + plan.w - inset;
  const y0 = plan.y + inset;
  const y1 = plan.y + plan.d - inset;
  const nx = Math.round((x1 - x0) / gap);
  const ny = Math.round((y1 - y0) / gap);
  const out = [];
  for (let i = 0; i <= nx; i++) out.push([x0 + ((x1 - x0) * i) / nx, y0, z], [x0 + ((x1 - x0) * i) / nx, y1, z]);
  for (let i = 1; i < ny; i++) out.push([x0, y0 + ((y1 - y0) * i) / ny, z], [x1, y0 + ((y1 - y0) * i) / ny, z]);
  return out;
}

const ribsX = (xf, ys, z0, z1) => ys.map((y) => seg([xf, y, z0], [xf, y, z1])).join("");

function ground() {
  const PAD = { x: -150, y: -180, w: 395, d: 500, r: 12 };
  const svg = [`<path class="iso-halo" d="${k.haloOf(PAD, -6, 6, P)}"/>`, S(slab(PAD, -6, 6, 8, 1), { tone: "lo" })];
  svg.push(L(k.planOutline(k.insetPlan(PAD, 6), 0, P), { tone: "faint" }));
  const bolts = k.corners(PAD, 12);
  svg.push(L(bolts.map(([x, y]) => k.ring(x, y, 2.6, 0, P, 16)).join(""), { tone: "lo" }));
  svg.push(D(bolts.map(([x, y]) => at([x, y, 0])), { size: 0.55 }));
  put(0, null, [0, 0, 0], svg.join(""), 0);
}

function tank() {
  const ring = (plan) => S(slab(plan, 0, Z_BASE, 2, 0.5), { tone: "lo" });
  put(2, "tank", [46, -152, 20], ring({ x: -62, y: -158, w: 217, d: 14, r: 1 }), -300);
  put(2, "tank", [-60, 60, 20], ring({ x: -62, y: -144, w: 14, d: 412, r: 1 }), -300);
  put(4, "tank", [46, 275, 20], [ring({ x: -62, y: 268, w: 217, d: 14, r: 1 }), dotsAt([-40, 0, 40, 80, 120].map((x) => [x + 0, 282, Z_BASE - 8]), { tone: "mid" })].join(""), 20);
  const rightRing = [ring({ x: 141, y: -144, w: 14, d: 412, r: 1 })];
  const gussets = [];
  for (let y = -128; y <= 250; y += 30) gussets.push(S(slab({ x: 155, y: y - 3, w: 8, d: 6, r: 0.4 }, 2, Z_BASE - 6, 1, 0.2), { tone: "lo", crease: "lo" }));
  put(4, "tank", [148, 60, 20], rightRing.join("") + gussets.join(""), 10);
  const floor = { x: TX0, y: TY0, w: TX1 - TX0, d: TY1 - TY0, r: 2 };
  put(2, "tank", [46, 60, Z_BASE], S(slab(floor, Z_BASE, Z_FLOOR - Z_BASE, 3, 0.4), { tone: "mid" }), -400);
  const wallH = Z_WALL - Z_FLOOR;
  const back = [S(slab({ x: TX0, y: TY0, w: TX1 - TX0, d: WALL, r: 0.5 }, Z_FLOOR, wallH, 2, 0.4), { tone: "mid" })];
  for (const x of [-30, 10, 50, 90, 130]) back.push(S(slab({ x: x - 4, y: TY0 + WALL, w: 8, d: 3, r: 0.3 }, Z_FLOOR, wallH, 1, 0), { tone: "mid", crease: "none" }));
  put(2, "tank", [46, TY0, 150], back.join(""), 0);
  const left = [S(slab({ x: TX0, y: TY0 + WALL, w: WALL, d: TY1 - TY0 - WALL, r: 0.5 }, Z_FLOOR, wallH, 2, 0.4), { tone: "mid" })];
  for (const y of [-90, -20, 60, 140, 220]) left.push(S(slab({ x: TX0 + WALL, y: y - 4, w: 3, d: 8, r: 0.3 }, Z_FLOOR, wallH, 1, 0), { tone: "mid", crease: "none" }));
  left.push(L(seg([TX0 + WALL, TY1, Z_FLOOR], [TX0 + WALL, TY1, Z_WALL]), { tone: "lo" }));
  put(2, "tank", [TX0, 60, 150], left.join(""), 5);
  const right = [S(slab({ x: TX1 - WALL, y: TY0 + WALL, w: WALL, d: TY1 - TY0 - WALL, r: 0.5 }, Z_FLOOR, wallH, 2, 0.4), { tone: "mid" })];
  const ribYs = [-100, -30, 40, 110, 180, 245];
  for (const y of ribYs) right.push(S(slab({ x: TX1, y: y - 4, w: 5, d: 8, r: 0.3 }, Z_FLOOR, wallH, 1, 0), { tone: "mid", crease: "none" }));
  for (const y of [-20, 170]) {
    for (const z of [92, 238]) {
      const F = frameX(TX1, y, z);
      right.push(S(G.disc(0, 7, 13, F, P), { tone: "lo" }));
      right.push(dotsAt(Array.from({ length: 8 }, (_, i) => G.pointOf(F, 7, 10, (i / 8) * Math.PI * 2)), { tone: "mid" }));
      right.push(L(G.circleOf(F, 7, 6.5, P), { tone: "faint" }));
    }
  }
  put(4, "tank", [TX1, 60, 150], right.join(""), 0);
  const front = [S(slab({ x: TX0, y: TY1 - WALL, w: TX1 - TX0, d: WALL, r: 0.5 }, Z_FLOOR, wallH, 2, 0.4), { tone: "mid" })];
  for (const x of [-38, 128]) front.push(S(slab({ x: x - 4, y: TY1, w: 8, d: 5, r: 0.3 }, Z_FLOOR, wallH, 1, 0), { tone: "mid", crease: "none" }));
  put(4, "tank", [46, TY1, 150], front.join(""), 10);
  for (const [x, y] of [[-58, -154], [-58, 276], [152, -154], [152, 276]]) {
    put(x > 50 ? (y > 0 ? 4 : 2) : y > 0 ? 4 : 2, "tank", [x, y, 20], S(slab({ x: x - 5, y: y - 5, w: 10, d: 10, r: 1.5 }, 0, 12, 3, 0.3), { tone: "lo" }), 30);
  }
}

function lid() {
  const LIDP = { x: -58, y: -154, w: 216, d: 432, r: 16 };
  const svg = [`<path class="iso-halo" d="${k.haloOf(LIDP, Z_LID, 1, P)}" style="filter:blur(6px)"/>`];
  svg.push(S(slab(LIDP, Z_WALL, Z_LID - Z_WALL, 6, 1), { tone: "mid" }));
  svg.push(L(k.planOutline(k.insetPlan(LIDP, 4), Z_LID, P, 6), { tone: "faint" }));
  svg.push(dotsAt(perimeterDots(LIDP, Z_LID, 4, 16), { tone: "mid" }));
  put(6, "lid", [50, 60, Z_LID], svg.join(""), -400, MOVE.lid);
  const mh = (x, y, r) => {
    const out = [S(cyl(x, y, r + 3, Z_LID, 3, 36), { tone: "lo" }), S(cyl(x, y, r, Z_LID + 3, 3, 36, 0.3), { tone: "mid" })];
    out.push(dotsAt(Array.from({ length: 12 }, (_, i) => [x + (r + 1.5) * Math.cos((i / 12) * Math.PI * 2), y + (r + 1.5) * Math.sin((i / 12) * Math.PI * 2), Z_LID + 3]), { tone: "mid" }));
    out.push(S(slab({ x: x - 7, y: y - 2.5, w: 14, d: 5, r: 2 }, Z_LID + 6, 2.4, 3, 0.2), { tone: "mid" }));
    return out.join("");
  };
  put(6, "lid", [0, -90, Z_LID], mh(0, -90, 24), 0, MOVE.lid);
  put(6, "lid", [40, 220, Z_LID], mh(40, 220, 18), 2, MOVE.lid);
  for (const [x, y] of HV.map((h) => h.base)) {
    const out = [S(cyl(x, y, 29, Z_LID, 2.4, 36), { tone: "lo" }), dotsAt(Array.from({ length: 12 }, (_, i) => [x + 26.5 * Math.cos((i / 12) * Math.PI * 2), y + 26.5 * Math.sin((i / 12) * Math.PI * 2), Z_LID + 2.4]), { tone: "mid" })];
    put(6, "lid", [x, y, Z_LID], out.join(""), 1, MOVE.lid);
  }
  for (const [x, y] of LV) {
    const out = [S(cyl(x, y, 19, Z_LID, 2.4, 30), { tone: "lo" }), dotsAt(Array.from({ length: 8 }, (_, i) => [x + 16.8 * Math.cos((i / 8) * Math.PI * 2), y + 16.8 * Math.sin((i / 8) * Math.PI * 2), Z_LID + 2.4]), { tone: "mid" })];
    put(6, "lid", [x, y, Z_LID], out.join(""), 1, MOVE.lid);
  }
  for (const [x, y] of [[-48, -144], [-48, 266], [148, -144], [148, 266]]) {
    const lug = [S(slab({ x: x - 6, y: y - 1.5, w: 12, d: 3, r: 1 }, Z_LID, 14, 3, 0.3), { tone: "mid" }), L(k.sideRing([x, y + 1.5, Z_LID + 9], 3, "y", P, 16), { tone: "lo" })];
    put(6, "lid", [x, y, Z_LID], lug.join(""), 3, MOVE.lid);
  }
  const POLE_Z = Z_LID + 80;
  const poleYs = [-110, -10, 90, 202];
  for (let i = 0; i < poleYs.length - 1; i++) {
    const F = frameY(43, poleYs[i], POLE_Z);
    const len = poleYs[i + 1] - poleYs[i];
    const body = S(G.solidOf([[0, 3.2], [len, 3.2]], F, P), { tone: "mid", crease: "none" });
    put(7, "lid", [43, (poleYs[i] + poleYs[i + 1]) / 2, POLE_Z], body, 4, MOVE.lid);
  }
  for (const y of [-110, -40, 30, 100, 160, 202]) {
    const post = S(slab({ x: 41.2, y: y - 1.8, w: 3.6, d: 3.6, r: 0.4 }, Z_LID, 80, 1, 0.1), { tone: "mid", crease: "none" });
    const plate = S(slab({ x: 36, y: y - 5, w: 14, d: 10, r: 1.5 }, Z_LID, 2.4, 2, 0), { tone: "lo" });
    put(7, "lid", [43, y, Z_LID + 40], plate + post, 5, MOVE.lid);
  }
  for (const x of [-50, 150]) {
    const ys = [-140, -70, 0, 70, 140, 210, 262];
    ys.forEach((y) => put(7, "lid", [x, y, Z_LID + 20], S(slab({ x: x - 1.4, y: y - 1.4, w: 2.8, d: 2.8, r: 0.3 }, Z_LID, 40, 1, 0), { tone: "mid", crease: "none" }), 3, MOVE.lid));
    for (let i = 0; i < ys.length - 1; i++) {
      const rail = [S(slab({ x: x - 1.4, y: ys[i], w: 2.8, d: ys[i + 1] - ys[i], r: 0.3 }, Z_LID + 38, 2.8, 1, 0.1), { tone: "mid", crease: "none" }), S(slab({ x: x - 1.2, y: ys[i], w: 2.4, d: ys[i + 1] - ys[i], r: 0.3 }, Z_LID + 20, 2.4, 1, 0.1), { tone: "lo", crease: "none" })];
      put(7, "lid", [x, (ys[i] + ys[i + 1]) / 2, Z_LID + 30], rail.join(""), 3.5, MOVE.lid);
    }
  }
}

function bushingHV(base, phi, index) {
  const a = hvAxis(phi);
  const [x, y] = base;
  const F = G.frameAlong([x, y, Z_LID], a);
  const turret = G.solidOf([[0, 22], [66, 22], [66, 25.5], [74, 25.5]], F, P);
  const mid = [x + a[0] * 40, y + a[1] * 40, Z_LID + a[2] * 40];
  put(6, "lid", mid, S(turret, { tone: "mid", crease: "lo" }), 2 + index * 0.2, MOVE.lid);
  const profile = [[74, 18], [78, 18], [78, 10.6]];
  const sheds = 15;
  const s0 = 82;
  const pitch = 9.2;
  for (let i = 0; i < sheds; i++) {
    const s = s0 + i * pitch;
    profile.push([s, 10.6], [s + 0.6, 17.2], [s + 3.2, 17.2], [s + 4.4, 12.4], [s + 6.4, 10.6]);
  }
  const top = s0 + sheds * pitch;
  profile.push([top, 10.6], [top + 4, 7.4], [top + 14, 7.4], [top + 14, 3.4], [top + 26, 3.4]);
  const body = S(G.solidOf(profile, F, P), { tone: "hi" });
  const bolts = dotsAt(Array.from({ length: 10 }, (_, i) => G.pointOf(F, 78, 15.2, (i / 10) * Math.PI * 2)).filter((pt) => G.dot3(G.sub3(pt, [x, y, Z_LID]), V) > 0), { tone: "mid" });
  put(7, "hv", [x + a[0] * 120, y + a[1] * 120, Z_LID + a[2] * 120], body + bolts, index * 0.2, G.mul3(a, HV_LIFT));
}

function bushingLV(x, y) {
  const F = frameZ(x, y, Z_LID);
  const base = S(G.solidOf([[0, 14], [20, 14], [20, 16], [24, 16]], F, P), { tone: "mid", crease: "lo" });
  put(6, "lid", [x, y, Z_LID + 12], base, 2, MOVE.lid);
  const profile = [[24, 12], [27, 12], [27, 5.6]];
  for (let i = 0; i < 7; i++) {
    const s = 31 + i * 8;
    profile.push([s, 5.6], [s + 0.5, 9.4], [s + 2.8, 9.4], [s + 3.8, 6.6], [s + 5.6, 5.6]);
  }
  profile.push([89, 5.6], [91, 4], [103, 4], [103, 2.4], [111, 2.4]);
  const body = S(G.solidOf(profile, F, P), { tone: "hi" });
  put(7, "lv", [x, y, Z_LID + 60], body, 0, MOVE.lv);
}

function conservator() {
  const m = MOVE.cons;
  const F = frameX(CONS.x0, CONS.y, CONS.z);
  const r = CONS.r;
  const L0 = CONS.len;
  const profile = [[0, r - 7, 1], [2.5, r - 3.4, 1], [6, r - 0.8, 1], [10, r, 1], [L0 - 10, r, 1], [L0 - 6, r - 0.8, 1], [L0 - 2.5, r - 3.4, 1], [L0, r - 7, 1]];
  const seams = [48, 96, 144].map((s) => G.arcOf(F, s, r, P)).join("");
  const body = [S(G.solidOf(profile, F, P), { tone: "hi", inner: L(seams, { tone: "faint" }) })];
  const Fe = frameX(CONS.x0 + L0, CONS.y, CONS.z);
  body.push(S(G.disc(-0.4, 0.6, 12, frameX(CONS.x0 + L0, CONS.y, CONS.z + 4), P), { tone: "mid" }));
  const Fg = frameX(CONS.x0 + L0 + 0.6, CONS.y, CONS.z + 4);
  body.push(L(G.circleOf(Fg, 0, 10, P) + G.circleOf(Fg, 0, 8.2, P), { tone: "lo" }));
  const ticks = [];
  for (let i = 0; i <= 8; i++) {
    const a = ((-120 + 30 * i) * Math.PI) / 180;
    const pt = (rr) => G.pointOf(Fg, 0, rr, Math.PI / 2 - a);
    ticks.push(k.pathOf([at(pt(8.2 - (i % 4 === 0 ? 3 : 1.8))), at(pt(8.2))]));
  }
  body.push(L(ticks.join(""), { tone: "mid" }));
  body.push(L(k.pathOf([at(G.pointOf(Fg, 0, 0, 0)), at(G.pointOf(Fg, 0, 6, Math.PI / 2 - ((-120 + 30 * 5.2) * Math.PI) / 180))]), { tone: "lit", free: "end" }));
  body.push(dotsAt(Array.from({ length: 14 }, (_, i) => G.pointOf(Fe, 0, r - 4.5, (i / 14) * Math.PI * 2)), { tone: "mid" }));
  put(7, "cons", [CONS.x0 + L0 - 20, CONS.y, CONS.z], body.join(""), 0, m);
  for (const x of [-12, 118]) {
    const strap = S(slab({ x: x - 7, y: CONS.y - r - 3, w: 14, d: 2 * r + 6, r: 4 }, CONS.z - r - 4, 6, 4, 0.2), { tone: "lo" });
    put(7, "cons", [x, CONS.y, CONS.z - r], strap, 1, m);
  }
  for (const x of [-35, 140]) {
    const from = [x, TY0 + 6, Z_LID];
    const to = [x, CONS.y + 12, CONS.z - r - 3];
    const d = G.sub3(to, from);
    const len = G.len3(d);
    const a = G.unit3(d);
    const u = [1, 0, 0];
    const v = G.cross3(a, u);
    const FS = G.frameOf(from, a, u, v);
    const strut = G.prismOf(FS, [[-4, -12], [4, -12], [4, 12], [-4, 12]], 0, len, P);
    const plate = S(slab({ x: x - 9, y: TY0 - 4, w: 18, d: 22, r: 1.5 }, Z_LID, 3, 3, 0.2), { tone: "lo" });
    put(7, "cons", [x, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2], plate + S(strut, { tone: "mid", crease: "lo" }), 2, m);
  }
  const pf = [-20, CONS.y + 6, CONS.z - r - 2];
  const pt = [-20, TY0 + 8, Z_LID + 6];
  const pd = G.sub3(pt, pf);
  const plen = G.len3(pd);
  const FP = G.frameAlong(pf, G.unit3(pd));
  const pipe = [S(G.solidOf([[0, 5.2], [plen, 5.2]], FP, P), { tone: "mid", crease: "none" })];
  pipe.push(S(G.solidOf([[plen * 0.42, 5.2], [plen * 0.42, 11.5], [plen * 0.62, 11.5], [plen * 0.62, 5.2]], FP, P), { tone: "hi", crease: "lo", inner: L(G.arcOf(FP, plen * 0.52, 11.5, P), { tone: "faint" }) }));
  pipe.push(S(G.solidOf([[0, 8], [3, 8]], FP, P), { tone: "lo" }));
  pipe.push(S(G.solidOf([[plen - 3, 8], [plen, 8]], FP, P), { tone: "lo" }));
  put(7, "cons", [-20, (pf[1] + pt[1]) / 2, (pf[2] + pt[2]) / 2], pipe.join(""), 3, m);
  const bx = 130;
  const by = CONS.y - r - 22;
  const breather = [S(G.solidOf([[0, 4.2], [28, 4.2]], G.frameAlong([bx, CONS.y - r + 4, CONS.z - 2], [0, -1, 0]), P), { tone: "mid", crease: "none" })];
  breather.push(S(cyl(bx, by, 10, CONS.z - 66, 56, 24), { tone: "hi", inner: L(k.sideArc(bx, by, 10, CONS.z - 52, P, 18) + k.sideArc(bx, by, 10, CONS.z - 28, P, 18), { tone: "faint" }) }));
  breather.push(S(cyl(bx, by, 12, CONS.z - 72, 7, 24), { tone: "mid" }));
  breather.push(S(cyl(bx, by, 6, CONS.z - 66 + 56, 6, 16), { tone: "mid", crease: "none" }));
  put(7, "cons", [bx, by, CONS.z - 30], breather.join(""), 0.5, m);
}

function radiators() {
  const build = (asm, xUnit, xHeader, outward) => {
    const order = [];
    const faceX = xUnit + RAD.depth;
    const hdr = [];
    for (const z of [90, 238]) {
      const F = frameY(xHeader, TY0 + 10, z);
      hdr.push(S(G.solidOf([[0, 5.6], [TY1 - TY0 - 20, 5.6]], F, P), { tone: "mid", crease: "lo" }));
    }
    for (let i = 0; i < RAD.count; i++) {
      const yc = RAD.y0 + RAD.pitch * i;
      const plan = { x: xUnit, y: yc - RAD.thick / 2, w: RAD.depth, d: RAD.thick, r: 1.5 };
      const unit = [S(slab(plan, RAD.z0, RAD.z1 - RAD.z0, 3, 0.6), { tone: "mid" })];
      unit.push(L(ribsX(faceX, Array.from({ length: 9 }, (_, j) => yc - RAD.thick / 2 + (RAD.thick * j) / 8), RAD.z0, RAD.z1), { tone: "lo" }));
      unit.push(L(seg([faceX, yc - RAD.thick / 2, 164], [faceX, yc + RAD.thick / 2, 164]), { tone: "faint" }));
      unit.push(S(slab({ x: xUnit + 2, y: yc - RAD.thick / 2 + 2, w: RAD.depth - 4, d: RAD.thick - 4, r: 1 }, RAD.z1, 3, 2, 0.2), { tone: "lo" }));
      unit.push(S(slab({ x: xUnit + 2, y: yc - RAD.thick / 2 + 2, w: RAD.depth - 4, d: RAD.thick - 4, r: 1 }, RAD.z0 - 3, 3, 2, 0.2), { tone: "lo" }));
      order.push({ yc, svg: unit.join("") });
    }
    const header = hdr.join("");
    return { order, header };
  };
  const R = build("radR", RAD_R_X, 154, 1);
  put(5, "radR", [RAD_R_X, -140, 90], R.header, -300, MOVE.radR);
  R.order.forEach(({ yc, svg }) => put(5, "radR", [RAD_R_X + 32, yc, 160], svg, 0, MOVE.radR));
  const Lb = build("radL", RAD_L_X, -63, -1);
  Lb.order.forEach(({ yc, svg }) => put(1, "radL", [RAD_L_X + 32, yc, 160], svg, 0, MOVE.radL));
  put(1, "radL", [-62, 60, 160], Lb.header, 400, MOVE.radL);
}

function cabinet() {
  const m = MOVE.cab;
  const plan = { x: CAB.x, y: CAB.y, w: CAB.w, d: CAB.d, r: 2 };
  const out = [S(slab(plan, CAB.z0, CAB.z1 - CAB.z0, 4, 0.8), { tone: "mid" })];
  out.push(S(slab({ x: CAB.x - 3, y: CAB.y - 2, w: CAB.w + 6, d: CAB.d + 5, r: 2 }, CAB.z1, 5, 4, 0.5), { tone: "lo" }));
  const yf = CAB.y + CAB.d;
  const door = { x: CAB.x + 8, w: CAB.w - 16 };
  out.push(S(slab({ x: door.x, y: yf, w: door.w, d: 2, r: 1.5 }, CAB.z0 + 8, CAB.z1 - CAB.z0 - 16, 3, 0.4), { tone: "mid", crease: "lo" }));
  const fp = (pts) => k.pathOf(pts.map(at), true);
  out.push(L(fp([[door.x + 6, yf + 2, CAB.z0 + 14], [door.x + door.w - 6, yf + 2, CAB.z0 + 14], [door.x + door.w - 6, yf + 2, CAB.z1 - 22], [door.x + 6, yf + 2, CAB.z1 - 22]]), { tone: "faint" }));
  const vents = [];
  for (let i = 0; i < 5; i++) {
    const z = CAB.z0 + 20 + i * 4;
    vents.push(fp([[door.x + 14, yf + 2, z], [door.x + 44, yf + 2, z], [door.x + 44, yf + 2, z + 1.8], [door.x + 14, yf + 2, z + 1.8]]));
  }
  out.push(L(vents.join(""), { tone: "lo" }));
  out.push(S(cyl(door.x + door.w - 10, yf + 2, 3.4, CAB.z0 + 52, 4, 14), { tone: "mid" }));
  out.push(S(slab({ x: door.x + 10, y: yf + 2, w: 30, d: 1, r: 0.8 }, CAB.z1 - 40, 14, 2, 0), { tone: "lo", crease: "none" }));
  out.push(L([[14, 7], [12, 9.5], [10, 12]].map(([w, dz]) => seg([door.x + 13, yf + 3, CAB.z1 - 40 + dz * 0.8], [door.x + 13 + w, yf + 3, CAB.z1 - 40 + dz * 0.8])).join(""), { tone: "lo", free: true }));
  out.push(dotsAt([[door.x + 3, yf + 2, CAB.z0 + 11], [door.x + door.w - 3, yf + 2, CAB.z0 + 11], [door.x + 3, yf + 2, CAB.z1 - 11], [door.x + door.w - 3, yf + 2, CAB.z1 - 11]], { tone: "mid" }));
  const hinges = [CAB.z0 + 20, CAB.z1 - 28].map((z) => S(slab({ x: door.x - 3, y: yf, w: 3, d: 3, r: 0.5 }, z, 8, 1, 0), { tone: "lo", crease: "none" }));
  out.push(hinges.join(""));
  put(5, "cab", [CAB.x + CAB.w / 2, CAB.y + CAB.d, 140], out.join(""), 0, m);
  for (const x of [34, 62]) {
    const F = frameZ(x, CAB.y + CAB.d / 2, 0);
    const cond = [S(G.solidOf([[0, 5], [CAB.z0 - 6, 5]], F, P), { tone: "mid", crease: "none" }), S(G.disc(CAB.z0 - 10, CAB.z0 - 6, 8, F, P), { tone: "lo" }), S(G.disc(0, 4, 8, F, P), { tone: "lo" })];
    put(5, "tank", [x, CAB.y + CAB.d / 2, 40], cond.join(""), -2, MOVE.tank);
  }
  const lad = [];
  const lx = [-42, -14];
  const stand = 6;
  const yL = TY1 + stand;
  for (const x of lx) lad.push(S(slab({ x: x - 1.8, y: yL, w: 3.6, d: 3.6, r: 0.5 }, 50, 200, 1, 0.2), { tone: "mid", crease: "none" }));
  for (let z = 62; z <= 240; z += 14) lad.push(S(slab({ x: lx[0], y: yL + 0.3, w: lx[1] - lx[0], d: 3, r: 0.5 }, z, 3, 1, 0.1), { tone: "lo", crease: "none" }));
  for (const z of [70, 150, 230]) for (const x of lx) lad.push(S(slab({ x: x - 1.5, y: TY1, w: 3, d: stand, r: 0.3 }, z, 4, 1, 0), { tone: "lo", crease: "none" }));
  put(5, "cab", [-28, yL, 150], lad.join(""), -1, m);
}

function core() {
  const m = MOVE.core;
  const R = 36;
  const zb = 62;
  const zt = 228;
  const yokeLow = { x: CORE_X - 44, y: -92, w: 88, d: 300, r: 1 };
  put(3, "core", [CORE_X, 60, zb], S(slab({ x: CORE_X - 50, y: -100, w: 100, d: 316, r: 2 }, zb - 8, 8, 3, 0.3), { tone: "lo" }), -420, m);
  const clampsB = [-48, 40].map((dx) => S(slab({ x: CORE_X + dx, y: -96, w: 8, d: 308, r: 0.8 }, zb, 18, 2, 0.3), { tone: "mid" }));
  put(3, "core", [CORE_X - 44, 60, zb], clampsB[0], -410, m);
  put(3, "core", [CORE_X + 44, 60, zb], clampsB[1], -405, m);
  put(3, "core", [CORE_X, 60, zb + 9], S(slab(yokeLow, zb, 18, 3, 0.4), { tone: "hi", crease: "lo" }), -400, m);
  CORE_Y.forEach((y, i) => {
    const svg = [];
    const z0 = zb + 18;
    const z1 = zt - 18;
    const pitch = (z1 - z0 - 6) / 8;
    svg.push(S(cyl(CORE_X, y, R + 1.5, z0, 3, 36), { tone: "lo" }));
    for (let d = 0; d < 8; d++) {
      const z = z0 + 3 + d * pitch;
      const lines = [z + pitch * 0.3, z + pitch * 0.62].map((h) => k.sideArc(CORE_X, y, R, h, P, 24)).join("");
      svg.push(S(cyl(CORE_X, y, R, z, pitch - 1.6, 36, 0.3), { tone: "hi", crease: "lo", inner: L(lines, { tone: "faint" }) }));
    }
    svg.push(S(cyl(CORE_X, y, R + 1.5, z1 - 3, 3, 36), { tone: "lo" }));
    put(3, "core", [CORE_X, y, 140], svg.join(""), i, m);
  });
  const top = [S(slab({ x: CORE_X - 44, y: -92, w: 88, d: 300, r: 1 }, zt - 18, 18, 3, 0.4), { tone: "hi", crease: "lo" })];
  for (let i = 0; i < 10; i++) top.push(L(seg([CORE_X - 44 + 3 + i * 8.4, -92, zt], [CORE_X - 44 + 3 + i * 8.4, 208, zt]), { tone: "faint" }));
  put(3, "core", [CORE_X, 60, zt - 9], top.join(""), 400, m);
  for (const dx of [-48, 40]) put(3, "core", [CORE_X + dx, 60, zt - 9], S(slab({ x: CORE_X + dx, y: -96, w: 8, d: 308, r: 0.8 }, zt - 18, 18, 2, 0.3), { tone: "mid" }), dx > 0 ? 410 : 405, m);
  const lift = [S(slab({ x: CORE_X - 14, y: 40, w: 28, d: 40, r: 2 }, zt, 6, 3, 0.3), { tone: "mid" }), L(k.ring(CORE_X, 60, 6, zt + 6, P, 22), { tone: "lo" }), dotsAt([[CORE_X - 9, 46, zt + 6], [CORE_X + 9, 46, zt + 6], [CORE_X - 9, 74, zt + 6], [CORE_X + 9, 74, zt + 6]], { tone: "mid" })];
  put(3, "core", [CORE_X, 60, zt + 3], lift.join(""), 420, m);
}

ground();
tank();
radiators();
core();
lid();
conservator();
HV.forEach((h, i) => bushingHV(h.base, h.phi, i));
LV.forEach(([x, y]) => bushingLV(x, y));
cabinet();


function layerHtml(layer) {
  const list = items.filter((i) => i.layer === layer).sort((a, b) => a.key - b.key);
  if (layer === 7) {
    return `<g data-layer="7">${list.map((i) => `<g class="it" data-a="${i.asm}" data-k="${i.key.toFixed(2)}" data-m="${i.move.map((v) => v.toFixed(2)).join(",")}">${i.svg}</g>`).join("")}</g>`;
  }
  const groups = [];
  for (const it of list) {
    const last = groups[groups.length - 1];
    if (last && last.asm === it.asm) last.svg.push(it.svg);
    else groups.push({ asm: it.asm, move: it.move, svg: [it.svg] });
  }
  return `<g data-layer="${layer}">${groups.map((g) => `<g class="it"${g.asm ? ` data-a="${g.asm}" data-m="${(g.move || [0, 0, 0]).map((v) => v.toFixed(2)).join(",")}"` : ""}>${g.svg.join("")}</g>`).join("")}</g>`;
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A power transformer that comes apart. A closed steel tank on a base frame carries eight radiator panels on each long side, three tilted high-voltage bushings and four low-voltage bushings on the lid, a conservator on slanted struts at one end and a control cabinet with a ladder at the other. Pressing the button lifts the bushings, conservator and lid, raises the core and coils out of the tank and slides the radiators and the cabinet away.",
  body: [0, 1, 2, 3, 4, 5, 6, 7].map(layerHtml),
});

const live = `
const P = ${JSON.stringify(P)};
const V = ${JSON.stringify(V)};
const ASM = ${JSON.stringify(ASM)};
const ORDER = ${JSON.stringify(OPEN_ORDER)};
const stage = document.querySelector(".iso-stage");
const svgRoot = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const toggle = document.querySelector("[data-toggle]");
const info = document.querySelector("[data-info]");
const live7 = svgRoot.querySelector('[data-layer="7"]');
const still = matchMedia("(prefers-reduced-motion: reduce)");
const nodes = [...svgRoot.querySelectorAll(".it[data-a]")].map((el) => ({ el, a: el.dataset.a, m: el.dataset.m.split(",").map(Number), k: Number(el.dataset.k), sort: el.parentNode === live7 }));
const sorted = nodes.filter((n) => n.sort);
const buttons = [...document.querySelectorAll("[data-pick]")];
const spring = Object.fromEntries(ASM.map((a) => [a.id, { x: 0, v: 0, target: 0, at: 0 }]));
const state = { apart: false, sel: null, clock: 0, touring: !still.matches, tourT: 0, idle: 0, say: "" };
let frame = 0, last = 0, visible = false;
const STAGGER = 0.035, STIFF = 64, DRAG = 14.2;
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
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
  info.textContent = a ? a.does : "Passe o mouse sobre uma peça ou escolha um conjunto abaixo. O botão desmonta e monta o transformador.";
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
  return moving;
}
let order = [];
function draw() {
  for (const n of nodes) {
    const share = n.a === "tank" ? 0 : spring[n.a].x;
    if (share === 0) n.el.removeAttribute("transform");
    else { const mx = n.m[0] * share, my = n.m[1] * share, mz = n.m[2] * share; n.el.setAttribute("transform", translateAlong(P, [mx, my, mz])); }
  }
  const keyed = sorted.map((n) => ({ n, key: n.k + dot(n.m, V) * spring[n.a].x })).sort((a, b) => a.key - b.key);
  const ids = keyed.map((e) => e.n);
  if (ids.some((n, i) => n !== order[i])) { order = ids; const frag = document.createDocumentFragment(); ids.forEach((n) => frag.appendChild(n.el)); live7.appendChild(frag); }
  const moving = ORDER.some((id) => spring[id].x !== spring[id].target || spring[id].armed);
  const open = ORDER.every((id) => spring[id].x === 1);
  const shut = ORDER.every((id) => spring[id].x === 0);
  const text = moving ? (state.apart ? "desmontando" : "montando") : open ? "desmontado · " + ASM.length + " conjuntos" : shut ? "montado · " + ASM.length + " conjuntos" : state.apart ? "desmontado" : "montado";
  const label = state.sel ? ASM.find((a) => a.id === state.sel).name : text;
  if (label !== state.say) { state.say = label; readout.textContent = label; }
  toggle.textContent = state.apart ? "Montar" : "Desmontar";
}
const TOUR = [...ORDER, "tank"];
function tour(dt) {
  state.tourT += dt;
  const cycle = 4 + 1.8 * TOUR.length + 2.2;
  const c = state.tourT % cycle;
  if (c < 1.6) { if (state.apart) setApart(false); if (state.sel) select(null); }
  else if (c < 4) setApart(true);
  else {
    const i = Math.floor((c - 4) / 1.8);
    if (i < TOUR.length) { if (state.sel !== TOUR[i]) select(TOUR[i]); }
    else { if (state.sel) select(null); if (c > cycle - 1.2) setApart(false); }
  }
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (state.touring) tour(dt);
  else { state.idle += dt; if (state.idle > 6 && !still.matches) { state.touring = true; state.tourT = 0; } }
  const moving = step(dt);
  draw();
  frame = visible && (moving || state.touring || ORDER.some((id) => spring[id].armed)) ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
const take = () => { state.touring = false; state.idle = 0; };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
toggle.addEventListener("click", () => { take(); setApart(!state.apart); });
buttons.forEach((b) => {
  b.addEventListener("click", () => { take(); select(state.sel === b.dataset.pick ? null : b.dataset.pick); if (!state.apart) setApart(true); });
  b.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") { take(); select(b.dataset.pick); } });
});
stage.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch") return;
  const hit = event.target.closest ? event.target.closest(".it[data-a]") : null;
  const id = hit && hit.dataset.a !== "tank" ? hit.dataset.a : hit ? "tank" : null;
  if (id !== state.sel) { take(); select(id); }
});
stage.addEventListener("pointerleave", () => { if (state.sel) select(null); });
stage.addEventListener("click", (event) => { const hit = event.target.closest(".it[data-a]"); take(); if (event.pointerType === "touch" && hit) { select(hit.dataset.a); return; } setApart(!state.apart); });
stage.addEventListener("keydown", (event) => {
  const ids = ASM.map((a) => a.id);
  const at = state.sel ? ids.indexOf(state.sel) : -1;
  if (event.key === " " || event.key === "Enter") { event.preventDefault(); take(); setApart(!state.apart); }
  else if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); take(); select(ids[(at + 1) % ids.length]); }
  else if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); take(); select(ids[(at - 1 + ids.length) % ids.length]); }
  else if (event.key === "Escape") { take(); select(null); }
  else if (event.key === "Home") { take(); setApart(false); }
  else if (event.key === "End") { take(); setApart(true); }
});
select(null);
visible = true; step(0); draw(); visible = false;
`;

const legend = `<div class="tf-parts">${ASM.map((a, i) => `<button type="button" class="tf-part" data-pick="${a.id}"><i>${String(i + 1).padStart(2, "0")}</i>${a.name}</button>`).join("")}</div>`;
const PANEL_CSS = `
.tf-bar{display:flex;flex-wrap:wrap;gap:14px 20px;align-items:center;margin-top:14px}
.tf-btn{font:500 13px/1 var(--anatomy-mono);color:var(--anatomy-strong);background:var(--anatomy-card);border:1px solid var(--anatomy-mid);padding:11px 18px;cursor:pointer;letter-spacing:.06em;text-transform:uppercase}
.tf-btn:hover{border-color:var(--anatomy-hi)}
.tf-btn:focus-visible,.iso-stage:focus-visible,.tf-part:focus-visible{outline:1px solid var(--anatomy-hi);outline-offset:3px}
.tf-info{flex:1;min-width:260px;margin:0;color:var(--anatomy-text);font-size:13px;line-height:1.55;min-height:3.1em}
.tf-parts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1px;margin-top:14px;background:var(--anatomy-faint);border:1px solid var(--anatomy-faint)}
.tf-part{display:flex;gap:10px;align-items:baseline;text-align:left;font:13px/1.35 ui-sans-serif,system-ui,sans-serif;color:var(--anatomy-text);background:var(--anatomy-card);border:0;padding:10px 12px;cursor:pointer}
.tf-part i{font:normal 11px var(--anatomy-mono);color:var(--anatomy-muted)}
.tf-part:hover,.tf-part[data-on]{background:var(--anatomy-face);color:var(--anatomy-strong)}
.tf-part[data-on] i{color:var(--anatomy-strong)}
.iso-stage{touch-action:pan-y;cursor:pointer;user-select:none}
.it[data-on] .iso-fill{fill:var(--anatomy-face)}
.it[data-on] .iso-top{fill:var(--anatomy-lit-top)}
.it[data-on] .iso-shade{fill:var(--anatomy-lit-shade)}
.it[data-on] .iso-edge{stroke:var(--anatomy-lit)}
.it[data-on] .iso-solid[data-seamless]>.iso-top{stroke:var(--anatomy-lit-top)}
.it[data-on] .iso-solid[data-seamless]>.iso-shade{stroke:var(--anatomy-lit-shade)}
[data-focus] .it:not([data-on]) .iso-edge[data-tone="hi"],[data-focus] .it:not([data-on]) .iso-line[data-tone="hi"]{stroke:var(--anatomy-mid)}
[data-focus] .it:not([data-on]) .iso-edge[data-tone="mid"],[data-focus] .it:not([data-on]) .iso-line[data-tone="mid"]{stroke:var(--anatomy-lo)}
[data-focus] .it:not([data-on]) .iso-edge[data-tone="lo"],[data-focus] .it:not([data-on]) .iso-line[data-tone="lo"]{stroke:var(--anatomy-faint)}
@media (max-width:560px){.iso-stage{overflow:hidden;margin:-14px -4px -22px}.iso-stage .iso-svg{width:128%;max-width:none;margin-left:-14%}}
`;

const fig = k.plateHtml({
  fig: "Fig 2",
  title: "Transformador desmontável",
  hint: "Clique ou toque: desmontar",
  readout: "montado · 9 conjuntos",
  keys: [
    { mark: "lit", label: "Conjunto selecionado" },
    { mark: "raised", label: "Os outros conjuntos" },
  ],
  caption:
    "Transformador de potência a óleo com a forma do modelo 3D de referência. Ao desmontar, as buchas e o conservador saem primeiro, depois a tampa, a parte ativa (núcleo e bobinas) sobe para fora da cuba e os radiadores e o armário de comando deslizam para os lados. Cada peça volta ao seu lugar na mesma ordem inversa.",
  body: `<div class="iso-stage" tabindex="0" role="group" aria-label="Transformador desmontável: Espaço desmonta ou monta, setas escolhem um conjunto, Escape limpa a seleção" aria-valuetext="nenhum conjunto selecionado">${svg}</div>`,
});
const body = `<style>${PANEL_CSS}</style>${fig}<div class="tf-bar"><button type="button" class="tf-btn" data-toggle>Desmontar</button><p class="tf-info" data-info></p></div>${legend}`;
writeFileSync(join(HERE, OUT), k.pageHtml({ title: "Transformador desmontável", theme, body, script: kitScript() + live, width: 1040 }));
console.log("wrote", OUT, "items:", items.length);
