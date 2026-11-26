import { D, CONS, CAB } from "../parts.mjs";

const { Z_LID, TY0, TY1 } = D;
export const OTI = { x: 130, y: TY1 + 8, z: 196, r: 7 };
const OTI_R = OTI.r;

export function drawConservador(c) {
  const { G, P, S, L, put, slab, dotsAt, frameX } = c;
  const F = frameX(CONS.x0, CONS.y, CONS.z);
  const r = CONS.r;
  const L0 = CONS.len;
  const seams = [64, 128].map((s) => G.arcOf(F, s, r, P, { trim: 0 })).join("");
  const body = [S(G.solidOf([[0, r - 2], [2, r], [L0 - 4, r], [L0 - 4, r + 2], [L0, r + 2]], F, P), { tone: "hi", inner: L(seams, { tone: "faint" }) })];
  const Fe = frameX(CONS.x0 + L0, CONS.y, CONS.z);
  const end = [CONS.x0 + L0, CONS.y, CONS.z];
  body.push(dotsAt(Array.from({ length: 16 }, (_, i) => G.pointOf(Fe, 0, r - 2, (i / 16) * Math.PI * 2)), { tone: "hi" }));
  const vert = (dy, z0, z1) => c.seg([end[0], CONS.y + dy, CONS.z + z0], [end[0], CONS.y + dy, CONS.z + z1]);
  for (const dy of [-r * 0.55, r * 0.55]) {
    body.push(S(slab({ x: end[0], y: CONS.y + dy - 1.6, w: 4, d: 3.2, r: 0.4 }, CONS.z - 10, 20, 1, 0.1), { tone: "mid", crease: "none" }));
    body.push(L(vert(dy, -10, 10), { tone: "lo", free: true }));
  }
  body.push(S(G.disc(0, 3, 5, frameX(end[0], CONS.y, CONS.z - r * 0.4), P), { tone: "lo", crease: "lo" }));
  put(7, "conservador", [CONS.x0 + L0 - 20, CONS.y, CONS.z], body.join(""), 0);
  for (const x of [-12, 118]) {
    const strap = S(slab({ x: x - 7, y: CONS.y - r - 3, w: 14, d: 2 * r + 6, r: 4 }, CONS.z - r - 4, 6, 4, 0.2), { tone: "lo" });
    put(7, "conservador", [x, CONS.y, CONS.z - r], strap, 1);
  }
  const loop = (x, toY) => {
    const top = CONS.z + r + 14;
    const pts = [[x, CONS.y, CONS.z + r - 1], [x, CONS.y, top], [x, toY, top], [x, toY, Z_LID]];
    const clamps = [0.25, 0.6].map((t) => S(c.cyl(x, toY, 3.6, top - (top - Z_LID) * t, 2.4, 14), { tone: "lo", crease: "none" }));
    return c.pipe(pts, 2) + S(c.cyl(x, CONS.y, 3.8, CONS.z + r - 1, 3, 14), { tone: "lo" }) + S(c.cyl(x, toY, 4.4, Z_LID, 2.4, 14), { tone: "lo" }) + clamps.join("");
  };
  put(7, "conservador", [-12, TY0 + 4, 340], loop(-12, TY0 + 4), 3);
  put(7, "conservador", [118, TY0 + 4, 340], loop(118, TY0 + 4), 3);
}

export function drawSuportes(c) {
  const { G, P, S, put, slab } = c;
  [-35, 140].forEach((x, i) => {
    const from = [x, TY0 + 6, Z_LID];
    const to = [x, CONS.y + 12, CONS.z - CONS.r - 3];
    const d = G.sub3(to, from);
    const len = G.len3(d);
    const a = G.unit3(d);
    const v = G.cross3(a, [1, 0, 0]);
    const FS = G.frameOf(from, a, [1, 0, 0], v);
    const strut = G.prismOf(FS, [[-4, -12], [4, -12], [4, 12], [-4, 12]], 0, len, P);
    const plate = S(slab({ x: x - 9, y: TY0 - 4, w: 18, d: 22, r: 1.5 }, Z_LID, 3, 3, 0.2), { tone: "lo" });
    put(7, "suportes", [x, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2], plate + S(strut, { tone: "mid", crease: "lo" }), 2, { inst: i ? "x" : "0" });
  });
}

export const GAS = { x: 43, z: 347, y0: CONS.y, y1: 185, relay: -138 };

export function drawTubo(c) {
  const { S, put, cyl } = c;
  const { x, z, y0, y1 } = GAS;
  const pts = [[x, y0, CONS.z - CONS.r + 1], [x, y0, z], [x, y1, z], [x, y1, Z_LID]];
  const out = [c.pipe(pts, 5.2), S(cyl(x, y1, 9, Z_LID, 3, 20), { tone: "lo" }), S(cyl(x, y0, 8, CONS.z - CONS.r - 2, 3, 20), { tone: "lo" })];
  put(7, "tubo", [x, (y0 + y1) / 2, z], out.join(""), 3);
}

export function drawBuchholz(c) {
  const { G, P, S, L, put, slab, dotsAt } = c;
  const { x, z, relay } = GAS;
  const F = G.frameAlong([x, relay - 12, z], [0, 1, 0]);
  const out = [];
  for (const s of [0, 21]) {
    out.push(S(G.disc(s, s + 3, 12, F, P), { tone: "lo", crease: "lo" }));
    out.push(dotsAt(Array.from({ length: 8 }, (_, i) => G.pointOf(F, s + 3, 10, (i / 8) * Math.PI * 2 + 0.4)).filter((p) => G.dot3(G.sub3(p, [x, relay, z]), c.V) > -4), { tone: "hi" }));
  }
  out.push(S(G.solidOf([[3, 9.5], [21, 9.5]], F, P), { tone: "hi", crease: "lo", inner: L(G.arcOf(F, 12, 9.5, P), { tone: "faint" }) }));
  out.push(S(slab({ x: x - 6, y: relay - 7, w: 12, d: 14, r: 1 }, z + 8, 9, 2, 0.3), { tone: "mid", crease: "lo" }));
  out.push(S(G.disc(0, 4, 3.2, G.frameAlong([x + 6, relay, z + 12], [1, 0, 0]), P), { tone: "lo" }));
  put(7, "buchholz", [x, relay, z + 4], out.join(""), 3.1);
}

export function drawRespirador(c) {
  const { k, G, P, S, L, put, cyl } = c;
  const bx = CONS.x0 + CONS.len + 20;
  const by = CONS.y;
  const top = CONS.z + CONS.r + 12;
  const out = [c.pipe([[CONS.x0 + CONS.len - 10, by, CONS.z + CONS.r - 1], [CONS.x0 + CONS.len - 10, by, top], [bx, by, top], [bx, by, CONS.z + 26]], 2)];
  out.push(S(cyl(bx, by, 7, CONS.z + 20, 6, 18), { tone: "mid", crease: "lo" }));
  out.push(S(cyl(bx, by, 9, CONS.z - 26, 46, 24), { tone: "hi", inner: L(k.sideArc(bx, by, 9, CONS.z - 12, P, 18) + k.sideArc(bx, by, 9, CONS.z + 4, P, 18), { tone: "faint" }) }));
  out.push(S(cyl(bx, by, 10.5, CONS.z - 32, 6, 24), { tone: "mid" }));
  out.push(S(cyl(bx, by, 4, CONS.z - 40, 8, 14), { tone: "lo", crease: "none" }));
  put(7, "respirador", [bx, by, CONS.z], out.join(""), 0.5);
}

export function drawTermometro(c) {
  const { k, G, P, S, L, put, at } = c;
  const x = 130;
  const z = 196;
  const F = G.frameAlong([x, TY1, z], [0, 1, 0]);
  const out = [S(G.disc(0, 6, 12, F, P), { tone: "mid", crease: "lo" })];
  out.push(S(G.ringBand(5, 8, 10, 13, F, P), { tone: "lo" }));
  const Fg = G.frameAlong([x, TY1 + 8, z], [0, 1, 0]);
  out.push(L(G.circleOf(Fg, 0, 9.4, P), { tone: "faint" }));
  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const a = ((-135 + 27 * i) * Math.PI) / 180;
    const pt = (rr) => G.pointOf(Fg, 0, rr, Math.PI / 2 - a);
    ticks.push(k.pathOf([at(pt(9.4 - (i % 5 === 0 ? 3.4 : 1.8))), at(pt(9.4))]));
  }
  out.push(L(ticks.join(""), { tone: "mid" }));
  const na = ((-135 + (270 * 62) / 150) * Math.PI) / 180;
  out.push(`<path data-oti-needle data-free class="iso-line" data-tone="lit" d="${k.pathOf([at([x, TY1 + 8, z]), at([x + OTI_R * Math.sin(na), TY1 + 8, z + OTI_R * Math.cos(na)])])}"/>`);
  out.push(S(G.disc(0, 1.4, 1.6, Fg, P), { tone: "lo", crease: "none" }));
  out.push(S(G.solidOf([[-5, 2], [0, 2]], G.frameAlong([x, TY1, z - 14], [0, 1, 0]), P), { tone: "lo", crease: "none" }));
  put(4, "termometro", [x, TY1 + 6, z], out.join(""), 15, { cls: "x-cut" });
}

export function drawArmario(c) {
  const { k, G, P, S, L, put, slab, cyl, at, dotsAt } = c;
  const plan = { x: CAB.x, y: CAB.y, w: CAB.w, d: CAB.d, r: 2 };
  const out = [S(slab(plan, CAB.z0, CAB.z1 - CAB.z0, 4, 0.8), { tone: "mid" })];
  out.push(S(slab({ x: CAB.x - 3, y: CAB.y - 2, w: CAB.w + 6, d: CAB.d + 5, r: 1 }, CAB.z1, 3, 3, 0.3), { tone: "lo" }));
  const FR = G.frameOf([CAB.x - 3, 0, CAB.z1 + 3], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  out.push(S(G.prismOf(FR, [[CAB.y - 2, 0], [CAB.y + CAB.d + 3, 0], [CAB.y + CAB.d / 2, 12]], 0, CAB.w + 6, P), { tone: "mid", crease: "lo" }));
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
  out.push(L([[14, 7], [12, 9.5], [10, 12]].map(([w, dz]) => c.seg([door.x + 13, yf + 3, CAB.z1 - 40 + dz * 0.8], [door.x + 13 + w, yf + 3, CAB.z1 - 40 + dz * 0.8])).join(""), { tone: "lo", free: true }));
  out.push(dotsAt([[door.x + 3, yf + 2, CAB.z0 + 11], [door.x + door.w - 3, yf + 2, CAB.z0 + 11], [door.x + 3, yf + 2, CAB.z1 - 11], [door.x + door.w - 3, yf + 2, CAB.z1 - 11]], { tone: "mid" }));
  const hinges = [CAB.z0 + 20, CAB.z1 - 28].map((z) => S(slab({ x: door.x - 3, y: yf, w: 3, d: 3, r: 0.5 }, z, 8, 1, 0), { tone: "lo", crease: "none" }));
  out.push(hinges.join(""));
  put(5, "armario", [CAB.x + CAB.w / 2, CAB.y + CAB.d, 140], out.join(""), 0);
}

export function drawEletrodutos(c) {
  const { G, P, S, put, frameZ, slab } = c;
  const yc = CAB.y + CAB.d / 2;
  [34, 62].forEach((x, i) => {
    const F = frameZ(x, yc, 0);
    const cond = [S(G.solidOf([[0, 5], [CAB.z0 - 6, 5]], F, P), { tone: "mid", crease: "none" }), S(G.disc(CAB.z0 - 10, CAB.z0 - 6, 8, F, P), { tone: "lo" }), S(G.disc(0, 4, 8, F, P), { tone: "lo" })];
    put(5, "eletrodutos", [x, yc, 40], cond.join(""), -2, { inst: i ? "x" : "0" });
  });
  const yr = 290;
  const Fr = frameZ(52, yr, CAB.z1 + 12);
  const riser = [S(G.solidOf([[0, 6], [D.Z_LID + 30 - CAB.z1 - 12, 6]], Fr, P), { tone: "mid", crease: "none" }), S(G.disc(0, 4, 9, Fr, P), { tone: "lo" })];
  for (const z of [CAB.z1 + 40, D.Z_LID - 18]) riser.push(S(slab({ x: 49, y: TY1, w: 6, d: yr - TY1, r: 0.5 }, z, 4, 1, 0.1), { tone: "lo", crease: "none" }));
  put(7, "eletrodutos", [52, yr, 230], riser.join(""), 4, { inst: "xr" });
  const run = (dz) => {
    const pts = [[CAB.x + CAB.w, 282, 118 + dz], [140 + dz / 2, 282, 118 + dz], [140 + dz / 2, 282, 50 + dz], [140 + dz / 2, TY1 + 2, 50 + dz]];
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const d = G.sub3(b, a);
      out.push(S(G.solidOf([[0, 1.8], [G.len3(d), 1.8]], G.frameAlong(a, G.unit3(d)), P), { tone: "mid", crease: "none" }));
      if (i) out.push(S(G.sphereOf(a, 2.2, P), { tone: "mid", crease: "none" }));
    }
    out.push(S(G.disc(0, 3, 3.4, G.frameAlong([pts[3][0], TY1, pts[3][2]], [0, 1, 0]), P), { tone: "lo" }));
    return out.join("");
  };
  put(5, "eletrodutos", [140, 282, 90], run(0) + run(6), 6, { inst: "xc" });
}

export function drawEscada(c) {
  const { S, put, slab } = c;
  const lad = [];
  const lx = [-42, -14];
  const yL = TY1 + 10;
  const top = Z_LID + 22;
  for (const x of lx) lad.push(S(slab({ x: x - 1.8, y: yL, w: 3.6, d: 3.6, r: 0.5 }, 50, top - 50, 1, 0.2), { tone: "mid", crease: "none" }));
  for (let z = 62; z <= 250; z += 14) lad.push(S(slab({ x: lx[0], y: yL + 0.3, w: lx[1] - lx[0], d: 3, r: 0.5 }, z, 3, 1, 0.1), { tone: "lo", crease: "none" }));
  for (const z of [70, 150, 230]) for (const x of lx) lad.push(S(slab({ x: x - 1.5, y: TY1, w: 3, d: yL - TY1, r: 0.3 }, z, 4, 1, 0), { tone: "lo", crease: "none" }));
  for (const x of lx) {
    lad.push(S(slab({ x: x - 1.6, y: TY1 - 8, w: 3.2, d: yL - TY1 + 11.6, r: 0.4 }, top - 3.2, 3.2, 1, 0.1), { tone: "mid", crease: "none" }));
    lad.push(S(slab({ x: x - 1.6, y: TY1 - 8, w: 3.2, d: 3.2, r: 0.4 }, Z_LID, top - Z_LID, 1, 0.1), { tone: "mid", crease: "none" }));
  }
  put(5, "escada", [-28, yL, 150], lad.join(""), -1);
}
