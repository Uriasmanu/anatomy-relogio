import { D, HV, LV, hvAxis } from "../parts.mjs";

const { Z_LID } = D;
const HV_IDS = ["buchaA", "buchaB", "buchaC"];

export const HV_TURRET = [[0, 19], [80, 19], [80, 25], [85, 25]];
export function hvPorcelain() {
  const p = [[85, 12], [95, 12], [95, 8]];
  for (let i = 0; i < 34; i++) {
    const s = 98 + i * 5.6;
    p.push([s, 8], [s + 0.4, 15], [s + 2, 15], [s + 2.6, 8]);
  }
  p.push([292, 8], [292, 9.5], [300, 9.5], [300, 3], [312, 3], [312, 4.5], [318, 4.5], [318, 2], [326, 2]);
  return p;
}
export const LV_TURRET = [[0, 12], [30, 12], [30, 15], [34, 15]];
export function lvPorcelain() {
  const p = [[34, 8], [38, 8], [38, 5.5]];
  for (let i = 0; i < 11; i++) {
    const s = 41 + i * 5.2;
    p.push([s, 5.5], [s + 0.4, 10], [s + 1.8, 10], [s + 2.4, 5.5]);
  }
  p.push([99, 5.5], [99, 6.5], [105, 6.5], [105, 2.4], [116, 2.4], [116, 3.6], [121, 3.6], [121, 1.6], [128, 1.6]);
  return p;
}

function porcelainSvg(c, F, { from, neck, core, shed, count, pitch, cap }) {
  const { G, P, S } = c;
  const out = [S(G.solidOf(neck, F, P), { tone: "hi", crease: "lo" })];
  let s0 = neck[neck.length - 1][0];
  for (let i = 0; i < count; i++) {
    const s = from + i * pitch;
    out.push(S(G.solidOf([[s0, core], [s, core]], F, P), { tone: "hi", crease: "none" }));
    out.push(S(G.solidOf([[s, core + 0.5], [s + 0.5, shed], [s + 1.7, shed], [s + 2.3, core + 0.5]], F, P), { tone: "hi", crease: "lo" }));
    s0 = s + 2.3;
  }
  out.push(S(G.solidOf([[s0, core], [cap[0][0], core]], F, P), { tone: "hi", crease: "none" }));
  out.push(S(G.solidOf(cap, F, P), { tone: "lo", crease: "lo" }));
  return out.join("");
}
const HV_PORC = { from: 98, neck: [[85, 12], [95, 12], [95, 8], [96, 8]], core: 8, shed: 15, count: 34, pitch: 5.6, cap: [[292, 9.5], [300, 9.5], [300, 3], [312, 3], [312, 4.5], [318, 4.5], [318, 2], [326, 2]] };
const LV_PORC = { from: 41, neck: [[34, 8], [38, 8], [38, 5.5], [39, 5.5]], core: 5.5, shed: 10, count: 11, pitch: 5.2, cap: [[99, 6.5], [105, 6.5], [105, 2.4], [116, 2.4], [116, 3.6], [121, 3.6], [121, 1.6], [128, 1.6]] };

const bolts = (c, F, s, r, n, o) => c.dotsAt(Array.from({ length: n }, (_, i) => c.G.pointOf(F, s, r, (i / n) * Math.PI * 2)).filter((pt) => c.G.dot3(c.G.sub3(pt, o), c.V) > -r * 0.2), { tone: "hi" });

export function drawFlanges(c) {
  const { G, P, S, put, cyl } = c;
  HV.forEach(({ base, phi }, index) => {
    const inst = index ? "x" + index : "0";
    const [x, y] = base;
    const o = [x, y, Z_LID];
    put(6, "flanges", o, S(cyl(x, y, 29, Z_LID, 2.4, 36), { tone: "lo" }) + bolts(c, c.frameZ(x, y, Z_LID), 2.4, 26.5, 14, o), 1, { inst });
    const a = hvAxis(phi);
    const F = G.frameAlong(o, a);
    const turret = S(G.solidOf(HV_TURRET, F, P), { tone: "mid", crease: "lo", inner: c.L(G.arcOf(F, 6, 19, P), { tone: "faint" }) });
    put(6, "flanges", [x + a[0] * 40, y + a[1] * 40, Z_LID + a[2] * 40], turret + bolts(c, F, 85, 22.5, 12, o), 2 + index * 0.2, { inst });
  });
  LV.forEach(([x, y], index) => {
    const o = [x, y, Z_LID];
    const F = c.frameZ(x, y, Z_LID);
    put(6, "flanges", o, S(cyl(x, y, 19, Z_LID, 2.4, 30), { tone: "lo" }) + bolts(c, F, 2.4, 16.8, 10, o), 1, { inst: "xl" + index });
    put(6, "flanges", [x, y, Z_LID + 15], S(G.solidOf(LV_TURRET, F, P), { tone: "mid", crease: "lo" }) + bolts(c, F, 34, 13.4, 10, o), 2, { inst: "xl" + index });
  });
}

export function drawBuchasAT(c) {
  const { G, P, S, put } = c;
  HV.forEach(({ base, phi }, index) => {
    const a = hvAxis(phi);
    const [x, y] = base;
    const F = G.frameAlong([x, y, Z_LID], a);
    put(7, HV_IDS[index], [x + a[0] * 160, y + a[1] * 160, Z_LID + a[2] * 160], porcelainSvg(c, F, HV_PORC), index * 0.2);
  });
}

export function drawBuchasBT(c) {
  const { G, P, S, put, frameZ } = c;
  LV.forEach(([x, y], index) => {
    put(7, "buchaBT", [x, y, Z_LID + 70], porcelainSvg(c, frameZ(x, y, Z_LID), LV_PORC), 0, { inst: index ? "x" + index : "0" });
  });
}
