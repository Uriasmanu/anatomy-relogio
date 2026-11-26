import { D, HV, LV } from "../parts.mjs";

const { CORE_X, CORE_Y, YOKE_LOW, YOKE_HIGH } = D;
const LEG_Z0 = YOKE_LOW + 18;
const LEG_Z1 = YOKE_HIGH - 18;
const COIL_Z0 = 92;
const COIL_Z1 = 198;
const AT_Z0 = COIL_Z0 - 4;
const AT_H = COIL_Z1 - COIL_Z0 + 8;
const CIL_Z0 = COIL_Z0 - 6;
const CIL_H = COIL_Z1 - COIL_Z0 + 12;
const R_BARRIER_IN = [18.6, 19.8];
const R_BT = [21.4, 26.5];
const R_BARRIER_OUT = [28, 29.2];
const R_AT = [30.6, 38];

let clipId = 0;
function clipAbove(c, F, s, r, svg) {
  const { G, P, V, k } = c;
  const facing = Math.atan2(G.dot3(V, F.v), G.dot3(V, F.u));
  const pts = Array.from({ length: 25 }, (_, j) => k.iso(G.pointOf(F, s, r, facing - Math.PI / 2 + (j / 24) * Math.PI), P));
  const d = k.pathOf([[pts[0][0], -1e4], ...pts, [pts[24][0], -1e4]], true);
  const id = `ca${++clipId}`;
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${svg}</g>`;
}
const frameAt = (c, y, z) => c.frameZ(CORE_X, y, z);

export function drawPernas(c) {
  const { S, L, put, cyl, k, P } = c;
  CORE_Y.forEach((y) => {
    const arcs = [];
    for (let z = LEG_Z0 + 6; z < LEG_Z1; z += 6) arcs.push(k.sideArc(CORE_X, y, 17.4, z, P, 16));
    const leg = S(cyl(CORE_X, y, 17.4, LEG_Z0, LEG_Z1 - LEG_Z0, 16, 0.3), { tone: "hi", crease: "lo", inner: L(arcs.join(""), { tone: "faint" }) });
    put(3, "pernas", [CORE_X, y, 150], clipAbove(c, frameAt(c, y, 0), CIL_Z0 + CIL_H, R_BARRIER_IN[0], leg), 4);
  });
}

export function drawJugos(c) {
  const { S, L, put, slab, seg, dotsAt } = c;
  const x0 = CORE_X - 18;
  const y0 = CORE_Y[0] - 20;
  const len = CORE_Y[2] - CORE_Y[0] + 40;
  const yoke = (z, top) => {
    const out = [S(slab({ x: x0, y: y0, w: 36, d: len, r: 0.8 }, z, 18, 3, 0.4), { tone: "hi", crease: "lo" })];
    if (top) {
      const ticks = [];
      for (let y = y0 + 8; y < y0 + len - 4; y += 7) ticks.push(seg([x0 + 2, y, z + 18], [x0 + 34, y, z + 18]));
      out.push(L(ticks.join(""), { tone: "faint", free: true }));
    }
    for (const dx of [-8, 36]) out.push(S(slab({ x: x0 + dx, y: y0 - 4, w: 8, d: len + 8, r: 0.8 }, z, 18, 2, 0.3), { tone: "mid" }));
    const bolts = [];
    for (let y = y0 + 4; y < y0 + len; y += 36) bolts.push([x0 - 4, y, z + 9], [x0 + 40, y, z + 9]);
    out.push(dotsAt(bolts, { tone: "hi" }));
    return out.join("");
  };
  put(3, "jugos", [CORE_X, 60, YOKE_LOW + 9], yoke(YOKE_LOW, false), -400);
  put(3, "jugos", [CORE_X, 60, YOKE_HIGH - 9], yoke(YOKE_HIGH - 18, true), 400);
}

export function drawBobinasAT(c) {
  const { G, P, S, L, put } = c;
  const DISCS = 8;
  CORE_Y.forEach((y, i) => {
    const F = frameAt(c, y, AT_Z0);
    const pitch = AT_H / DISCS;
    const out = [];
    for (let d = 0; d < DISCS; d++) {
      const s0 = d * pitch + 0.8;
      const s1 = s0 + pitch - 1.6;
      out.push(S(G.ringBand(s0, s1, R_AT[0], R_AT[1], F, P), { tone: "hi", crease: "lo", inner: L(G.arcOf(F, (s0 + s1) / 2, R_AT[1], P), { tone: "faint" }) }));
    }
    put(3, "at", [CORE_X, y, 150], out.join(""), 0);
  });
}

export function drawCilindros(c) {
  const { G, P, S, put } = c;
  CORE_Y.forEach((y, i) => {
    const F = frameAt(c, y, CIL_Z0);
    const inst = i ? "x" + i : "0";
    const outer = S(G.ringBand(0, CIL_H, R_BARRIER_OUT[0], R_BARRIER_OUT[1], F, P), { tone: "lo", crease: "none" });
    put(3, "cilindros", [CORE_X, y, 150], clipAbove(c, frameAt(c, y, AT_Z0), AT_H, R_AT[0], outer), 1, { inst });
    const inner = S(G.ringBand(0, CIL_H, R_BARRIER_IN[0], R_BARRIER_IN[1], F, P), { tone: "lo", crease: "none" });
    put(3, "cilindros", [CORE_X, y, 150], clipAbove(c, frameAt(c, y, COIL_Z0), COIL_Z1 - COIL_Z0 - 2, R_BT[0], inner), 3, { inst });
  });
}

export function drawBobinasBT(c) {
  const { G, P, S, L, put } = c;
  CORE_Y.forEach((y) => {
    const F = frameAt(c, y, COIL_Z0);
    const h = COIL_Z1 - COIL_Z0;
    const turns = [];
    for (let s = 6; s < h - 2; s += 6) turns.push(G.arcOf(F, s, R_BT[1], P));
    const body = S(G.ringBand(2, h - 2, R_BT[0], R_BT[1], F, P), { tone: "hi", crease: "lo", inner: L(turns.join(""), { tone: "faint" }) });
    put(3, "bt", [CORE_X, y, 150], clipAbove(c, frameAt(c, y, CIL_Z0), CIL_H, R_BARRIER_OUT[0], body), 2);
  });
}

export function drawCalcos(c) {
  const { G, P, S, put, slab, frameZ, dotsAt } = c;
  CORE_Y.forEach((y, i) => {
    const blocks = [];
    for (const dx of [-26, 8]) blocks.push(S(slab({ x: CORE_X + dx, y: y - 22, w: 18, d: 44, r: 0.6 }, D.Z_FLOOR, YOKE_LOW - D.Z_FLOOR, 2, 0.3), { tone: "lo" }));
    put(3, "calcos", [CORE_X, y, 52], blocks.join(""), -420 + i, { inst: i ? "x" + i : "0" });
    const rf = frameZ(CORE_X, y, COIL_Z1);
    const ring = [S(G.ringBand(0, 5, R_AT[0] - 0.6, R_AT[1] + 1.5, rf, P), { tone: "mid", crease: "lo" })];
    const Fp = frameZ(CORE_X, y, COIL_Z1 + 5);
    ring.push(dotsAt(Array.from({ length: 10 }, (_, j) => G.pointOf(Fp, 0, R_AT[1] - 3.5, (j / 10) * Math.PI * 2)), { tone: "hi" }));
    put(3, "calcos", [CORE_X, y, COIL_Z1 + 2], ring.join(""), 5, { inst: i ? "xr" + i : "r" });
  });
}

export const TAP_STEP = 9;
const SEL = { x: CORE_X, y: 232, r: 13, z0: 120, z1: 222 };

export function drawComutador(c) {
  const { G, P, S, L, put, slab, frameZ, dotsAt, V } = c;
  const out = [];
  out.push(S(slab({ x: CORE_X - 26, y: CORE_Y[2] + 20, w: 52, d: SEL.y - CORE_Y[2] - 10, r: 1 }, YOKE_HIGH - 12, 4, 2, 0.2), { tone: "mid" }));
  const F = frameZ(SEL.x, SEL.y, SEL.z0);
  const h = SEL.z1 - SEL.z0;
  out.push(S(G.disc(0, 6, SEL.r + 2, F, P), { tone: "lo" }));
  out.push(S(G.solidOf([[6, SEL.r], [h - 8, SEL.r]], F, P), { tone: "hi", crease: "lo", inner: L(G.arcOf(F, 26, SEL.r, P) + G.arcOf(F, h - 28, SEL.r, P), { tone: "faint" }) }));
  const Ft = frameZ(SEL.x, SEL.y, SEL.z0 + h - 8);
  out.push(S(G.disc(0, 8, SEL.r + 2, Ft, P), { tone: "mid", crease: "lo" }));
  const fa = Math.atan2(G.dot3(V, F.v), G.dot3(V, F.u));
  for (let i = 0; i < 9; i++) out.push(`<g data-tap-dot="${i}">${dotsAt([G.pointOf(F, 14 + i * TAP_STEP, SEL.r + 0.2, fa)], { tone: "mid" })}</g>`);
  out.push(`<g data-tap-arm>${L(G.arcOf(F, 14, SEL.r + 1.4, P), { tone: "lit" })}${S(G.ringBand(12.6, 15.4, SEL.r + 0.4, SEL.r + 1.4, F, P), { tone: "lit", crease: "none" })}</g>`);
  out.push(S(G.solidOf([[h - 8, 2.4], [h + 6, 2.4]], F, P), { tone: "lo", crease: "none" }));
  put(3, "comutador", [SEL.x, SEL.y, 170], out.join(""), 330);
}

const bar = (c, from, to, w, tone) => {
  const x0 = Math.min(from[0], to[0]) - w / 2;
  const y0 = Math.min(from[1], to[1]) - w / 2;
  const z0 = Math.min(from[2], to[2]) - w / 2;
  const dx = Math.abs(to[0] - from[0]) + w;
  const dy = Math.abs(to[1] - from[1]) + w;
  const dz = Math.abs(to[2] - from[2]) + w;
  return c.S(c.slab({ x: x0, y: y0, w: dx, d: dy, r: 0.3 }, z0, dz, 1, 0.1), { tone, crease: "none" });
};

export function drawLigacoes(c) {
  const { put, dotsAt } = c;
  const topAt = COIL_Z1 + 6.5;
  const run = D.Z_WALL - 14;
  HV.forEach(({ base }, i) => {
    const y = CORE_Y[i];
    const x0 = CORE_X + 33;
    const [bx, by] = base;
    const rz = run - i * 4;
    const out = [
      bar(c, [x0, y, topAt], [x0, y, rz], 3, "mid"),
      bar(c, [x0, y, rz], [bx, y, rz], 3, "mid"),
      bar(c, [bx, y, rz], [bx, by, rz], 3, "mid"),
      bar(c, [bx, by, rz], [bx, by, D.Z_WALL - 1], 3, "mid"),
      dotsAt([[x0, y, topAt + 1.6], [bx, by, D.Z_WALL - 1]], { tone: "lit" }),
    ];
    put(3, "ligacoes", [bx, by, rz], out.join(""), 340 + i, { inst: i ? "x" + i : "0" });
  });
  LV.forEach(([bx, by], i) => {
    const y = CORE_Y[Math.min(i, 2)];
    const x0 = CORE_X - 24;
    const rz = D.Z_WALL - 26 - i * 3;
    const out = [
      bar(c, [x0, y, COIL_Z1 - 4], [x0, y, rz], 2.6, "mid"),
      bar(c, [x0, y, rz], [bx, y, rz], 2.6, "mid"),
      bar(c, [bx, y, rz], [bx, by, rz], 2.6, "mid"),
      bar(c, [bx, by, rz], [bx, by, D.Z_WALL - 1], 2.6, "mid"),
      dotsAt([[bx, by, D.Z_WALL - 1]], { tone: "lit" }),
    ];
    put(3, "ligacoes", [bx, by, rz], out.join(""), 345 + i, { inst: "xl" + i });
  });
}
