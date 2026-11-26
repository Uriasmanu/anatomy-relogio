import { D, HV, LV, hvAxis, HV_LIFT } from "../parts.mjs";

const { Z_LID } = D;
const HV_IDS = ["buchaA", "buchaB", "buchaC"];

export function drawFlanges(c) {
  const { G, P, V, S, put, cyl, dotsAt } = c;
  HV.forEach(({ base, phi }, index) => {
    const inst = index ? "x" + index : "0";
    const [x, y] = base;
    const ring = [S(cyl(x, y, 29, Z_LID, 2.4, 36), { tone: "lo" }), dotsAt(Array.from({ length: 12 }, (_, i) => [x + 26.5 * Math.cos((i / 12) * Math.PI * 2), y + 26.5 * Math.sin((i / 12) * Math.PI * 2), Z_LID + 2.4]), { tone: "mid" })];
    put(6, "flanges", [x, y, Z_LID], ring.join(""), 1, { inst });
    const a = hvAxis(phi);
    const F = G.frameAlong([x, y, Z_LID], a);
    const turret = G.solidOf([[0, 22], [66, 22], [66, 25.5], [74, 25.5]], F, P);
    const mid = [x + a[0] * 40, y + a[1] * 40, Z_LID + a[2] * 40];
    put(6, "flanges", mid, S(turret, { tone: "mid", crease: "lo" }), 2 + index * 0.2, { inst });
  });
  LV.forEach(([x, y], index) => {
    const ring = [S(cyl(x, y, 19, Z_LID, 2.4, 30), { tone: "lo" }), dotsAt(Array.from({ length: 8 }, (_, i) => [x + 16.8 * Math.cos((i / 8) * Math.PI * 2), y + 16.8 * Math.sin((i / 8) * Math.PI * 2), Z_LID + 2.4]), { tone: "mid" })];
    put(6, "flanges", [x, y, Z_LID], ring.join(""), 1, { inst: "xl" + index });
    const F = c.frameZ(x, y, Z_LID);
    const base = S(G.solidOf([[0, 14], [20, 14], [20, 16], [24, 16]], F, P), { tone: "mid", crease: "lo" });
    put(6, "flanges", [x, y, Z_LID + 12], base, 2, { inst: "xl" + index });
  });
}

export function drawBuchasAT(c) {
  const { G, P, V, S, put, dotsAt } = c;
  HV.forEach(({ base, phi }, index) => {
    const a = hvAxis(phi);
    const [x, y] = base;
    const F = G.frameAlong([x, y, Z_LID], a);
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
    const cap = S(G.solidOf([[top + 22, 3.8], [top + 24, 6.6], [top + 36, 6.6], [top + 38, 4.4], [top + 54, 4.4]], F, P), { tone: "lo", crease: "lo" });
    put(7, HV_IDS[index], [x + a[0] * 120, y + a[1] * 120, Z_LID + a[2] * 120], body + bolts + cap, index * 0.2);
  });
}

export function drawBuchasBT(c) {
  const { G, P, S, put, frameZ } = c;
  LV.forEach(([x, y], index) => {
    const F = frameZ(x, y, Z_LID);
    const profile = [[24, 12], [27, 12], [27, 5.6]];
    for (let i = 0; i < 7; i++) {
      const s = 31 + i * 8;
      profile.push([s, 5.6], [s + 0.5, 9.4], [s + 2.8, 9.4], [s + 3.8, 6.6], [s + 5.6, 5.6]);
    }
    profile.push([89, 5.6], [91, 4], [103, 4], [103, 2.4], [111, 2.4]);
    const cap = S(G.solidOf([[100, 2.8], [102, 4.6], [110, 4.6], [112, 3], [122, 3]], F, P), { tone: "lo", crease: "lo" });
    put(7, "buchaBT", [x, y, Z_LID + 60], S(G.solidOf(profile, F, P), { tone: "hi" }) + cap, 0, { inst: index ? "x" + index : "0" });
  });
}
