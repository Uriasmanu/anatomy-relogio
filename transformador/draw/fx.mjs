import { D, HV, LV, hvAxis, RAD, RAD_R_X, CONS } from "../parts.mjs";
import { GAS } from "./protecao.mjs";

const { CORE_X, CORE_Y, YOKE_HIGH, Z_LID, Z_WALL, Z_FLOOR, OIL_Z, TY0, WALL } = D;

export const GAS_IN = [[CORE_X, CORE_Y[2], 206], [CORE_X + 6, 176, 238], [GAS.x, GAS.y1, Z_WALL - 2]];
export const GAS_PIPE = [[GAS.x, GAS.y1, Z_LID + 2], [GAS.x, GAS.y1, GAS.z], [GAS.x, GAS.relay + 14, GAS.z]];
export const LEVEL = { x: CONS.x0 + CONS.len + 2.2, y: CONS.y, z0: CONS.z - 4, z1: CONS.z + 22, w: 3 };
export const BREATH = { x: CONS.x0 + CONS.len + 20, y: CONS.y, z: CONS.z - 40 };

const line = (c, pts, cls, extra = "") => `<path class="fx-line ${cls}"${extra} d="${c.k.pathOf(pts.map(c.at))}"/>`;
const facing = (c, F) => Math.atan2(c.G.dot3(c.V, F.v), c.G.dot3(c.V, F.u));

export function drawFx(c) {
  const { G, put, frameZ } = c;
  const faceX = RAD_R_X + RAD.depth + 0.2;
  for (let i = 0; i < RAD.count; i++) {
    const yc = RAD.y0 + RAD.pitch * i;
    const mid = (RAD.z0 + RAD.z1) / 2;
    const svg = line(c, [[faceX, yc, RAD.z1 - 6], [faceX, yc, mid]], "fx-oil fx-hot") + line(c, [[faceX, yc, mid], [faceX, yc, RAD.z0 + 6]], "fx-oil fx-cold");
    put(5, "radA", [RAD_R_X + 32, yc, 160], svg, 0.1);
  }
  const hdr = (z, cls) => line(c, [[154, D.TY0 + 10, z + 7.2], [154, D.TY1 - 10, z + 7.2]], cls);
  put(5, "radA", [RAD_R_X, -140, 90], hdr(238, "fx-oil fx-hot fx-rev") + hdr(90, "fx-oil fx-cold"), -299.9);

  HV.forEach(({ base, phi }, i) => {
    const F = G.frameAlong([base[0], base[1], Z_LID], hvAxis(phi));
    const t = facing(c, F);
    const pts = [96, 300].map((s) => G.pointOf(F, s, 15.6, t));
    const a = hvAxis(phi);
    put(7, ["buchaA", "buchaB", "buchaC"][i], [base[0] + a[0] * 160, base[1] + a[1] * 160, Z_LID + a[2] * 160], line(c, pts, "fx-cur fx-cur-hv"), i * 0.2 + 0.05);
  });
  LV.forEach(([x, y], i) => {
    const F = frameZ(x, y, Z_LID);
    const t = facing(c, F);
    put(7, "buchaBT", [x, y, Z_LID + 70], line(c, [41, 99].map((s) => G.pointOf(F, s, 10.6, t)), "fx-cur fx-cur-lv"), 0.05, { inst: i ? "x" + i : "0" });
  });
  HV.forEach(({ base }, i) => {
    const y = CORE_Y[i];
    const x0 = CORE_X + 33;
    const rz = Z_WALL - 14 - i * 4;
    const pts = [[x0, y, 205], [x0, y, rz], [base[0], y, rz], [base[0], base[1], rz], [base[0], base[1], Z_WALL - 1]];
    put(3, "ligacoes", [base[0], base[1], rz], line(c, pts, "fx-cur fx-cur-hv"), 340 + i + 0.1, { inst: i ? "x" + i : "0" });
  });

  const top = YOKE_HIGH + 0.3;
  const seg = (from, to, id) => line(c, [[CORE_X, from, top], [CORE_X, to, top]], "fx-flux", ` data-flux="${id}"`);
  put(3, "jugos", [CORE_X, 60, YOKE_HIGH - 9], seg(CORE_Y[0], CORE_Y[1], "ab") + seg(CORE_Y[1], CORE_Y[2], "bc"), 400.1);

  CORE_Y.forEach((y) => {
    const F = frameZ(CORE_X, y, 0);
    const t = facing(c, F);
    const up = [-0.5, 0.5].map((dt) => line(c, [[0, 96], [0, 196]].map(([, z]) => G.pointOf(F, z, 38.3, t + dt)), "fx-oil fx-hot fx-rev")).join("");
    put(3, "at", [CORE_X, y, 150], up, 0.1);
  });
  const yb = TY0 + WALL + 0.3;
  const down = [-20, 40, 100].map((x) => line(c, [[x, yb, OIL_Z - 10], [x, yb, Z_FLOOR + 10]], "fx-oil fx-cold")).join("");
  put(2, "oleo", [46, 60, 150], down, 51, { cls: "v-cut" });

  const bubbles = (n, id) => Array.from({ length: n }, () => `<circle class="fx-bub" data-bub="${id}" r="1.8" cx="0" cy="0"/>`).join("");
  put(3, "oleo", [46, 60, 150], bubbles(5, "in"), 450, { cls: "v-cut" });
  put(7, "tubo", [GAS.x, 0, GAS.z], bubbles(7, "pipe"), 3.2);

  const glass = [[LEVEL.x, LEVEL.y - LEVEL.w, LEVEL.z0], [LEVEL.x, LEVEL.y + LEVEL.w, LEVEL.z0], [LEVEL.x, LEVEL.y + LEVEL.w, LEVEL.z1], [LEVEL.x, LEVEL.y - LEVEL.w, LEVEL.z1]];
  const glassSvg = `<path class="fx-glass" d="${c.k.pathOf(glass.map(c.at), true)}"/><path class="fx-level" data-level d=""/>`;
  put(7, "conservador", [CONS.x0 + CONS.len - 20, CONS.y, CONS.z], glassSvg, 0.1);
  put(7, "respirador", [BREATH.x, BREATH.y, CONS.z], line(c, [[BREATH.x, BREATH.y, BREATH.z], [BREATH.x, BREATH.y, BREATH.z - 16]], "fx-breath", " data-breath"), 0.6);
}
