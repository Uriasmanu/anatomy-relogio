import * as k from "./kit/iso-kit.mjs";
import { makeContext } from "./draw/ctx.mjs";
import { drawBase, drawCuba, drawOil, drawDreno, drawTampa, drawTubosTampa, drawTampoes, drawOlhais, drawCorrimao } from "./draw/containment.mjs";
import { drawFlanges, drawBuchasAT, drawBuchasBT } from "./draw/terminais.mjs";
import { drawRadiadores, drawVentiladores } from "./draw/refrig.mjs";
import { drawConservador, drawSuportes, drawTubo, drawBuchholz, drawRespirador, drawTermometro, drawArmario, drawEletrodutos, drawEscada } from "./draw/protecao.mjs";
import { drawPernas, drawJugos, drawBobinasAT, drawBobinasBT, drawCilindros, drawCalcos, drawComutador, drawLigacoes } from "./draw/ativa.mjs";
import { PARTS, partById } from "./parts.mjs";

export const WIDTH = 1000;
export const HEIGHT = 700;

const BOXES = [
  { box: [-62, -158, -6, 155, 282, 262], move: [0, 0, 0] },
  { box: [-58, -154, 248, 158, 278, 345], move: [0, 0, 200] },
  { box: [-5, -100, 54, 97, 216, 236], move: [0, 0, 140] },
  { box: [70, -110, 330, 200, 210, 600], move: partById.buchaB.move },
  { box: [70, -110, 330, 200, 210, 600], move: partById.buchaA.move },
  { box: [70, -110, 330, 200, 210, 600], move: partById.buchaC.move },
  { box: [-42, -40, 286, 12, 170, 395], move: [0, 0, 235] },
  { box: [-45, -270, 262, 160, -140, 430], move: [0, -80, 70] },
  { box: [148, -120, 70, 240, 255, 255], move: [125, 0, 0] },
  { box: [-132, -120, 70, -62, 255, 255], move: [-125, 0, 0] },
  { box: [-45, 270, 0, 116, 300, 250], move: [0, 100, 0] },
];

export function buildScene() {
  const pts = BOXES.flatMap(({ box: [x0, y0, z0, x1, y1, z1], move }) =>
    [0, 1].flatMap((share) => k.boxCorners({ x: x0 + move[0] * share, y: y0 + move[1] * share, w: x1 - x0, d: y1 - y0, r: 0 }, z0 + move[2] * share, z1 + move[2] * share)));
  const P = k.fitProjection(pts, WIDTH, HEIGHT, { pad: 22, azimuth: 35, elevation: 30 });
  const c = makeContext(P);
  const { S, L, D, put, slab, k: kk } = c;

  const PAD = { x: -150, y: -180, w: 395, d: 500, r: 12 };
  const ground = [`<path class="iso-halo" d="${kk.haloOf(PAD, -6, 6, P)}"/>`, S(slab(PAD, -6, 6, 8, 1), { tone: "lo" })];
  ground.push(L(kk.planOutline(kk.insetPlan(PAD, 6), 0, P), { tone: "faint" }));
  const bolts = kk.corners(PAD, 12);
  ground.push(L(bolts.map(([x, y]) => kk.ring(x, y, 2.6, 0, P, 16)).join(""), { tone: "lo" }));
  ground.push(D(bolts.map(([x, y]) => c.at([x, y, 0])), { size: 0.55 }));
  put(0, null, [0, 0, 0], ground.join(""), 0, { cls: "ground" });

  drawBase(c);
  drawCuba(c);
  drawOil(c);
  drawDreno(c);
  drawRadiadores(c);
  drawVentiladores(c);
  drawPernas(c);
  drawJugos(c);
  drawBobinasAT(c);
  drawCilindros(c);
  drawBobinasBT(c);
  drawCalcos(c);
  drawComutador(c);
  drawLigacoes(c);
  drawTampa(c);
  drawTubosTampa(c);
  drawTampoes(c);
  drawOlhais(c);
  drawCorrimao(c);
  drawFlanges(c);
  drawBuchasAT(c);
  drawBuchasBT(c);
  drawConservador(c);
  drawSuportes(c);
  drawTubo(c);
  drawBuchholz(c);
  drawRespirador(c);
  drawTermometro(c);
  drawArmario(c);
  drawEletrodutos(c);
  drawEscada(c);
  return { P, c, items: c.items };
}

export function layerHtml(items, layer) {
  const list = items.filter((i) => i.layer === layer).sort((a, b) => a.key - b.key);
  const attr = (i) => (i.part ? ` data-p="${i.part}" data-i="${i.inst}" data-m="${i.move.map((v) => v.toFixed(2)).join(",")}"` : "");
  const cls = (i) => (i.cls ? ` ${i.cls}` : "");
  if (layer === 7) return `<g data-layer="7">${list.map((i) => `<g class="it${cls(i)}"${attr(i)} data-k="${i.key.toFixed(2)}">${i.svg}</g>`).join("")}</g>`;
  const groups = [];
  for (const it of list) {
    const last = groups[groups.length - 1];
    if (last && last.part === it.part && last.inst === it.inst && last.cls === it.cls) last.svg.push(it.svg);
    else groups.push({ part: it.part, inst: it.inst, cls: it.cls, move: it.move, svg: [it.svg] });
  }
  return `<g data-layer="${layer}">${groups.map((g) => `<g class="it${cls(g)}"${attr({ part: g.part, inst: g.inst, move: g.move })}>${g.svg.join("")}</g>`).join("")}</g>`;
}
