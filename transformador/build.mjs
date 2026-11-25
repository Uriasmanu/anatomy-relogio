import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";
import { kitScript } from "./scripts/inline-kit.mjs";
import * as M from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const OUT = theme === "light" ? "transformador-light.html" : "transformador.html";

const WIDTH = 840;
const HEIGHT = 620;

const PAD = { x: -156, y: -74, w: 414, d: 176, r: 10 };
const PAD_H = 6;
const TANK = { x0: -130, x1: 130, y0: -55, y1: 55 };
const WALL = 4;
const FLOOR_TOP = 16;
const WALL_TOP = 164;
const LID_Z = 164;
const LID_H = 6;
const LID_TOP = LID_Z + LID_H;
const LID = { x: -134, y: -59, w: 268, d: 118, r: 5 };

const COIL_X = [-76, 0, 76];
const LIMB_R = 12.5;
const LV_IN = 15.5;
const LV_OUT = 20;
const HV_IN = 22.5;
const HV_OUT = 28;
const RING_OUT = 29.5;
const COIL_Z0 = 47;
const COIL_Z1 = 105;
const YOKE = { x: -88, y: -13, w: 176, d: 26, r: 0.8 };
const YOKE_LOW = 32;
const YOKE_HIGH = 108;
const YOKE_H = 12;
const DISCS = 8;
const DISC_PITCH = (COIL_Z1 - COIL_Z0) / DISCS;
const DISC_H = DISC_PITCH - 1.5;

const TAP_X = -114;
const TAP_Z0 = 52;
const TAP_STEP = 5.5;
const tapZ = (index) => TAP_Z0 + TAP_STEP * index;

const HV_Y = -24;
const LV_Y = 21;
const BUSH_HV = { height: 78, z: LID_TOP + 5 };
const BUSH_LV = { height: 44, z: LID_TOP + 4 };

const CONS = { x0: -125, x1: -45, y: -52, z: 220, r: 18 };
const RAD = { x0: 142, pitch: 13, count: 8, thick: 4, y0: -46, y1: 46, z0: 44, z1: 144 };
const RAD_X1 = RAD.x0 + RAD.pitch * (RAD.count - 1) + RAD.thick;
const HEADER_TOP_Z = 157;
const HEADER_LOW_Z = 30;
const FANS = [
  [164, 120],
  [214, 120],
  [189, 72],
];
const FAN_R = 17;
const FAN_Y = RAD.y1 + 3;
const CAB = { x: -128, y: 58, w: 32, d: 30, r: 1.5 };
const CAB_TOP = 72;
const DOOR_Y = CAB.y + CAB.d + 1.6;
const OTI = { x: -112, z: 46, r: 8 };

const P = k.fitProjection(
  [
    ...k.boxCorners(PAD, -PAD_H, 0),
    [-76, HV_Y, BUSH_HV.z + BUSH_HV.height + 4],
    [76, HV_Y, BUSH_HV.z + BUSH_HV.height + 4],
    [CONS.x0, CONS.y, CONS.z + CONS.r],
    [RAD_X1, RAD.y1, RAD.z1 + 14],
    [RAD_X1, RAD.y0, RAD.z1 + 14],
    [CAB.x, DOOR_Y, 0],
  ],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 52 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const seg = (a, b) => k.segment(a, b, P);
const slab = (plan, z, h, steps = 3, bevel = 0.4) => k.slabOf(plan, z, h, P, steps, bevel);
const cyl = (x, y, r, z, h, steps = 24, bevel = 0) => k.cylinder(x, y, r, z, h, P, steps, bevel);
const fz = (x, y, z) => G.frameAlong([x, y, z], [0, 0, 1]);
const fx = (x, y, z) => G.frameAlong([x, y, z], [1, 0, 0]);
const fy = (x, y, z) => G.frameOf([x, y, z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
const dotsAt = (points, style = {}) => D(points.map(at), { size: 0.45, ...style });
const [VX, VY] = k.towardViewer(P);
const FACE = Math.atan2(VY, VX);

const BASE = 0;
const SHELL = 1;
const CORE_LOW = 2;
const COILS = 3;
const CORE_HIGH = 4;
const LEADS = 5;
const TAP_LAYER = 2.5;
const CURB = 11;
const FRONT = 6;
const RADIATORS = 7;
const CABINET = 8;
const LID_LAYER = 9;
const UPPER = 10;
const items = [];
const put = (layer, point, svg, bias = 0) => items.push({ key: layer * 10000 + k.depthOf(point, P) + bias, svg });

function pathFace(points, closed = true) {
  return k.pathOf(points.map(at), closed);
}

function perimeterDots(plan, z, inset, gap) {
  const out = [];
  const x0 = plan.x + inset;
  const x1 = plan.x + plan.w - inset;
  const y0 = plan.y + inset;
  const y1 = plan.y + plan.d - inset;
  const nx = Math.round((x1 - x0) / gap);
  const ny = Math.round((y1 - y0) / gap);
  for (let i = 0; i <= nx; i++) out.push([x0 + ((x1 - x0) * i) / nx, y0, z], [x0 + ((x1 - x0) * i) / nx, y1, z]);
  for (let i = 1; i < ny; i++) out.push([x0, y0 + ((y1 - y0) * i) / ny, z], [x1, y0 + ((y1 - y0) * i) / ny, z]);
  return out;
}

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PAD, -PAD_H, PAD_H, P)}"/>`];
  out.push(S(slab(PAD, -PAD_H, PAD_H, 8, 1), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(PAD, 5), 0, P), { tone: "faint" }));
  const bolts = k.corners(PAD, 10);
  out.push(L(bolts.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(bolts.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  put(BASE, [0, 0, 0], out.join(""), -500);
  [-46, 34].forEach((y, index) => {
    const beam = { x: -140, y, w: 280, d: 12, r: 1 };
    const svg = [S(slab(beam, 0, 10, 3, 0.5), { tone: "mid" })];
    svg.push(dotsAt([-136, -134].map((x) => [x + 0, y + 6, 10]).concat([134, 136].map((x) => [x, y + 6, 10])), { tone: "mid" }));
    put(BASE, [0, y, 5], svg.join(""), index);
  });
  for (const x of [-120, 120]) {
    for (const y of [-40, 40]) {
      put(BASE, [x, y, 0], S(slab({ x: x - 7, y: y - 7, w: 14, d: 14, r: 1.5 }, 0, 0.8, 3, 0), { tone: "lo", crease: "none" }), 5);
    }
  }
}

function curbs() {
  const x0 = PAD.x + 3;
  const y0 = PAD.y + 3;
  const w = PAD.w - 6;
  const d = PAD.d - 6;
  const piece = (plan) => S(slab(plan, 0, 5, 2, 0.3), { tone: "lo" });
  put(BASE, [0, y0, 2], piece({ x: x0, y: y0, w, d: 3, r: 0.6 }), 20);
  put(BASE, [x0, 0, 2], piece({ x: x0, y: y0 + 3, w: 3, d: d - 3, r: 0.6 }), 21);
  put(CURB, [0, y0 + d, 2], piece({ x: x0 + 3, y: y0 + d - 3, w: w - 3, d: 3, r: 0.6 }), 0);
  put(CURB, [x0 + w, 0, 2], piece({ x: x0 + w - 3, y: y0 + 3, w: 3, d: d - 6, r: 0.6 }), 1);
}

function shell() {
  const floor = { x: TANK.x0, y: TANK.y0, w: TANK.x1 - TANK.x0, d: TANK.y1 - TANK.y0, r: 2 };
  put(SHELL, [0, 0, 10], S(slab(floor, 10, 6, 3, 0.5), { tone: "mid" }), -100);
  const back = { x: TANK.x0, y: TANK.y0, w: 260, d: WALL, r: 0.5 };
  const wallH = WALL_TOP - FLOOR_TOP;
  const backSvg = [S(slab(back, FLOOR_TOP, wallH, 2, 0.4), { tone: "mid" })];
  backSvg.push(L(seg([TANK.x0 + WALL, TANK.y0 + WALL, 150], [TANK.x1, TANK.y0 + WALL, 150]), { tone: "mid" }));
  for (const x of [-96, -32, 32, 96]) {
    backSvg.push(S(slab({ x: x - 3, y: TANK.y0 + WALL, w: 6, d: 3, r: 0.3 }, FLOOR_TOP, wallH, 2, 0), { tone: "mid", crease: "none" }));
  }
  for (const z of [70, 124]) backSvg.push(S(slab({ x: TANK.x0 + WALL, y: TANK.y0 + WALL, w: 252, d: 2.5, r: 0.3 }, z, 5, 1, 0.2), { tone: "mid", crease: "lo" }));
  put(SHELL, [0, TANK.y0, 90], backSvg.join(""), -50);
  const left = { x: TANK.x0, y: TANK.y0 + WALL, w: WALL, d: TANK.y1 - TANK.y0 - WALL, r: 0.5 };
  const leftSvg = [S(slab(left, FLOOR_TOP, wallH, 2, 0.4), { tone: "mid" })];
  const faceX = TANK.x0 + WALL;
  leftSvg.push(L(seg([faceX, TANK.y0 + WALL, 150], [faceX, TANK.y1, 150]), { tone: "mid" }));
  leftSvg.push(L(seg([faceX, TANK.y1, FLOOR_TOP], [faceX, TANK.y1, WALL_TOP]), { tone: "lo" }));
  for (const z of [70, 124]) leftSvg.push(S(slab({ x: faceX, y: TANK.y0 + WALL, w: 2.5, d: TANK.y1 - TANK.y0 - WALL, r: 0.3 }, z, 5, 1, 0.2), { tone: "mid", crease: "lo" }));
  for (const y of [-17, 17]) leftSvg.push(S(slab({ x: faceX, y: y - 3, w: 3, d: 6, r: 0.3 }, FLOOR_TOP, wallH, 2, 0), { tone: "mid", crease: "none" }));
  put(SHELL, [TANK.x0, 0, 90], leftSvg.join(""), -40);
}

function coreLow() {
  for (const x of COIL_X) {
    put(CORE_LOW, [x, 0, 24], S(slab({ x: x - 14, y: -18, w: 28, d: 36, r: 1 }, FLOOR_TOP, YOKE_LOW - FLOOR_TOP, 3, 0.3), { tone: "lo" }), -20);
  }
  for (const y of [-18, 13]) {
    put(CORE_LOW, [0, y, 38], S(slab({ x: YOKE.x, y, w: YOKE.w, d: 5, r: 0.5 }, YOKE_LOW, YOKE_H, 2, 0.3), { tone: "mid" }), y > 0 ? 6 : -6);
  }
  put(CORE_LOW, [0, 0, 38], S(slab(YOKE, YOKE_LOW, YOKE_H, 3, 0.4), { tone: "hi", crease: "lo" }), 0);
  const clampDots = [-80, -40, 0, 40, 80];
  put(CORE_LOW, [0, 15.5, 44], dotsAt(clampDots.map((x) => [x, 15.5, YOKE_LOW + YOKE_H]), { tone: "mid" }), 8);
}

function discSolid(x, y, rIn, rOut, z, h, half) {
  if (!half) return k.cylinder(x, y, rOut, z, h, P, 36, 0.3);
  return k.extrude(halfRing(x, y, rIn, rOut), z, h, P, { convex: false });
}

function halfRing(cx, cy, r0, r1, n = 30) {
  const a0 = FACE + 1.4;
  const a1 = FACE + Math.PI * 2 - 1.4;
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([cx + r1 * Math.cos(a), cy + r1 * Math.sin(a)]);
  }
  for (let i = 0; i <= n; i++) {
    const a = a1 - ((a1 - a0) * i) / n;
    out.push([cx + r0 * Math.cos(a), cy + r0 * Math.sin(a)]);
  }
  return out;
}

function innerArc(cx, cy, r, z) {
  const a0 = FACE + 1.4;
  const a1 = FACE + Math.PI * 2 - 1.4;
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const a = a0 + ((a1 - a0) * i) / 40;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z]);
  }
  return pathFace(pts, false);
}

function phase(index, x) {
  const half = index === 0;
  const out = [];
  const zs = Array.from({ length: DISCS }, (_, d) => COIL_Z0 + d * DISC_PITCH);
  const ring = (z0, z1) => S(discSolid(x, 0, half ? LV_IN : 0, RING_OUT, z0, z1 - z0, half), { tone: "lo" });
  if (half) {
    out.push(ring(YOKE_LOW + YOKE_H, COIL_Z0));
    zs.forEach((z, d) => {
      const lines = [z + DISC_H * 0.33, z + DISC_H * 0.66].map((h) => innerArc(x, 0, HV_IN, h)).join("");
      out.push(S(discSolid(x, 0, HV_IN, HV_OUT, z, DISC_H, true), { tone: "hi", crease: "lo", inner: L(lines, { tone: "faint" }) }));
    });
    const lvLines = zs.map((z) => innerArc(x, 0, LV_IN, z + DISC_PITCH / 2)).join("");
    out.push(S(discSolid(x, 0, LV_IN, LV_OUT, COIL_Z0, COIL_Z1 - COIL_Z0, true), { tone: "mid", crease: "lo", inner: L(lvLines, { tone: "faint" }) }));
    out.push(S(cyl(x, 0, LIMB_R, YOKE_LOW + YOKE_H, YOKE_HIGH - YOKE_LOW - YOKE_H, 28), { tone: "hi", crease: "lo", inner: L(k.knurl(x, 0, LIMB_R, YOKE_LOW + YOKE_H, YOKE_HIGH, 18, P, 0), { tone: "faint" }) }));
    out.push(S(discSolid(x, 0, LV_IN, RING_OUT, COIL_Z1, YOKE_HIGH - COIL_Z1, true), { tone: "lo" }));
  } else {
    out.push(ring(YOKE_LOW + YOKE_H, COIL_Z0));
    zs.forEach((z, d) => {
      const lines = [z + DISC_H * 0.33, z + DISC_H * 0.66].map((h) => k.sideArc(x, 0, HV_OUT, h, P, 24)).join("");
      const tapDisc = d >= DISCS - 2;
      const which = d === DISCS - 2 ? "a" : "b";
      out.push(`<g${tapDisc ? ` data-tap-disc="${which}"` : ""}>${S(discSolid(x, 0, 0, HV_OUT, z, DISC_H, false), { tone: "hi", crease: "lo", inner: L(lines, { tone: "faint" }) })}</g>`);
      if (tapDisc) out.push(`<path data-tap-ring="${which}" class="iso-line" data-tone="lit" style="stroke-width:1.5;opacity:0" d="${k.sideArc(x, 0, HV_OUT, z + DISC_H / 2, P, 24)}"/>`);
    });
    out.push(ring(COIL_Z1, YOKE_HIGH));
  }
  put(COILS, [x, 0, 76], out.join(""), index);
}

function coils() {
  COIL_X.forEach((x, index) => phase(index, x));
}

function coreHigh() {
  const y = YOKE;
  for (const yy of [-18, 13]) {
    put(CORE_HIGH, [0, yy, 114], S(slab({ x: y.x, y: yy, w: y.w, d: 5, r: 0.5 }, YOKE_HIGH, YOKE_H, 2, 0.3), { tone: "mid" }), yy > 0 ? 6 : -6);
  }
  const svg = [S(slab(y, YOKE_HIGH, YOKE_H, 3, 0.4), { tone: "hi", crease: "lo" })];
  const top = YOKE_HIGH + YOKE_H;
  for (let i = 0; i < 8; i++) {
    const yy = y.y + 2.2 + i * 3.1;
    svg.push(L(seg([y.x, yy, top], [y.x + y.w, yy, top]), { tone: "faint" }));
  }
  put(CORE_HIGH, [0, 0, 114], svg.join(""), 0);
  const plate = { x: -12, y: -8, w: 24, d: 16, r: 2 };
  const lift = [S(slab(plate, top, 4, 3, 0.4), { tone: "mid" }), L(k.ring(0, 0, 4.2, top + 4, P, 20), { tone: "lo" }), dotsAt([[-8, -4.5, top + 4], [8, -4.5, top + 4], [-8, 4.5, top + 4], [8, 4.5, top + 4]])].join("");
  put(CORE_HIGH, [0, 0, top + 2], lift, 12);
  const clampDots = [-80, -40, 40, 80].flatMap((x) => [[x, 15.5, top], [x, -15.5, top]]);
  put(CORE_HIGH, [0, 0, top], dotsAt(clampDots, { tone: "mid" }), 14);
}

function leads() {
  COIL_X.forEach((x, index) => {
    const hv = [S(cyl(x, HV_Y, 1.8, YOKE_HIGH, LID_Z - YOKE_HIGH, 12), { tone: "mid", crease: "none" })];
    for (const z of [128, 146]) hv.push(L(k.sideArc(x, HV_Y, 1.8, z, P, 10), { tone: "lo" }));
    hv.push(S(cyl(x, HV_Y, 2.6, YOKE_HIGH, 3, 14), { tone: "lo" }));
    put(COILS, [x, HV_Y, 136], hv.join(""), 40 + index);
    const bar = (plan, z, h) => S(slab(plan, z, h, 1, 0.2), { tone: "mid", crease: "lo" });
    const lv = [bar({ x: x - 4, y: -20, w: 8, d: 2.4, r: 0.3 }, YOKE_HIGH, 140 - YOKE_HIGH)];
    lv.push(bar({ x: x - 4, y: -20, w: 8, d: 41.4, r: 0.3 }, 140, 2.4));
    lv.push(bar({ x: x - 4, y: LV_Y - 1.2, w: 8, d: 2.4, r: 0.3 }, 140, LID_Z - 140));
    put(LEADS, [x, 0, 140], lv.join(""), index);
    const clamp = (y, z) => S(slab({ x: x - 5, y: y - 3, w: 10, d: 6, r: 0.8 }, z, 4, 2, 0.2), { tone: "lo" });
    put(LEADS, [x, LV_Y, 150], clamp(LV_Y, 150), index + 10);
    put(LEADS, [x, -20, 124], clamp(-20, 124), index - 5);
  });
}

function tapChanger() {
  const out = [];
  out.push(S(slab({ x: TAP_X - 8, y: -8, w: 16, d: 16, r: 1.5 }, FLOOR_TOP, 4, 3, 0.3), { tone: "lo" }));
  out.push(dotsAt([[TAP_X - 5, -5, FLOOR_TOP + 4], [TAP_X + 5, -5, FLOOR_TOP + 4], [TAP_X - 5, 5, FLOOR_TOP + 4], [TAP_X + 5, 5, FLOOR_TOP + 4]]));
  out.push(S(cyl(TAP_X, 0, 4, FLOOR_TOP + 4, tapZ(8) + 6 - FLOOR_TOP - 4, 20), { tone: "mid", crease: "none" }));
  out.push(L(k.knurl(TAP_X, 0, 4, FLOOR_TOP + 4, tapZ(8) + 6, 12, P, 0), { tone: "faint" }));
  const contacts = [];
  for (let i = 0; i < M.RATED.taps; i++) {
    const z = tapZ(i);
    out.push(S(cyl(TAP_X, 0, 5.4, z - 0.7, 1.4, 20), { tone: "lo", crease: "none" }));
    out.push(L(seg([TAP_X + 5.4, 0, z], [HV_REACH, 0, z]), { tone: "lo" }));
    contacts.push([HV_REACH, 0, z]);
  }
  out.push(dotsAt(contacts, { tone: "hi", size: 0.6 }));
  out.push(S(cyl(TAP_X, 0, 1.6, tapZ(8) + 6, LID_Z - tapZ(8) - 6, 10), { tone: "hi", crease: "none" }));
  put(TAP_LAYER, [TAP_X, 0, 90], out.join(""), 30);
  const arm = [S(slab({ x: TAP_X - 1.7, y: -9, w: 3.4, d: 18, r: 0.6 }, -1.2, 2.4, 2, 0.2), { tone: "hi", lit: true }), S(cyl(TAP_X, 0, 4.6, -2, 4, 16), { tone: "hi", lit: true, crease: "lo" })];
  const mid = tapZ(4);
  put(TAP_LAYER, [TAP_X, 0, 91], `<g data-part="tap-arm" transform="${k.translateAlong(P, [0, 0, mid])}">${arm.join("")}</g>`, 31);
}

const HV_REACH = COIL_X[0] - HV_OUT;

function front() {
  const sill = { x: TANK.x0, y: TANK.y1 - WALL, w: 260, d: WALL, r: 0.5 };
  put(FRONT, [0, TANK.y1, 22], [S(slab(sill, FLOOR_TOP, 14, 2, 0.4), { tone: "mid" }), L(seg([TANK.x0, TANK.y1, 23], [TANK.x1 - WALL, TANK.y1, 23]), { tone: "faint" })].join(""), -10);
  const beam = { x: TANK.x0, y: TANK.y1 - WALL, w: 260, d: WALL, r: 0.5 };
  put(FRONT, [0, TANK.y1, 160], S(slab(beam, 154, WALL_TOP - 154, 2, 0.4), { tone: "mid" }), -9);
  const xw = TANK.x1 - WALL;
  const panel = { x: xw, y: TANK.y0 + WALL, w: WALL, d: TANK.y1 - TANK.y0 - WALL, r: 0.5 };
  put(FRONT, [TANK.x1, 0, 30], S(slab(panel, FLOOR_TOP, 32, 2, 0.4), { tone: "mid" }), 0);
  put(FRONT, [TANK.x1, 0, 156], S(slab(panel, 148, WALL_TOP - 148, 2, 0.4), { tone: "mid" }), 1);
  put(FRONT, [TANK.x1, TANK.y1, 90], S(slab({ x: xw, y: TANK.y1 - WALL, w: WALL, d: WALL, r: 0.3 }, FLOOR_TOP, WALL_TOP - FLOOR_TOP, 2, 0.2), { tone: "mid" }), 5);
  put(FRONT, [TANK.x1, 0, 30], dotsAt([-40, -20, 0, 20, 40].map((y) => [TANK.x1, y, 30]), { tone: "mid" }), 2);
}

function bushingProfile(height, rs, rr, sheds) {
  const p = [[0, rs + 3.5], [3, rs + 3.5], [3, rs + 0.5]];
  const start = 8;
  const end = height - 14;
  for (let i = 0; i < sheds; i++) {
    const s = start + ((end - start) * i) / sheds;
    p.push([s, rs], [s + 0.5, rr], [s + 1.9, rr], [s + 2.6, rs + 0.6]);
  }
  p.push([end + 1, rs], [height - 12, rs + 1.4], [height - 4, rs + 1.4], [height - 4, 3.4], [height, 3.4]);
  return p;
}

function bushing(x, y, spec, rs, rr, sheds, tone) {
  const turret = [S(cyl(x, y, rs + 5.5, LID_TOP, spec.z - LID_TOP, 24), { tone: "mid" })];
  turret.push(L(k.sideArc(x, y, rs + 5.5, LID_TOP + 1.2, P, 20), { tone: "faint" }));
  const body = G.solidOf(bushingProfile(spec.height, rs, rr, sheds), fz(x, y, spec.z), P);
  const svg = [S(body, { tone })];
  const topZ = spec.z + spec.height;
  const clamp = S(slab({ x: x - 4.6, y: y - 2.4, w: 9.2, d: 4.8, r: 1 }, topZ - 3, 4.4, 3, 0.3), { tone: "mid" });
  const bolts = dotsAt([[x - 2.5, y + 2.4, topZ - 0.7], [x + 2.5, y + 2.4, topZ - 0.7]], { tone: "mid" });
  put(UPPER, [x, y, spec.z], turret.join(""), -2);
  put(UPPER, [x, y, spec.z + 10], svg.join("") + clamp + bolts, 0);
}

function lidDetails() {
  const out = [`<path class="iso-halo" d="${k.haloOf(LID, LID_Z, 1, P)}" style="filter:blur(5px)"/>`];
  out.push(S(slab(LID, LID_Z, LID_H, 6, 1), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(LID, 3), LID_TOP, P, 6), { tone: "faint" }));
  out.push(dotsAt(perimeterDots(k.insetPlan(LID, 3), LID_TOP, 0, 14), { tone: "mid" }));
  put(LID_LAYER, [0, 0, LID_TOP], out.join(""), -10);
  const mh = [S(cyl(40, -24, 14, LID_TOP, 2.5, 32), { tone: "lo" }), S(cyl(40, -24, 11.2, LID_TOP + 2.5, 2.5, 32, 0.3), { tone: "mid" })];
  mh.push(dotsAt(Array.from({ length: 10 }, (_, i) => [40 + 12.6 * Math.cos((i / 10) * Math.PI * 2), -24 + 12.6 * Math.sin((i / 10) * Math.PI * 2), LID_TOP + 2.5]), { tone: "mid" }));
  mh.push(S(slab({ x: 36, y: -26, w: 8, d: 4, r: 1.6 }, LID_TOP + 5, 2, 3, 0.2), { tone: "mid" }));
  put(LID_LAYER, [40, -24, LID_TOP], mh.join(""), 0);
  const lugs = [[-126, -51], [-126, 51], [122, -51], [122, 51]];
  lugs.forEach(([x, y], index) => {
    const svg = [S(slab({ x: x - 5, y: y - 1.2, w: 10, d: 2.4, r: 0.8 }, LID_TOP, 10, 3, 0.2), { tone: "mid" }), L(k.sideRing([x, y + 1.2, LID_TOP + 6], 2.4, "y", P, 16), { tone: "lo" })];
    put(LID_LAYER, [x, y, LID_TOP + 5], svg.join(""), 4 + index);
  });
  const prd = [S(cyl(-96, 34, 7, LID_TOP, 3, 22), { tone: "mid" }), S(cyl(-96, 34, 5.2, LID_TOP + 3, 14, 20), { tone: "hi" }), S(cyl(-96, 34, 6.2, LID_TOP + 17, 3, 22), { tone: "mid" })];
  prd.push(L(k.sideArc(-96, 34, 5.2, LID_TOP + 9, P, 16), { tone: "faint" }));
  prd.push(S(slab({ x: -97, y: 34, w: 2, d: 9, r: 0.4 }, LID_TOP + 20, 1.2, 1, 0), { tone: "mid", crease: "none" }));
  put(LID_LAYER, [-96, 34, LID_TOP + 8], prd.join(""), 2);
  const drive = [];
  const box = { x: TAP_X - 12, y: -12, w: 24, d: 24, r: 2 };
  drive.push(S(slab(box, LID_TOP, 24, 4, 0.5), { tone: "mid" }));
  drive.push(L(k.sideSeam(box, LID_TOP + 20, P, 4), { tone: "faint" }));
  drive.push(L(k.sideRing([TAP_X, 12, LID_TOP + 12], 7.4, "y", P, 28), { tone: "lo" }));
  drive.push(L(k.sideRing([TAP_X, 12, LID_TOP + 12], 6, "y", P, 28), { tone: "faint" }));
  const ticks = [];
  for (let i = 0; i < M.RATED.taps; i++) {
    const a = ((-120 + (240 * i) / (M.RATED.taps - 1)) * Math.PI) / 180;
    ticks.push(seg([TAP_X + 6 * Math.sin(a), 12, LID_TOP + 12 + 6 * Math.cos(a)], [TAP_X + 7.4 * Math.sin(a), 12, LID_TOP + 12 + 7.4 * Math.cos(a)]));
  }
  drive.push(L(ticks.join(""), { tone: "mid" }));
  drive.push(`<path data-part="tap-pointer" class="iso-line" data-tone="lit" style="stroke-width:1.1" d="${tapPointer(4)}"/>`);
  drive.push(dotsAt([[TAP_X, 12, LID_TOP + 12]], { tone: "hi", size: 0.6 }));
  put(LID_LAYER, [TAP_X, 0, LID_TOP + 12], drive.join(""), 6);
}

const tapPointer = (position) => {
  const a = ((-120 + (240 * position) / (M.RATED.taps - 1)) * Math.PI) / 180;
  return seg([TAP_X, 12, LID_TOP + 12], [TAP_X + 5.4 * Math.sin(a), 12, LID_TOP + 12 + 5.4 * Math.cos(a)]);
};

function bushings() {
  COIL_X.forEach((x) => bushing(x, HV_Y, BUSH_HV, 5.2, 9, 7, "hi"));
  [...COIL_X, 106].forEach((x) => bushing(x, LV_Y, BUSH_LV, 4.4, 7.6, 3, "hi"));
}

function conservator() {
  const length = CONS.x1 - CONS.x0;
  const F = fx(CONS.x0, CONS.y, CONS.z);
  const profile = [[0, CONS.r - 1.2], [1.2, CONS.r], [length - 1.2, CONS.r], [length, CONS.r - 1.2]];
  const seams = [20, 40, 60].map((s) => G.arcOf(F, s, CONS.r, P, { slope: 0 })).join("");
  const body = S(G.solidOf(profile, F, P), { tone: "hi", crease: "lo", inner: L(seams, { tone: "faint" }) });
  const out = [body];
  const Fe = fx(CONS.x1, CONS.y, CONS.z);
  out.push(L(G.circleOf(Fe, 0, CONS.r - 3, P), { tone: "lo" }));
  out.push(dotsAt(Array.from({ length: 12 }, (_, i) => G.pointOf(Fe, 0, CONS.r - 1.8, (i / 12) * Math.PI * 2)), { tone: "mid" }));
  const gauge = { c: [CONS.x1, CONS.y, CONS.z + 2], r: 8 };
  out.push(S(G.disc(0, 1.4, gauge.r + 1.6, Fe, P), { tone: "mid" }));
  const Fg = fx(CONS.x1 + 1.4, CONS.y, CONS.z + 2);
  out.push(L(G.circleOf(Fg, 0, gauge.r, P), { tone: "lo" }));
  const g = [];
  for (let i = 0; i <= 8; i++) {
    const a = ((-120 + 30 * i) * Math.PI) / 180;
    const p = (r) => G.pointOf(Fg, 0, r, Math.PI / 2 - a);
    g.push(k.pathOf([at(p(gauge.r - (i % 4 === 0 ? 3 : 1.8))), at(p(gauge.r))]));
  }
  out.push(L(g.join(""), { tone: "mid" }));
  const pointA = Math.PI / 2 - ((-120 + 30 * 5.2) * Math.PI) / 180;
  out.push(L(k.pathOf([at(G.pointOf(Fg, 0, 0, 0)), at(G.pointOf(Fg, 0, gauge.r - 2, pointA))]), { tone: "lit", free: "end" }));
  put(UPPER, [CONS.x1, CONS.y, CONS.z], out.join(""), -30);
  for (const x of [-108, -62]) {
    const leg = [S(slab({ x: x - 3, y: CONS.y - 14, w: 6, d: 28, r: 1 }, LID_TOP, 6, 2, 0.3), { tone: "mid" }), S(slab({ x: x - 3, y: CONS.y - 3, w: 6, d: 6, r: 0.8 }, LID_TOP + 6, CONS.z - CONS.r - LID_TOP - 6 + 3.5, 2, 0.2), { tone: "mid" })];
    const strap = S(slab({ x: x - 4, y: CONS.y - 15, w: 8, d: 30, r: 3 }, CONS.z - CONS.r + 2.5, 3, 4, 0.2), { tone: "lo" });
    put(UPPER, [x, CONS.y, 190], leg.join(""), -40);
    put(UPPER, [x, CONS.y, CONS.z - CONS.r], strap, -29);
  }
  const px = -112;
  const py = CONS.y;
  const pipe = [S(cyl(px, py, 7, LID_TOP, 2, 20), { tone: "lo" }), S(cyl(px, py, 4.5, LID_TOP + 2, 10, 16), { tone: "mid", crease: "none" })];
  const relay = { x: px - 8, y: py - 8, w: 16, d: 16, r: 2 };
  pipe.push(S(slab(relay, LID_TOP + 12, 16, 4, 0.4), { tone: "hi" }));
  pipe.push(L(k.sideRing([px, py + 8, LID_TOP + 20], 4.2, "y", P, 20), { tone: "lo" }));
  pipe.push(L(seg([px - 4.2, py + 8, LID_TOP + 20], [px + 4.2, py + 8, LID_TOP + 20]), { tone: "faint" }));
  pipe.push(S(cyl(px, py, 4.5, LID_TOP + 28, CONS.z - CONS.r - LID_TOP - 28 + 2, 16), { tone: "mid", crease: "none" }));
  pipe.push(S(cyl(px + 10, py + 4, 1.6, LID_TOP + 22, 6, 10), { tone: "mid" }));
  put(UPPER, [px, py, LID_TOP + 14], pipe.join(""), -20);
  const bx = -42;
  const by = CONS.y;
  const breather = [S(cyl(bx, by, 1.8, CONS.z - CONS.r - 5, 6, 10), { tone: "mid", crease: "none" }), S(cyl(bx, by, 6.4, LID_TOP + 6, 26, 20), { tone: "hi" })];
  breather.push(L(k.sideArc(bx, by, 6.4, LID_TOP + 12, P, 16) + k.sideArc(bx, by, 6.4, LID_TOP + 26, P, 16), { tone: "faint" }));
  breather.push(S(cyl(bx, by, 5, LID_TOP, 6, 18), { tone: "mid" }));
  put(UPPER, [bx, by, LID_TOP + 10], breather.join(""), -35);
}

function radiators() {
  let seq = 0;
  const putR = (svg) => items.push({ key: RADIATORS * 10000 + seq++, svg });
  const headerLow = G.solidOf([[0, 5], [105, 5]], fx(RAD.x0 - 12, 0, HEADER_LOW_Z), P);
  const lowSvg = [S(headerLow, { tone: "mid", crease: "lo" })];
  lowSvg.push(`<path data-part="flow-cold" class="iso-line" data-tone="mid" data-flow d="${seg([RAD_X1 - 4, 0, HEADER_LOW_Z + 5.4], [TANK.x1 + 2, 0, HEADER_LOW_Z + 5.4])}" style="stroke-width:1"/>`);
  putR(lowSvg.join(""));
  const tank = [S(G.disc(0, 4, 7.5, fx(TANK.x1, 0, HEADER_LOW_Z), P), { tone: "lo" }), S(G.disc(0, 4, 7.5, fx(TANK.x1, 0, HEADER_TOP_Z), P), { tone: "lo" })];
  tank.push(dotsAt(Array.from({ length: 8 }, (_, i) => G.pointOf(fx(TANK.x1 + 4, 0, HEADER_LOW_Z), 0, 6.2, (i / 8) * Math.PI * 2)), { tone: "mid" }));
  putR(tank.join(""));
  const valves = [HEADER_LOW_Z, HEADER_TOP_Z].map((z) => {
    const F = fx(TANK.x1 + 6, 0, z);
    const body = G.solidOf([[0, 6.4], [4, 6.4], [4, 5.4], [8, 5.4], [8, 6.4], [12, 6.4]], F, P);
    return [S(body, { tone: "hi" }), S(cyl(TANK.x1 + 12, 0, 1.4, z + 5, 7, 10), { tone: "mid", crease: "none" }), S(slab({ x: TANK.x1 + 8, y: -5, w: 8, d: 10, r: 1.2 }, z + 11, 2.2, 3, 0.2), { tone: "mid" })].join("");
  });
  putR(valves[0]);
  for (let i = 0; i < RAD.count; i++) {
    const x = RAD.x0 + RAD.pitch * i;
    const plan = { x, y: RAD.y0, w: RAD.thick, d: RAD.y1 - RAD.y0, r: 0.4 };
    const svg = [S(slab(plan, RAD.z0, RAD.z1 - RAD.z0, 2, 0.3), { tone: "mid" })];
    const fins = [];
    for (let j = 0; j <= 9; j++) fins.push(seg([x + RAD.thick, RAD.y0 + ((RAD.y1 - RAD.y0) * j) / 9, RAD.z0], [x + RAD.thick, RAD.y0 + ((RAD.y1 - RAD.y0) * j) / 9, RAD.z1]));
    svg.push(L(fins.join(""), { tone: "lo" }));
    svg.push(L(seg([x + RAD.thick, RAD.y0, 92], [x + RAD.thick, RAD.y1, 92]), { tone: "faint" }));
    svg.push(S(cyl(x + 2, 0, 2.4, HEADER_LOW_Z + 4, RAD.z0 - HEADER_LOW_Z - 4, 10), { tone: "mid", crease: "none" }));
    svg.push(S(cyl(x + 2, 0, 2.4, RAD.z1, HEADER_TOP_Z - RAD.z1, 10), { tone: "mid", crease: "none" }));
    putR(svg.join(""));
  }
  const headerTop = G.solidOf([[0, 5], [105, 5]], fx(RAD.x0 - 12, 0, HEADER_TOP_Z), P);
  const topSvg = [S(headerTop, { tone: "mid", crease: "lo" })];
  topSvg.push(`<path data-part="flow-hot" class="iso-line" data-tone="lit" data-flow d="${seg([TANK.x1 + 2, 0, HEADER_TOP_Z + 5.4], [RAD_X1 - 4, 0, HEADER_TOP_Z + 5.4])}" style="stroke-width:1.1"/>`);
  putR(topSvg.join("") + valves[1]);
  const railPlan = (x) => ({ x, y: RAD.y1, w: 3, d: 3, r: 0.6 });
  for (const x of [RAD.x0 - 5, RAD_X1 + 1]) {
    putR([S(slab(railPlan(x), RAD.z0 - 2, RAD.z1 - RAD.z0 + 4, 2, 0.2), { tone: "mid" }), dotsAt([[x + 1.5, RAD.y1 + 3, RAD.z0 + 3], [x + 1.5, RAD.y1 + 3, RAD.z1 - 3]])].join(""));
  }
  const box = { x: RAD.x0 - 2, y: RAD.y1 + 3, w: 12, d: 7, r: 1 };
  putR([S(slab(box, RAD.z0 - 2, 12, 3, 0.3), { tone: "hi" }), L(k.planOutline(k.insetPlan(box, 1.4), RAD.z0 + 10, P, 3), { tone: "faint" })].join(""));
  [...FANS.keys()].sort((a, b) => FANS[a][0] - FANS[b][0]).forEach((index) => {
    const [cx, cz] = FANS[index];
    const F = fy(cx, FAN_Y, cz);
    const plate = { x: cx - 19, y: RAD.y1, w: 38, d: 3, r: 3 };
    const out = [S(slab(plate, cz - 19, 38, 4, 0.4), { tone: "mid" })];
    out.push(dotsAt([[cx - 15.5, FAN_Y, cz - 15.5], [cx + 15.5, FAN_Y, cz - 15.5], [cx - 15.5, FAN_Y, cz + 15.5], [cx + 15.5, FAN_Y, cz + 15.5]], { tone: "mid" }));
    out.push(S(G.ringBand(0, 4.6, FAN_R - 2.4, FAN_R, F, P), { tone: "mid", crease: "lo" }));
    const hole = G.circleOf(F, 4.6, FAN_R - 2.4, P);
    const inner = [S(G.disc(0, 1.2, FAN_R - 2.4, F, P), { tone: "lo" }), `<g data-part="fan-blades" data-fan="${index}">${blades(cx, cz, 0)}</g>`, S(G.disc(1.2, 3.6, 3.6, F, P), { tone: "mid" })];
    out.push(`<clipPath id="fan-hole-${index}"><path d="${hole}"/></clipPath><g clip-path="url(#fan-hole-${index})">${inner.join("")}</g>`);
    out.push(L(G.circleOf(F, 4.6, 8, P) + G.circleOf(F, 4.6, 12.6, P) + hole + G.circleOf(F, 4.6, 3.6, P), { tone: "faint" }));
    out.push(L(G.spokesOf(F, 4.6, 3.6, FAN_R - 2.4, 8, P, { phase: 0.2 }), { tone: "faint" }));
    putR(out.join(""));
  });
}

function blades(cx, cz, angle) {
  const planeY = FAN_Y + 2.4;
  const count = 5;
  const parts = [];
  for (let i = 0; i < count; i++) {
    const a = angle + (i / count) * Math.PI * 2;
    const pt = (r, da) => at([cx + r * Math.cos(a + da), planeY, cz + r * Math.sin(a + da)]);
    parts.push(k.pathOf([pt(3.6, -0.18), pt(FAN_R - 3.4, 0.1), pt(FAN_R - 3.4, 0.55), pt(3.6, 0.42)], true));
  }
  const d = parts.join("");
  return `<path class="iso-shade" data-shade="2" d="${d}"/><path class="iso-line" data-tone="mid" d="${d}"/>`;
}

function cabinet() {
  const out = [`<path class="iso-halo" d="${k.haloOf(CAB, 0, 4, P)}" style="filter:blur(5px)"/>`];
  out.push(S(slab(CAB, 0, CAB_TOP, 4, 0.6), { tone: "mid" }));
  out.push(S(slab({ x: CAB.x - 2, y: CAB.y - 2, w: CAB.w + 4, d: CAB.d + 4, r: 2 }, CAB_TOP, 3, 4, 0.4), { tone: "lo" }));
  out.push(S(slab({ x: CAB.x + 2, y: CAB.y + CAB.d, w: CAB.w - 4, d: 1.6, r: 1 }, 4, CAB_TOP - 12, 3, 0.3), { tone: "mid", crease: "lo" }));
  const door = { x: CAB.x + 2, w: CAB.w - 4 };
  out.push(L(pathFace([[door.x + 2, DOOR_Y, 6], [door.x + door.w - 2, DOOR_Y, 6], [door.x + door.w - 2, DOOR_Y, CAB_TOP - 10], [door.x + 2, DOOR_Y, CAB_TOP - 10]]), { tone: "faint" }));
  out.push(L(k.sideRing([OTI.x, DOOR_Y, OTI.z], OTI.r, "y", P, 40), { tone: "mid" }));
  out.push(L(k.sideRing([OTI.x, DOOR_Y, OTI.z], OTI.r - 1.4, "y", P, 40), { tone: "lo" }));
  const ticks = [];
  for (let i = 0; i <= 18; i++) {
    const a = ((-135 + 15 * i) * Math.PI) / 180;
    const major = i % 3 === 0;
    const r0 = OTI.r - 1.4 - (major ? 2.4 : 1.3);
    ticks.push(seg([OTI.x + r0 * Math.sin(a), DOOR_Y, OTI.z + r0 * Math.cos(a)], [OTI.x + (OTI.r - 1.4) * Math.sin(a), DOOR_Y, OTI.z + (OTI.r - 1.4) * Math.cos(a)]));
  }
  out.push(L(ticks.join(""), { tone: "mid" }));
  out.push(`<path data-part="oti-needle" class="iso-line" data-tone="lit" style="stroke-width:1.1" d="${needlePath(60)}"/>`);
  out.push(dotsAt([[OTI.x, DOOR_Y, OTI.z]], { tone: "hi", size: 0.6 }));
  out.push(`<circle data-part="led" class="iso-wire-end" cx="${at([OTI.x + 12, DOOR_Y, 60])[0].toFixed(1)}" cy="${at([OTI.x + 12, DOOR_Y, 60])[1].toFixed(1)}" r="1.5"/>`);
  out.push(S(slab({ x: OTI.x - 8, y: DOOR_Y, w: 16, d: 0.8, r: 0.6 }, 14, 7, 2, 0), { tone: "lo", crease: "none" }));
  out.push(L([[-6, 12, 10], [-6, 8, 10.4], [-6, 10, 10.8]].map(([dx, w, dz]) => seg([OTI.x + dx, DOOR_Y + 0.8, 14 + dz * 0.3], [OTI.x + dx + w, DOOR_Y + 0.8, 14 + dz * 0.3])).join(""), { tone: "lo", free: true }));
  out.push(S(cyl(CAB.x + CAB.w - 6, DOOR_Y, 1.8, 30, 3, 12), { tone: "mid", crease: "none" }));
  out.push(dotsAt([[door.x + 3, DOOR_Y, 10], [door.x + door.w - 3, DOOR_Y, 10], [door.x + 3, DOOR_Y, CAB_TOP - 12], [door.x + door.w - 3, DOOR_Y, CAB_TOP - 12]], { tone: "mid" }));
  const vents = [];
  for (let i = 0; i < 4; i++) {
    const z = 18 + i * 2.2;
    vents.push(pathFace([[door.x + 6, DOOR_Y, z], [door.x + 14, DOOR_Y, z], [door.x + 14, DOOR_Y, z + 1.2], [door.x + 6, DOOR_Y, z + 1.2]]));
  }
  out.push(L(vents.join(""), { tone: "lo" }));
  put(CABINET, [CAB.x + CAB.w / 2, CAB.y + CAB.d / 2, 36], out.join(""), 0);
  const cable = `<g data-part="cable">${k.wireSvg(at([CAB.x + CAB.w, 74, 6]), at([RAD.x0 + 4, RAD.y1 + 10, RAD.z0 + 5]), { via: [at([CAB.x + CAB.w + 6, 74, 1]), at([RAD.x0 + 4, 74, 1]), at([RAD.x0 + 4, RAD.y1 + 10, 1])], tone: "lo", size: 1 })}</g>`;
  put(CABINET, [0, 70, 1], cable, -500);
}

const needlePath = (celsius) => {
  const a = ((-135 + (270 * Math.max(0, Math.min(150, celsius))) / 150) * Math.PI) / 180;
  return seg([OTI.x, DOOR_Y + 0.2, OTI.z], [OTI.x + (OTI.r - 3.2) * Math.sin(a), DOOR_Y + 0.2, OTI.z + (OTI.r - 3.2) * Math.cos(a)]);
};

function fluxLines() {
  const out = [];
  const edge = (zMid, name, from, to) => `<path data-flux="${name}" class="iso-line" data-tone="lit" d="${seg([from, 18, zMid], [to, 18, zMid])}" style="stroke-width:1.3;stroke-dasharray:5 6;opacity:0"/>`;
  const guide = (zMid) => L(seg([COIL_X[0], 18, zMid], [COIL_X[2], 18, zMid]), { tone: "faint" });
  const high = YOKE_HIGH + YOKE_H / 2;
  const low = YOKE_LOW + YOKE_H / 2;
  out.push(guide(high), guide(low));
  out.push(edge(high, "top-ab", COIL_X[0], COIL_X[1]), edge(high, "top-bc", COIL_X[1], COIL_X[2]));
  out.push(edge(low, "bot-ab", COIL_X[0], COIL_X[1]), edge(low, "bot-bc", COIL_X[1], COIL_X[2]));
  put(CORE_HIGH, [0, 18, 114], out.join(""), 20);
}

base();
curbs();
shell();
coreLow();
coils();
coreHigh();
leads();
tapChanger();
front();
radiators();
cabinet();
lidDetails();
bushings();
conservator();
fluxLines();

items.sort((a, b) => a.key - b.key);

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A cutaway 25 MVA oil-filled power transformer. Three windings sit on a three-limb steel core inside an open tank; the phase on the left is cut to show the limb, the low-voltage coil and the high-voltage discs. A tap selector on the right moves a contact along nine taps and the top high-voltage discs light up as they join the circuit. Flux pulses along the core yokes. Hot oil rises to the radiators on the right, where three fans start when the top-oil temperature passes 75 degrees. A conservator, a Buchholz relay and a breather sit on top, with four low-voltage and three high-voltage bushings.",
  body: items.map((item) => item.svg),
});

const model = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");

const live = `
${model}
const P = ${JSON.stringify(P)};
const COIL_X = ${JSON.stringify(COIL_X)};
const TAP_X = ${TAP_X}, TAP_Z0 = ${TAP_Z0}, TAP_STEP = ${TAP_STEP};
const FANS = ${JSON.stringify(FANS)};
const FAN_Y = ${FAN_Y}, FAN_R = ${FAN_R};
const OTI = ${JSON.stringify(OTI)}, DOOR_Y = ${DOOR_Y};
const LID_TOP = ${LID_TOP};
const stage = document.querySelector(".iso-stage");
const svgRoot = stage.querySelector("svg");
const q = (selector) => svgRoot.querySelector(selector);
const qa = (selector) => [...svgRoot.querySelectorAll(selector)];
const readout = document.querySelector("[data-readout]");
const cell = (name) => document.querySelector('[data-cell="' + name + '"]');
const loadInput = document.querySelector("#tf-load");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const armEl = q('[data-part="tap-arm"]');
const pointerEl = q('[data-part="tap-pointer"]');
const needleEl = q('[data-part="oti-needle"]');
const ledEl = q('[data-part="led"]');
const hotEl = q('[data-part="flow-hot"]');
const coldEl = q('[data-part="flow-cold"]');
const fanEls = qa('[data-part="fan-blades"]');
const fluxEls = Object.fromEntries(qa("[data-flux]").map((el) => [el.dataset.flux, el]));
const tapDiscs = { a: qa('[data-tap-disc="a"] .iso-solid, [data-tap-disc="a"]'), b: qa('[data-tap-disc="b"] .iso-solid, [data-tap-disc="b"]') };
const tapRings = { a: qa('[data-tap-ring="a"]'), b: qa('[data-tap-ring="b"]') };
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const num = (v, d = 1) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const state = { tap: 4, tapShown: 4, load: 0.6, oil: steadyOil(0.6, false), fans: false, fanRate: 0, fanAngle: 0, clock: 0, flux: 0, dash: 0, touring: !still.matches, idle: 0 };
let frame = 0, last = 0, visible = false;
const needleAt = (c) => {
  const a = ((-135 + (270 * clamp(c, 0, 150)) / 150) * Math.PI) / 180;
  return segment([OTI.x, DOOR_Y + 0.2, OTI.z], [OTI.x + (OTI.r - 3.2) * Math.sin(a), DOOR_Y + 0.2, OTI.z + (OTI.r - 3.2) * Math.cos(a)], P);
};
const pointerAt = (pos) => {
  const a = ((-120 + (240 * pos) / 8) * Math.PI) / 180;
  return segment([TAP_X, 12, LID_TOP + 12], [TAP_X + 5.4 * Math.sin(a), 12, LID_TOP + 12 + 5.4 * Math.cos(a)], P);
};
const bladePath = (cx, cz, angle) => {
  const y = FAN_Y + 2.4, parts = [];
  for (let i = 0; i < 5; i++) {
    const a = angle + (i / 5) * Math.PI * 2;
    const pt = (r, da) => iso([cx + r * Math.cos(a + da), y, cz + r * Math.sin(a + da)], P);
    parts.push(pathOf([pt(3.6, -0.18), pt(FAN_R - 3.4, 0.1), pt(FAN_R - 3.4, 0.55), pt(3.6, 0.42)], true));
  }
  return parts.join("");
};
const setTap = (next) => { state.tap = clamp(Math.round(next), 0, 8); state.touring = false; state.idle = 0; run(); };
const setLoad = (next) => { state.load = clamp(next, 0.05, 1.1); state.touring = false; state.idle = 0; loadInput.value = Math.round(state.load * 100); run(); };
const tourAt = (t) => ({ load: clamp(0.62 + 0.4 * Math.sin((t / 38) * Math.PI * 2 - 1.2), 0.15, 1.05), tap: Math.round(4 + 4 * Math.sin((t / 26) * Math.PI * 2)) });
function step(dt) {
  state.clock += dt;
  if (state.touring) {
    const tour = tourAt(state.clock);
    state.load += (tour.load - state.load) * (1 - Math.exp(-dt / 0.8));
    state.tap = tour.tap;
    loadInput.value = Math.round(state.load * 100);
  } else {
    state.idle += dt;
    if (state.idle > 12 && !still.matches) { state.touring = true; state.clock = 0; }
  }
  const calm = still.matches;
  state.tapShown = calm ? state.tap : state.tapShown + (state.tap - state.tapShown) * (1 - Math.exp(-dt / 0.22));
  if (Math.abs(state.tap - state.tapShown) < 0.004) state.tapShown = state.tap;
  const target = steadyOil(state.load, state.fans);
  state.oil = calm ? target : state.oil + (target - state.oil) * (1 - Math.exp(-dt / OIL_TAU));
  state.fans = fansWanted(state.oil, state.fans);
  const want = state.fans ? 16 : 0;
  state.fanRate = calm ? want : state.fanRate + (want - state.fanRate) * (1 - Math.exp(-dt / 0.9));
  state.fanAngle += state.fanRate * dt;
  state.flux += dt * 2 * Math.PI * 0.55;
  state.dash += dt;
}
let lastText = "";
function draw() {
  const tap = state.tapShown;
  armEl.setAttribute("transform", translateAlong(P, [0, 0, TAP_Z0 + TAP_STEP * tap]));
  pointerEl.setAttribute("d", pointerAt(tap));
  const frac = state.tap / 8;
  const onA = frac >= 0.25, onB = frac >= 0.75;
  tapDiscs.a.forEach((el) => onA ? el.setAttribute("data-lit", "") : el.removeAttribute("data-lit"));
  tapDiscs.b.forEach((el) => onB ? el.setAttribute("data-lit", "") : el.removeAttribute("data-lit"));
  tapRings.a.forEach((el) => { el.style.opacity = onA ? 1 : 0; });
  tapRings.b.forEach((el) => { el.style.opacity = onB ? 1 : 0; });
  needleEl.setAttribute("d", needleAt(state.oil));
  fanEls.forEach((el) => { const i = Number(el.dataset.fan); const f = FANS[i]; const p = bladePath(f[0], f[1], state.fanAngle + i * 0.7); const paths = el.querySelectorAll("path"); paths[0].setAttribute("d", p); paths[1].setAttribute("d", p); });
  ledEl.toggleAttribute("data-on", state.fans);
  const B = fluxDensity(state.tap) / RATED.B;
  const th = state.flux;
  const ab = Math.sin(th), bc = Math.sin(th - Math.PI / 3);
  const lines = { "top-ab": ab, "top-bc": bc, "bot-ab": -ab, "bot-bc": -bc };
  for (const [name, v] of Object.entries(lines)) {
    const el = fluxEls[name];
    el.style.opacity = (0.12 + 0.88 * Math.abs(v) * Math.min(1, B * 1.05)).toFixed(2);
    el.style.strokeDashoffset = (-state.dash * 18 * Math.sign(v) * (name.startsWith("top") ? 1 : 1)).toFixed(1);
    el.style.strokeWidth = (0.9 + 0.7 * B * Math.abs(v)).toFixed(2);
  }
  const hot = Math.sqrt(Math.max(0, state.oil - RATED.ambient) / RATED.rise);
  const dur = (1600 / (0.25 + hot * 1.4)).toFixed(0) + "ms";
  hotEl.style.animationDuration = dur; coldEl.style.animationDuration = dur;
  coldEl.style.animationDirection = "reverse";
  const vs = lineVoltageLV(state.tap), is = currentLV(state.tap, state.load), ip = currentHV(state.load);
  const text = "Vs " + num(vs / 1000, 2) + " kV · óleo " + num(state.oil, 0) + " °C";
  if (text !== lastText) {
    lastText = text;
    readout.textContent = text;
    stage.setAttribute("aria-valuetext", text);
    cell("vp").textContent = num(RATED.Vp / 1000, 1) + " kV";
    cell("vs").textContent = num(vs / 1000, 2) + " kV";
    cell("tap").textContent = (tapFraction(state.tap) >= 0 ? "+" : "−") + num(Math.abs(tapFraction(state.tap)) * 100, 2) + " %";
    cell("np").textContent = turnsHV(state.tap) + " / " + RATED.Ns;
    cell("ip").textContent = num(ip, 0) + " A";
    cell("is").textContent = num(is, 0) + " A";
    cell("load").textContent = num(state.load * 100, 0) + " % · " + num(state.load * 25, 1) + " MVA";
    cell("flux").textContent = num(fluxDensity(state.tap), 2) + " T";
    cell("loss").textContent = num(totalLoss(state.load) / 1000, 0) + " kW";
    cell("eff").textContent = num(efficiency(state.load) * 100, 2) + " %";
    cell("oil").textContent = num(state.oil, 0) + " °C";
    cell("fans").textContent = state.fans ? "ligados · ONAF" : "desl. · ONAN";
  }
  const g = document.querySelector("[data-tapval]");
  if (g) g.textContent = (tapFraction(state.tap) >= 0 ? "+" : "−") + num(Math.abs(tapFraction(state.tap)) * 100, 2) + " %";
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
  last = now;
  step(dt);
  draw();
  frame = visible ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
document.querySelector("[data-tap-down]").addEventListener("click", () => setTap(state.tap - 1));
document.querySelector("[data-tap-up]").addEventListener("click", () => setTap(state.tap + 1));
loadInput.addEventListener("input", () => setLoad(Number(loadInput.value) / 100));
stage.addEventListener("keydown", (event) => {
  const map = { ArrowLeft: () => setTap(state.tap - 1), ArrowRight: () => setTap(state.tap + 1), ArrowUp: () => setLoad(state.load + 0.05), ArrowDown: () => setLoad(state.load - 0.05) };
  if (!map[event.key]) return;
  event.preventDefault();
  map[event.key]();
});
let drag = null;
stage.addEventListener("pointerdown", (event) => { drag = { x: event.clientX, y: event.clientY, tap: state.tap, load: state.load }; stage.setPointerCapture(event.pointerId); });
stage.addEventListener("pointermove", (event) => {
  if (!drag) return;
  const box = svgRoot.getBoundingClientRect();
  const dx = (event.clientX - drag.x) / box.width, dy = (event.clientY - drag.y) / box.height;
  setTap(drag.tap + dx * 18);
  setLoad(drag.load - dy * 1.4);
});
stage.addEventListener("pointerup", () => { drag = null; });
stage.addEventListener("pointercancel", () => { drag = null; });
loadInput.value = Math.round(state.load * 100);
visible = true;
step(0.016); draw();
visible = false;
`;

const cells = [
  ["vp", "Tensão HV"],
  ["vs", "Tensão LV"],
  ["tap", "Tap (HV)"],
  ["np", "Espiras HV / LV"],
  ["ip", "Corrente HV"],
  ["is", "Corrente LV"],
  ["load", "Carga"],
  ["flux", "Indução no núcleo"],
  ["loss", "Perdas"],
  ["eff", "Rendimento"],
  ["oil", "Óleo (topo)"],
  ["fans", "Ventiladores"],
];

const PANEL_CSS = `
.tf-panel{display:grid;grid-template-columns:repeat(auto-fit,minmax(146px,1fr));gap:1px;margin-top:14px;background:var(--anatomy-faint);border:1px solid var(--anatomy-faint)}
.tf-cell{background:var(--anatomy-card);padding:10px 12px}
.tf-cell b{display:block;font:500 15px/1.25 var(--anatomy-mono);color:var(--anatomy-strong);font-variant-numeric:tabular-nums;white-space:nowrap}
.tf-cell span{display:block;margin-top:3px;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--anatomy-muted)}
.tf-controls{display:flex;flex-wrap:wrap;gap:12px 32px;margin-top:14px;align-items:center;font-family:var(--anatomy-mono);font-size:12px;color:var(--anatomy-text)}
.tf-controls label{display:flex;align-items:center;gap:12px}
.tf-controls input[type=range]{width:220px;accent-color:var(--anatomy-hi)}
.tf-btn{font:inherit;color:var(--anatomy-strong);background:var(--anatomy-card);border:1px solid var(--anatomy-mid);padding:6px 12px;cursor:pointer;min-width:40px}
.tf-btn:hover{border-color:var(--anatomy-hi)}
.tf-btn:focus-visible,.iso-stage:focus-visible{outline:1px solid var(--anatomy-hi);outline-offset:3px}
.tf-tap{display:flex;align-items:center;gap:8px}
.tf-tap output{min-width:84px;text-align:center;color:var(--anatomy-strong)}
.iso-stage{touch-action:pan-y;cursor:grab;user-select:none}
.iso-stage:active{cursor:grabbing}
@media (max-width:560px){.iso-stage{overflow:hidden;margin:-18px -4px -26px}.iso-stage .iso-svg{width:124%;max-width:none;margin-left:-12%}}
[data-tap-ring]{transition:opacity .25s}
[data-part="led"]{fill:var(--anatomy-paper)}
[data-part="led"][data-on]{fill:var(--anatomy-lit);stroke:var(--anatomy-lit)}
`;

const panel = `<div class="tf-panel">${cells.map(([id, label]) => `<div class="tf-cell"><b data-cell="${id}">–</b><span>${label}</span></div>`).join("")}</div>
<div class="tf-controls">
  <label>Carga <input id="tf-load" type="range" min="5" max="110" step="1" value="60" aria-label="Carga do transformador em porcentagem da potência nominal"></label>
  <span class="tf-tap">Tap <button class="tf-btn" type="button" data-tap-down aria-label="Diminuir tap">−</button><output data-tapval>0,00 %</output><button class="tf-btn" type="button" data-tap-up aria-label="Aumentar tap">+</button></span>
</div>`;

const fig = k.plateHtml({
  fig: "Fig 1",
  title: "Transformador de potência",
  hint: "Arraste: ←→ tap, ↑↓ carga",
  readout: "Vs 13,80 kV · óleo 62 °C",
  keys: [
    { mark: "lit", label: "Seletor de tap, espiras ativas, fluxo e ponteiros: o que muda" },
    { mark: "raised", label: "Núcleo, bobinas, tanque, radiadores e buchas" },
  ],
  caption:
    "Transformador trifásico de 25 MVA, 69 kV Δ → 13,8 kV Y. Uma tensão alternada no enrolamento de alta cria um fluxo alternado no núcleo, que induz tensão no de baixa na proporção das espiras: Vs/Vp = Ns/Np. Mudar o tap muda Np (±5 % em passos de 1,25 %). A carga gera perdas no cobre, o óleo esquenta e, acima de 75 °C, os ventiladores ligam.",
  body: `<div class="iso-stage" tabindex="0" role="application" aria-label="Transformador de potência: setas esquerda e direita mudam o tap, setas para cima e para baixo mudam a carga">${svg}</div>`,
});

const body = `<style>${PANEL_CSS}</style>${fig}${panel}`;
writeFileSync(join(HERE, OUT), k.pageHtml({ title: "Transformador de potência", theme, body, script: kitScript() + live, width: 900 }));
console.log("wrote", OUT, "items:", items.length);
