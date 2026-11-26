import * as k from "../kit/iso-kit.mjs";
import * as G from "../kit/lathe.mjs";
import { partById } from "../parts.mjs";
import { makeBlade } from "../live.mjs";

const GHOST = new Set(["tampa", "tampoes", "olhais", "corrimao", "flanges", "radA", "ventiladores"]);

export function makeContext(P) {
  const V = G.viewOf(P);
  const items = [];
  const at = (p) => k.iso(p, P);
  const ctx = {
    k,
    G,
    P,
    V,
    items,
    blade: makeBlade(k, P),
    at,
    S: (paths, style) => k.solidSvg(paths, style),
    L: (d, style) => k.lineSvg(d, style),
    D: (pts, style) => k.dotsSvg(pts, style),
    seg: (a, b) => k.segment(a, b, P),
    slab: (plan, z, h, steps = 3, bevel = 0.4) => k.slabOf(plan, z, h, P, steps, bevel),
    cyl: (x, y, r, z, h, steps = 24, bevel = 0) => k.cylinder(x, y, r, z, h, P, steps, bevel),
    dotsAt: (pts, style = {}) => k.dotsSvg(pts.map(at), { size: 0.5, ...style }),
    frameX: (x, y, z) => G.frameAlong([x, y, z], [1, 0, 0]),
    frameY: (x, y, z) => G.frameAlong([x, y, z], [0, 1, 0]),
    frameZ: (x, y, z) => G.frameAlong([x, y, z], [0, 0, 1]),
    pipe(pts, r, tone = "mid") {
      const out = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const d = G.sub3(pts[i + 1], pts[i]);
        out.push(k.solidSvg(G.solidOf([[0, r], [G.len3(d), r]], G.frameAlong(pts[i], G.unit3(d)), P), { tone, crease: "none" }));
        if (i) out.push(k.solidSvg(G.sphereOf(pts[i], r * 1.15, P), { tone, crease: "none" }));
      }
      return out.join("");
    },
    put(layer, part, point, svg, bias = 0, opts = {}) {
      const move = opts.move || (part && partById[part] ? partById[part].move : null);
      const live = Boolean(move && (move[0] || move[1] || move[2]));
      items.push({
        layer,
        part,
        inst: opts.inst || "0",
        cls: ((opts.cls || "") + (GHOST.has(part) ? " g-cut" : "")).trim(),
        key: k.depthOf(point, P) + bias,
        svg,
        move: live ? move : [0, 0, 0],
      });
    },
  };
  return ctx;
}

export function perimeterDots(plan, z, inset, gap) {
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
