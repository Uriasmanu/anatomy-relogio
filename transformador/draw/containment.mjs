import { D } from "../parts.mjs";
import { perimeterDots } from "./ctx.mjs";

const { WALL, Z_BASE, Z_FLOOR, Z_WALL, Z_LID, TX0, TX1, TY0, TY1, OIL_Z } = D;

export function drawBase(c) {
  const { G, P, S, put, slab, dotsAt } = c;
  const OUT = 12;
  const H = 7;
  const ring = (plan) => S(slab(plan, 0, Z_BASE, 2, 0.4), { tone: "lo" });
  const gusset = (o, a, u, x0) => S(G.prismOf(G.frameOf(o, a, u, [0, 0, 1]), [[0, 0], [OUT - 1, 0], [0, -24]], x0, x0 + 2.4, P), { tone: "lo", crease: "lo" });
  const pairs = (from, to, step) => {
    const out = [];
    for (let t = from; t <= to; t += step) out.push(t - 7, t + 5);
    return out;
  };
  put(2, "base", [46, TY0 + 7, 20], ring({ x: TX0, y: TY0, w: TX1 - TX0, d: 14, r: 0.5 }), -300);
  put(2, "base", [TX0 + 7, 60, 20], ring({ x: TX0, y: TY0, w: 14, d: TY1 - TY0, r: 0.5 }), -300);
  put(2, "base", [46, 60, Z_BASE], S(slab({ x: TX0 - OUT, y: TY0 - OUT, w: TX1 - TX0 + 2 * OUT, d: OUT, r: 0.5 }, Z_BASE, H, 1, 0.3), { tone: "lo" }) + S(slab({ x: TX0 - OUT, y: TY0, w: OUT, d: TY1 - TY0, r: 0.5 }, Z_BASE, H, 1, 0.3), { tone: "lo" }), -290);
  const front = [ring({ x: TX0, y: TY1 - 14, w: TX1 - TX0, d: 14, r: 0.5 })];
  for (const x of pairs(-34, 136, 34)) front.push(gusset([0, TY1, Z_BASE], [1, 0, 0], [0, 1, 0], x));
  put(4, "base", [46, TY1 - 7, 20], front.join(""), 20);
  const right = [ring({ x: TX1 - 14, y: TY0, w: 14, d: TY1 - TY0, r: 0.5 })];
  for (const y of pairs(-120, 250, 46)) right.push(gusset([TX1, 0, Z_BASE], [0, 1, 0], [1, 0, 0], y));
  put(4, "base", [TX1 - 7, 60, 20], right.join(""), 10);
  const bolts = (pts) => dotsAt(pts, { tone: "hi" });
  const fx = [];
  for (let x = TX0 - OUT + 5; x <= TX1 + OUT - 4; x += 9) fx.push([x, TY1 + OUT / 2, Z_BASE + H]);
  put(4, "base", [46, TY1 + OUT / 2, Z_BASE + H / 2], S(slab({ x: TX0 - OUT, y: TY1, w: TX1 - TX0 + 2 * OUT, d: OUT, r: 0.5 }, Z_BASE, H, 1, 0.3), { tone: "lo" }) + bolts(fx), 30);
  const ry = [];
  for (let y = TY0 - OUT + 5; y < TY1; y += 9) ry.push([TX1 + OUT / 2, y, Z_BASE + H]);
  put(4, "base", [TX1 + OUT / 2, 60, Z_BASE + H / 2], S(slab({ x: TX1, y: TY0 - OUT, w: OUT, d: TY1 - TY0 + OUT, r: 0.5 }, Z_BASE, H, 1, 0.3), { tone: "lo" }) + bolts(ry), 25);
}

export function drawCuba(c) {
  const { k, G, P, S, L, put, slab, seg, dotsAt, frameX } = c;
  const floor = { x: TX0, y: TY0, w: TX1 - TX0, d: TY1 - TY0, r: 2 };
  put(2, "cuba", [46, 60, Z_BASE], S(slab(floor, Z_BASE, Z_FLOOR - Z_BASE, 3, 0.4), { tone: "mid" }), -400);
  const wallH = Z_WALL - Z_FLOOR;
  const back = [S(slab({ x: TX0, y: TY0, w: TX1 - TX0, d: WALL, r: 0.5 }, Z_FLOOR, wallH, 2, 0.4), { tone: "mid" })];
  for (const x of [-30, 10, 50, 90, 130]) back.push(S(slab({ x: x - 4, y: TY0 + WALL, w: 8, d: 3, r: 0.3 }, Z_FLOOR, wallH, 1, 0), { tone: "mid", crease: "none" }));
  put(2, "cuba", [46, TY0, 150], back.join(""), 0);
  const left = [S(slab({ x: TX0, y: TY0 + WALL, w: WALL, d: TY1 - TY0 - WALL, r: 0.5 }, Z_FLOOR, wallH, 2, 0.4), { tone: "mid" })];
  for (const y of [-90, -20, 60, 140, 220]) left.push(S(slab({ x: TX0 + WALL, y: y - 4, w: 3, d: 8, r: 0.3 }, Z_FLOOR, wallH, 1, 0), { tone: "mid", crease: "none" }));
  left.push(L(seg([TX0 + WALL, TY1, Z_FLOOR], [TX0 + WALL, TY1, Z_WALL]), { tone: "lo" }));
  put(2, "cuba", [TX0, 60, 150], left.join(""), 5);
  const right = [S(slab({ x: TX1 - WALL, y: TY0 + WALL, w: WALL, d: TY1 - TY0 - WALL, r: 0.5 }, Z_FLOOR, wallH, 2, 0.4), { tone: "mid" })];
  for (const y of [-100, -30, 40, 110, 180, 245]) right.push(S(slab({ x: TX1, y: y - 4, w: 5, d: 8, r: 0.3 }, Z_FLOOR, wallH, 1, 0), { tone: "mid", crease: "none" }));
  for (const y of [-20, 170]) {
    for (const z of [92, 238]) {
      const F = frameX(TX1, y, z);
      right.push(S(G.disc(0, 7, 13, F, P), { tone: "lo" }));
      right.push(dotsAt(Array.from({ length: 8 }, (_, i) => G.pointOf(F, 7, 10, (i / 8) * Math.PI * 2)), { tone: "mid" }));
      right.push(L(G.circleOf(F, 7, 6.5, P), { tone: "faint" }));
    }
  }
  put(4, "cuba", [TX1, 60, 150], right.join(""), 0, { cls: "x-cut" });
  const front = [S(slab({ x: TX0, y: TY1 - WALL, w: TX1 - TX0, d: WALL, r: 0.5 }, Z_FLOOR, wallH, 2, 0.4), { tone: "mid" })];
  for (const x of [-38, 132]) {
    front.push(S(slab({ x: x - 2, y: TY1, w: 4, d: 8, r: 0.2 }, Z_FLOOR, wallH, 1, 0), { tone: "mid", crease: "none" }));
    front.push(S(slab({ x: x - 7, y: TY1 + 8, w: 14, d: 3, r: 0.3 }, Z_FLOOR, wallH, 1, 0), { tone: "mid", crease: "none" }));
  }
  put(4, "cuba", [46, TY1, 150], front.join(""), 10, { cls: "x-cut" });
}

function hatch(c, plane, fixed, a0, a1, z0, z1, gap) {
  const { seg } = c;
  const lines = [];
  const span = a1 - a0;
  const h = z1 - z0;
  for (let t = -h; t <= span; t += gap) {
    const lo = Math.max(0, t);
    const hi = Math.min(span, t + h);
    if (hi - lo < 1) continue;
    const pa = (u) => (plane === "y" ? [a0 + u, fixed, z0 + (u - t)] : [fixed, a0 + u, z0 + (u - t)]);
    lines.push(seg(pa(lo), pa(hi)));
  }
  return lines.join("");
}

export function drawOil(c) {
  const { k, P, S, L, put, slab, seg } = c;
  const x0 = TX0 + WALL;
  const x1 = TX1 - WALL;
  const y0 = TY0 + WALL;
  const y1 = TY1 - WALL;
  const face = (fixed, axis) => k.pathOf((axis === "y" ? [[x0, fixed, Z_FLOOR], [x1, fixed, Z_FLOOR], [x1, fixed, OIL_Z], [x0, fixed, OIL_Z]] : [[fixed, y0, Z_FLOOR], [fixed, y1, Z_FLOOR], [fixed, y1, OIL_Z], [fixed, y0, OIL_Z]]).map(c.at), true);
  const wet = [
    hatch(c, "y", y0, x0, x1, Z_FLOOR, OIL_Z, 10),
    hatch(c, "x", x0, y0, y1, Z_FLOOR, OIL_Z, 10),
    face(y0, "y") + face(x0, "x"),
  ].map((d) => L(d, { tone: "lo" })).join("");
  const level = { x: x0, y: y0, w: x1 - x0, d: y1 - y0, r: 0 };
  const zz = OIL_Z;
  const back = L(seg([x0, y0, zz], [x1, y0, zz]) + seg([x0, y0, zz], [x0, y1, zz]), { tone: "mid", dashed: true });
  const near = L(seg([x1, y0, zz], [x1, y1, zz]) + seg([x0, y1, zz], [x1, y1, zz]), { tone: "mid", dashed: true });
  put(2, "oleo", [46, 60, 150], wet + back, 50, { cls: "v-cut" });
  put(4, "oleo", [46, 60, 150], near, 40, { cls: "v-cut" });
  const block = S(slab(level, Z_FLOOR, OIL_Z - Z_FLOOR, 4, 1), { tone: "mid" });
  const waves = L([-80, -10, 60, 120].map((x) => seg([x, 40 + (x % 3) * 8, OIL_Z], [x + 26, 40 + (x % 3) * 8, OIL_Z])).join(""), { tone: "lo", free: true });
  put(3, "oleo", [46, 60, 150], block + waves, -380, { cls: "v-sheet" });
}

export function drawDreno(c) {
  const { P, G, S, L, put, dotsAt, frameZ } = c;
  const x = 126;
  const z = 62;
  const Fy = G.frameAlong([x, TY1, z], [0, 1, 0]);
  const out = [S(G.disc(0, 3, 9, Fy, P), { tone: "lo" })];
  out.push(dotsAt(Array.from({ length: 6 }, (_, i) => G.pointOf(Fy, 3, 7, (i / 6) * Math.PI * 2)), { tone: "mid" }));
  out.push(S(G.solidOf([[3, 6], [17, 6]], Fy, P), { tone: "mid", crease: "none" }));
  const Fz = frameZ(x, TY1 + 10, z);
  out.push(S(G.solidOf([[0, 4.6], [14, 4.6]], Fz, P), { tone: "mid", crease: "none" }));
  out.push(S(G.solidOf([[14, 1.6], [24, 1.6]], Fz, P), { tone: "lo", crease: "none" }));
  const Fw = frameZ(x, TY1 + 10, z + 24);
  out.push(S(G.disc(0, 2, 9, Fw, P), { tone: "lo" }));
  out.push(L(G.spokesOf(Fw, 2, 0, 9, 4, P), { tone: "lo" }));
  put(4, "dreno", [x, TY1 + 10, z], out.join(""), 15, { cls: "x-cut" });
}

export function drawTampa(c) {
  const { k, P, S, L, put, slab, dotsAt } = c;
  const LIDP = { x: -58, y: -154, w: 216, d: 432, r: 16 };
  const svg = [`<path class="iso-halo" d="${k.haloOf(LIDP, Z_LID, 1, P)}" style="filter:blur(6px)"/>`];
  svg.push(S(slab(LIDP, Z_WALL, Z_LID - Z_WALL, 6, 1), { tone: "mid" }));
  svg.push(L(k.planOutline(k.insetPlan(LIDP, 4), Z_LID, P, 6), { tone: "faint" }));
  svg.push(dotsAt(perimeterDots(LIDP, Z_LID, 4, 16), { tone: "mid" }));
  put(6, "tampa", [50, 60, Z_LID], svg.join(""), -400);
}

export function drawTubosTampa(c) {
  const x = -43;
  const z = Z_LID + 9;
  const pts = [[x, 205, Z_LID], [x, 205, z], [x, -124, z], [-27, -124, z], [-27, -124, Z_LID]];
  const out = [c.pipe(pts, 2.2)];
  for (const y of [150, 60, -30, -110]) out.push(c.S(c.slab({ x: x - 3, y: y - 2, w: 6, d: 4, r: 0.4 }, Z_LID, z - Z_LID - 1.5, 1, 0.1), { tone: "lo", crease: "none" }));
  for (const [px, py] of [[x, 205], [-27, -124]]) out.push(c.S(c.cyl(px, py, 4.4, Z_LID, 2.4, 16), { tone: "lo" }));
  c.put(6, "tampa", [x, 40, z], out.join(""), 6, { inst: "xg" });
}

export function drawTampoes(c) {
  const { S, L, put, slab, cyl, dotsAt } = c;
  const mh = (x, y, r) => {
    const out = [S(cyl(x, y, r + 3, Z_LID, 3, 36), { tone: "lo" }), S(cyl(x, y, r, Z_LID + 3, 3, 36, 0.3), { tone: "mid" })];
    out.push(dotsAt(Array.from({ length: 12 }, (_, i) => [x + (r + 1.5) * Math.cos((i / 12) * Math.PI * 2), y + (r + 1.5) * Math.sin((i / 12) * Math.PI * 2), Z_LID + 3]), { tone: "mid" }));
    out.push(S(slab({ x: x - 7, y: y - 2.5, w: 14, d: 5, r: 2 }, Z_LID + 6, 2.4, 3, 0.2), { tone: "mid" }));
    return out.join("");
  };
  put(6, "tampoes", [0, -90, Z_LID], mh(0, -90, 24), 0);
  put(6, "tampoes", [40, 220, Z_LID], mh(40, 220, 18), 2, { inst: "x1" });
}

export function drawOlhais(c) {
  const { k, P, S, L, put, slab } = c;
  [[-48, -144], [-48, 266], [148, -144], [148, 266]].forEach(([x, y], i) => {
    const lug = [S(slab({ x: x - 6, y: y - 1.5, w: 12, d: 3, r: 1 }, Z_LID, 14, 3, 0.3), { tone: "mid" }), L(k.sideRing([x, y + 1.5, Z_LID + 9], 3, "y", P, 16), { tone: "lo" })];
    put(6, "olhais", [x, y, Z_LID], lug.join(""), 3, { inst: i ? "x" + i : "0" });
  });
}

export function drawCorrimao(c) {
  const { G, S, put, slab, frameY } = c;
  for (const y of [-110, -40, 30, 100, 160, 202]) {
    const post = S(slab({ x: 41.2, y: y - 1.8, w: 3.6, d: 3.6, r: 0.4 }, Z_LID, 80, 1, 0.1), { tone: "mid", crease: "none" });
    const plate = S(slab({ x: 36, y: y - 5, w: 14, d: 10, r: 1.5 }, Z_LID, 2.4, 2, 0), { tone: "lo" });
    put(7, "corrimao", [43, y, Z_LID + 40], plate + post, 5);
  }
  for (const x of [-50, 150]) {
    const ys = [-140, -70, 0, 70, 140, 210, 262];
    ys.forEach((y) => put(7, "corrimao", [x, y, Z_LID + 20], S(slab({ x: x - 1.4, y: y - 1.4, w: 2.8, d: 2.8, r: 0.3 }, Z_LID, 40, 1, 0), { tone: "mid", crease: "none" }), 3));
    for (let i = 0; i < ys.length - 1; i++) {
      const rail = [S(slab({ x: x - 1.4, y: ys[i], w: 2.8, d: ys[i + 1] - ys[i], r: 0.3 }, Z_LID + 38, 2.8, 1, 0.1), { tone: "mid", crease: "none" }), S(slab({ x: x - 1.2, y: ys[i], w: 2.4, d: ys[i + 1] - ys[i], r: 0.3 }, Z_LID + 20, 2.4, 1, 0.1), { tone: "lo", crease: "none" })];
      put(7, "corrimao", [x, (ys[i] + ys[i + 1]) / 2, Z_LID + 30], rail.join(""), 3.5);
    }
  }
}
