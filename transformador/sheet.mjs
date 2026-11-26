import * as k from "./kit/iso-kit.mjs";
import { PARTS, partById, D, BOM_ORDER } from "./parts.mjs";

const ANCHOR = {
  "calcos|r": [80, -35, 201],
  "calcos|0": [46, -35, 52],
  "ligacoes|0": [79, -35, 208],
  "flanges|0": [111, -67, 263],
  "tampoes|0": [0, -90, 268],
  "olhais|0": [-48, -144, 270],
  "ventiladores|0": [192, -67.5, 62],
  "cilindros|0": [46, -35, 190],
  "eletrodutos|0": [34, 281, 40],
  "suportes|0": [-35, -150, 268],
  "buchholz|0": null,
};

const fmtM = (units) => `≈ ${((units * D.MM) / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m`;

export function annotations(P, sheet, bounds, anchorOf) {
  const out = [];
  const w = sheet.width;
  const h = sheet.height;
  out.push(`<rect class="sh-frame" x="12" y="12" width="${w - 24}" height="${h - 24}"/><rect class="sh-frame" data-in x="20" y="20" width="${w - 40}" height="${h - 40}"/>`);
  for (const t of sheet.titles) {
    out.push(`<g class="sh-title" data-sys="${t.sys}"><text x="${t.x}" y="${t.y - 4}" class="sh-t">${t.n} · ${t.name.toUpperCase()}</text><path class="sh-rule" d="M${t.x} ${t.y + 2}H${t.x + 150}"/></g>`);
  }
  for (const r of sheet.placed) {
    const part = partById[r.part];
    const off = sheet.offsets[r.key];
    const shift = k.axisVector(P, part.move);
    const to = (pt) => {
      const [x, y] = k.iso(pt, P);
      return [x + shift[0] + off[0], y + shift[1] + off[1]];
    };
    const manual = ANCHOR[r.key];
    const anchorW = manual === undefined ? (r.inst === "0" ? part.anchor : null) : manual;
    const [bx0, by0, bx1, by1] = [r.x, r.y, r.x + r.w, r.y + r.h];
    const anchor = anchorW ? to(anchorW) : [(bx0 + bx1) / 2, (by0 + by1) / 2];
    const bal = [bx0 - 4, by0 - 4];
    out.push(
      `<g class="sh-bal" data-p="${r.part}" data-i="${r.inst}"><path class="sh-lead" d="M${bal[0].toFixed(1)} ${bal[1].toFixed(1)}L${anchor[0].toFixed(1)} ${anchor[1].toFixed(1)}"/>` +
        `<circle class="sh-dot" cx="${anchor[0].toFixed(1)}" cy="${anchor[1].toFixed(1)}"/>` +
        `<circle class="sh-ball" cx="${bal[0].toFixed(1)}" cy="${bal[1].toFixed(1)}"/>` +
        `<text class="sh-n" x="${bal[0].toFixed(1)}" y="${bal[1].toFixed(1)}">${part.n}</text></g>`,
    );
    if (part.cota && r.inst === "0") {
      const [axis, a, b, fx, fy] = part.cota;
      const p0 = axis === "z" ? [fx, fy, a] : axis === "x" ? [a, fx, fy] : [fx, a, fy];
      const p1 = axis === "z" ? [fx, fy, b] : axis === "x" ? [b, fx, fy] : [fx, b, fy];
      const s0 = to(p0);
      const s1 = to(p1);
      const shiftPx = axis === "z" ? [-16, 0] : [0, 16];
      const o0 = [s0[0] + shiftPx[0], s0[1] + shiftPx[1]];
      const o1 = [s1[0] + shiftPx[0], s1[1] + shiftPx[1]];
      const tick = (p) => `M${(p[0] - 3).toFixed(1)} ${(p[1] + 3).toFixed(1)}L${(p[0] + 3).toFixed(1)} ${(p[1] - 3).toFixed(1)}`;
      const mid = [(o0[0] + o1[0]) / 2, (o0[1] + o1[1]) / 2];
      const tx = axis === "z" ? mid[0] - 5 : mid[0];
      const ty = axis === "z" ? mid[1] : mid[1] + 13;
      out.push(
        `<g class="sh-cota" data-p="${r.part}"><path class="sh-dim" d="M${s0[0].toFixed(1)} ${s0[1].toFixed(1)}L${o0[0].toFixed(1)} ${o0[1].toFixed(1)}M${s1[0].toFixed(1)} ${s1[1].toFixed(1)}L${o1[0].toFixed(1)} ${o1[1].toFixed(1)}M${o0[0].toFixed(1)} ${o0[1].toFixed(1)}L${o1[0].toFixed(1)} ${o1[1].toFixed(1)}${tick(o0)}${tick(o1)}"/>` +
          `<text class="sh-v ${axis === "z" ? "end" : ""}" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}">${fmtM(Math.abs(b - a))}</text></g>`,
      );
    }
  }
  return `<g class="sheet-ann">${out.join("")}</g>`;
}

export function bomHtml() {
  const rows = BOM_ORDER.map(
    (s) =>
      `<tbody data-sys="${s.id}"><tr class="bom-sys"><th colspan="4"><button type="button" class="bom-toggle" data-sys-toggle="${s.id}" aria-pressed="true"><i></i>${s.n} · ${s.name}</button></th></tr>` +
      s.parts
        .map(
          (p) =>
            `<tr class="bom-row" tabindex="0" data-pick="${p.id}"><td class="n">${p.n}</td><td class="nm">${p.name}</td><td class="q">${p.qty}</td><td class="nom">${p.nominal}</td></tr>`,
        )
        .join("") +
      `</tbody>`,
  ).join("");
  return `<table class="bom"><caption>Lista de materiais</caption><thead><tr><th>Nº</th><th>Peça</th><th>Qtd</th><th>Dado nominal</th></tr></thead>${rows}</table>`;
}

void PARTS;
