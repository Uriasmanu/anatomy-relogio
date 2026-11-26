import { CONS } from "../parts.mjs";

export const LEVEL = { x: CONS.x0 + CONS.len + 2.2, y: CONS.y, z0: CONS.z - 4, z1: CONS.z + 22, w: 3 };

export function drawFx(c) {
  const glass = [[LEVEL.x, LEVEL.y - LEVEL.w, LEVEL.z0], [LEVEL.x, LEVEL.y + LEVEL.w, LEVEL.z0], [LEVEL.x, LEVEL.y + LEVEL.w, LEVEL.z1], [LEVEL.x, LEVEL.y - LEVEL.w, LEVEL.z1]];
  const svg = `<path class="fx-glass" d="${c.k.pathOf(glass.map(c.at), true)}"/><path class="fx-level" data-level d=""/>`;
  c.put(7, "conservador", [CONS.x0 + CONS.len - 20, CONS.y, CONS.z], svg, 0.1);
}
