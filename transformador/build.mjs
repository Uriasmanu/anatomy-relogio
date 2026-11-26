import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";
import { kitScript } from "./scripts/inline-kit.mjs";
import { buildScene, layerHtml, WIDTH, HEIGHT } from "./scene.mjs";
import { instanceBounds, packSheet, boundsOf } from "./layout.mjs";
import { annotations } from "./sheet.mjs";
import { orthoHtml } from "./ortho.mjs";
import { liveScript } from "./live.mjs";
import { folhaSvg, FOLHA_SCALE } from "./folha.mjs";
import { PARTS, SYSTEMS, BOM_ORDER, STAMP } from "./parts.mjs";
import { FAN_POS } from "./draw/refrig.mjs";
import { TAP_STEP } from "./draw/ativa.mjs";
import { OTI } from "./draw/protecao.mjs";
import { LEVEL } from "./draw/fx.mjs";
import { PAGE_CSS } from "./page-css.mjs";
import { RATED } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const OUT = theme === "light" ? "transformador-light.html" : "transformador.html";

const { P, c, items } = buildScene();
const bounds = instanceBounds(items, P);
const sheet = packSheet(bounds, { width: 1900 });

let u = [Infinity, Infinity, -Infinity, -Infinity];
for (const it of items) {
  if (it.cls.includes("v-")) continue;
  const b = boundsOf(it.svg);
  if (!Number.isFinite(b[0])) continue;
  u = [Math.min(u[0], b[0]), Math.min(u[1], b[1]), Math.max(u[2], b[2]), Math.max(u[3], b[3])];
}
const fitBox = (box, pad, aspect) => {
  let [x0, y0, x1, y1] = [box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad];
  const w = x1 - x0;
  const h = y1 - y0;
  if (w / h < aspect) { const nw = h * aspect; x0 -= (nw - w) / 2; x1 += (nw - w) / 2; }
  else { const nh = w / aspect; y0 -= (nh - h) / 2; y1 += (nh - h) / 2; }
  return [x0, y0, x1 - x0, y1 - y0];
};
const VB0 = fitBox(u, 20, WIDTH / HEIGHT);
const VB1 = [0, 0, WIDTH, HEIGHT];
const VB2 = [0, 0, sheet.width, sheet.height];
const folha = folhaSvg(P, VB0);
const VB3 = folha.vb;

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "Transformador de potência a óleo em três estágios. Montado: cuba de aço sobre a base, tampa com buchas de alta e baixa tensão, conservador de óleo, radiadores com ventiladores e armário de comando. Desmontado: as peças saem sistema por sistema. Prancha: todas as peças numeradas e espalhadas, com vistas ortogonais.",
  body: [`<g class="scene" style="transform-origin:${folha.origin[0].toFixed(1)}px ${folha.origin[1].toFixed(1)}px;--folha-scale:${FOLHA_SCALE}">`, ...[0, 1, 2, 3, 4, 5, 6, 7].map((l) => layerHtml(items, l)), "</g>", annotations(P, sheet, bounds), folha.svg],
});

const data = {
  P,
  V: c.V,
  parts: PARTS.map(({ id, sys, n, name, does, nominal, qty, rank, move }) => ({ id, sys, n, name, does, nominal, qty, rank, move })),
  systems: SYSTEMS.map(({ id, n, name }) => ({ id, n, name })),
  offsets: sheet.offsets,
  vbs: [VB0, VB1, VB2, VB3],
  fans: FAN_POS,
  oti: OTI,
  tap: { step: TAP_STEP },
  level: LEVEL,
};

const cells = [
  ["vp", "Tensão AT"], ["vs", "Tensão BT"], ["tap", "Tap (AT)"], ["np", "Espiras AT / BT"],
  ["ip", "Corrente AT"], ["is", "Corrente BT"], ["load", "Carga"], ["flux", "Indução no núcleo"],
  ["loss", "Perdas"], ["eff", "Rendimento"], ["oil", "Topo do óleo"], ["fans", "Ventiladores"],
  ["hot", "Ponto quente"], ["level", "Nível do conservador"], ["breath", "Respiração"], ["buch", "Buchholz"],
];

const toolbar = `<div class="tf-bar">
  <button type="button" class="tf-btn" data-toggle>Desmontar</button>
  <button type="button" class="tf-btn" data-cut-btn aria-pressed="false">Corte da cuba</button>
  <span class="tf-sys" role="group" aria-label="Sistemas visíveis">${BOM_ORDER.map((s) => `<button type="button" class="tf-chip" data-sys-toggle="${s.id}" aria-pressed="true"><i></i>${s.short}</button>`).join("")}</span>
</div>
<p class="tf-info" data-info></p>`;

const panel = `<div class="tf-panel">${cells.map(([id, label]) => `<div class="tf-cell"><b data-cell="${id}">–</b><span>${label}</span></div>`).join("")}</div>
<div class="tf-controls">
  <label>Carga <input id="tf-load" type="range" min="5" max="150" step="1" value="60" aria-label="Carga do transformador em porcentagem da potência nominal"><span class="tf-over" data-over>sobrecarga</span></label>
  <span class="tf-tap">Tap <button class="tf-btn" type="button" data-tap-down aria-label="Diminuir tap">−</button><output data-tapval>0,00 %</output><button class="tf-btn" type="button" data-tap-up aria-label="Aumentar tap">+</button></span>
  <button class="tf-btn" type="button" data-rearm disabled>Rearmar</button>
  <span class="tf-clock" data-clock>tempo acelerado</span>
</div>`;

const stamp = `<div class="tf-stamp"><div class="st-title">${STAMP.title}</div>${STAMP.rows.map(([a, b]) => `<div class="st-row"><span>${a}</span><b>${b}</b></div>`).join("")}<div class="st-foot"><span>${STAMP.rev}</span><span>${STAMP.scale}</span><span>${STAMP.project}</span></div></div>`;

const fig = k.plateHtml({
  fig: "Fig 1",
  title: "Transformador de potência",
  hint: "Espaço: estágio · ←→ sistema · ↑↓ carga",
  readout: "Vs 13,80 kV · óleo 62 °C",
  keys: [
    { mark: "lit", label: "Peça ou sistema selecionado" },
    { mark: "raised", label: "As outras peças" },
  ],
  caption:
    `Transformador trifásico de 25 MVA, 69 kV Δ → 13,8 kV Y, ONAN/ONAF. Montado, ele mostra a tensão de saída e a temperatura do óleo reagindo à carga e ao tap. Desmontado, cada sistema sai na sua ordem. Na prancha, as ${PARTS.length} peças aparecem numeradas, com as vistas ortogonais e o carimbo.`,
  body: `<div class="iso-stage" tabindex="0" role="application" aria-label="Transformador de potência: Espaço avança o estágio, setas esquerda e direita escolhem um sistema, setas para cima e para baixo mudam a carga, Escape limpa a seleção" aria-valuetext="nenhuma peça selecionada">${svg}</div>`,
});

const body = `<style>${PAGE_CSS}</style><div class="tf-root" data-root data-stage="0">${fig}${toolbar}${panel}<div class="tf-board"><div class="tf-side">${orthoHtml()}${stamp}</div></div></div>`;
writeFileSync(join(HERE, OUT), k.pageHtml({ title: "Transformador de potência", theme, body, script: kitScript() + liveScript(data), width: 1100 }));
console.log("wrote", OUT, "items:", items.length, "sheet", Math.round(sheet.width), "x", Math.round(sheet.height), "parts", PARTS.length, "rated", RATED.S);
