import { D, RAD, RAD_R_X, RAD_L_X, partById } from "../parts.mjs";

const { TY0, TY1 } = D;

function bank(c, part, xUnit, xHeader, layer, headerBias, headerLow) {
  const { G, P, S, L, put, slab, seg, frameY } = c;
  const faceX = xUnit + RAD.depth;
  const hdr = [];
  for (const z of [90, 238]) {
    const F = frameY(xHeader, TY0 + 10, z);
    hdr.push(S(G.solidOf([[0, 7], [TY1 - TY0 - 20, 7]], F, P), { tone: "mid", crease: "lo" }));
  }
  for (let i = 0; i < RAD.count; i++) {
    const yc = RAD.y0 + RAD.pitch * i;
    const plan = { x: xUnit, y: yc - RAD.thick / 2, w: RAD.depth, d: RAD.thick, r: 1.5 };
    const unit = [S(slab(plan, RAD.z0, RAD.z1 - RAD.z0, 4, 0.8), { tone: "mid" })];
    const fins = Array.from({ length: 17 }, (_, j) => seg([faceX, yc - RAD.thick / 2 + (RAD.thick * j) / 16, RAD.z0], [faceX, yc - RAD.thick / 2 + (RAD.thick * j) / 16, RAD.z1])).join("");
    unit.push(L(fins, { tone: "lo" }));
    unit.push(L(seg([faceX, yc - RAD.thick / 2, 130], [faceX, yc + RAD.thick / 2, 130]) + seg([faceX, yc - RAD.thick / 2, 196], [faceX, yc + RAD.thick / 2, 196]), { tone: "faint" }));
    unit.push(S(slab({ x: xUnit + 2, y: yc - RAD.thick / 2 + 2, w: RAD.depth - 4, d: RAD.thick - 4, r: 1 }, RAD.z1, 3, 2, 0.2), { tone: "lo" }));
    unit.push(S(slab({ x: xUnit + 2, y: yc - RAD.thick / 2 + 2, w: RAD.depth - 4, d: RAD.thick - 4, r: 1 }, RAD.z0 - 3, 3, 2, 0.2), { tone: "lo" }));
    for (const z of [90, 238]) {
      const Fc = frameY(xHeader, yc - 4, z);
      unit.push(S(G.ringBand(0, 8, 7, 10.4, Fc, P), { tone: "lo", crease: "lo" }));
      unit.push(S(G.solidOf([[0, 4.2], [8, 4.2]], c.frameX(xHeader, yc, z), P), { tone: "mid", crease: "none" }));
    }
    put(layer, part, [xUnit + 32, yc, 160], unit.join(""), 0);
  }
  put(layer, part, headerLow, hdr.join(""), headerBias);
}

export function drawRadiadores(c) {
  bank(c, "radA", RAD_R_X, 154, 5, -300, [RAD_R_X, -140, 90]);
  bank(c, "radB", RAD_L_X, -63, 1, 400, [-62, 60, 160]);
}

export const FAN_Z = 44;
export const FAN_R = 25;
const FAN_Y = [-67.5, 22.5, 112.5, 202.5];
export const FAN_POS = [...FAN_Y, ...FAN_Y].map((y, i) => [(i < 4 ? RAD_R_X : RAD_L_X) + RAD.depth / 2, y, FAN_Z + 16]);

export function drawVentiladores(c) {
  const { G, P, S, L, put, dotsAt, frameZ } = c;
  FAN_POS.forEach(([cx, y], i) => {
    const out = [];
    const F = frameZ(cx, y, FAN_Z);
    out.push(S(G.ringBand(0, 30, FAN_R, FAN_R + 3, F, P), { tone: "mid", crease: "lo" }));
    out.push(S(G.ringBand(28, 32, FAN_R - 1, FAN_R + 5, F, P), { tone: "lo", crease: "lo" }));
    out.push(dotsAt(Array.from({ length: 12 }, (_, j) => G.pointOf(F, 32, FAN_R + 2.4, (j / 12) * Math.PI * 2)), { tone: "mid" }));
    const d = c.blade(cx, y, FAN_Z + 16, i * 0.7);
    out.push(`<g data-fan="${i}"><path class="iso-fill" d="${d}"/><path class="iso-line" data-tone="mid" d="${d}"/></g>`);
    out.push(S(G.disc(10, 22, 6, F, P), { tone: "mid", crease: "lo" }));
    const Fg = frameZ(cx, y, FAN_Z + 28);
    out.push(L(G.circleOf(Fg, 0, FAN_R - 1, P) + G.circleOf(Fg, 0, 15, P) + G.circleOf(Fg, 0, 6, P) + G.spokesOf(Fg, 0, 6, FAN_R - 1, 8, P), { tone: "lo" }));
    const left = i >= 4;
    put(left ? 1 : 5, "ventiladores", [cx, y - FAN_R - 8, 160], out.join(""), -0.5, { inst: i ? "x" + i : "0", move: left ? partById.radB.move : null });
  });
}
