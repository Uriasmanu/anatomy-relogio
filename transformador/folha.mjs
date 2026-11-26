import * as k from "./kit/iso-kit.mjs";
import { RATED, currentLV, currentHV } from "./model.mjs";
import { STAMP } from "./parts.mjs";

const FS = 15;
const LH = 21;
const CW = FS * 0.6;
const COL = 46 * CW;
const GAP = 26;
const M = 34;
const PAD = 12;

const f = (v, d = 1) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const kv = (v) => f(v / 1000, v % 1000 ? 2 : 0);
const IP = currentHV(1);
const IS = currentLV((RATED.taps - 1) / 2, 1);
const ALPHA = RATED.Np / RATED.Ns;

const QUADROS = [
  { n: 1, title: "REDE DE ALTA TENSÃO", side: "L", parts: ["buchaA", "buchaB", "buchaC"], to: [101, 43, 380], lines: [
    ["b", "3 fases (H1, H2, H3) entram pelas buchas AT"],
    ["b", `Tensão de linha: ${f(RATED.Vp / 1000, 0)} kV, ${RATED.Hz} Hz`],
    ["b", "Ligação em triângulo (Δ), sem neutro"],
    ["b", `Corrente nominal: Ip = ${f(IP, 0)} A`],
  ] },
  { n: 3, title: "DADOS NOMINAIS", side: "L", lines: [
    ["t", [["Potência", `${f(RATED.S / 1e6, 0)} MVA`], ["Tensões", `${f(RATED.Vp / 1000, 0)} / ${f(RATED.Vs / 1000, 1)} kV`], ["Frequência", `${RATED.Hz} Hz`], ["Ligação", "Dyn"], ["Refrigeração", "ONAN / ONAF"], ["Taps", `${RATED.taps} posições, ±${f(((RATED.taps - 1) / 2) * RATED.tapStep * 100, 0)} %`]]],
  ] },
  { n: 5, title: "SISTEMA TRIFÁSICO", side: "L", lines: [
    ["b", "Tensões de fase defasadas de 120°:"],
    ["f", ["v₁(t) = Vm · sen(ωt)", "v₂(t) = Vm · sen(ωt − 120°)", "v₃(t) = Vm · sen(ωt − 240°)"]],
    ["b", `ω = 2πf = ${f(2 * Math.PI * RATED.Hz, 0)} rad/s (f = ${RATED.Hz} Hz)`],
    ["b", "Em estrela: V linha = √3 · V fase"],
  ] },
  { n: 10, title: "EXEMPLO NUMÉRICO (AO VIVO)", side: "L", lines: [
    ["b", "Carga: {load} % = {mva} MVA"],
    ["b", "Tap: {tap} → Np = {np} espiras"],
    ["b", "Tensão de saída: Vs = {vs} kV"],
    ["b", "Correntes: Ip = {ip} A · Is = {is} A"],
    ["b", "Perdas = {loss} kW"],
    ["f", ["η = {eff} %"]],
  ] },
  { n: 2, title: "PARA QUE SERVE?", side: "R", lines: [
    ["b", `Abaixa a tensão da transmissão (${f(RATED.Vp / 1000, 0)} kV)`],
    ["c", `para a distribuição (${f(RATED.Vs / 1000, 1)} kV)`],
    ["b", "Mantém a potência: o que entra em"],
    ["c", "tensão alta sai em corrente alta"],
    ["b", "Isola eletricamente os dois lados"],
  ] },
  { n: 4, title: "SAÍDA DE BAIXA TENSÃO", side: "R", parts: ["buchaBT"], to: [-17, -21, 345], lines: [
    ["b", "3 fases + neutro (X0 a X3)"],
    ["b", "Ligação em estrela (Y) com neutro"],
    ["b", `V linha = ${f(RATED.Vs / 1000, 1)} kV · V fase = ${f(RATED.Vs / 1000 / Math.sqrt(3), 2)} kV`],
    ["b", `Corrente nominal: Is = ${f(IS, 0)} A`],
  ] },
  { n: 7, title: "CORRENTES", side: "R", parts: ["ligacoes"], to: [95, 60, 236], lines: [
    ["f", ["I = S / (√3 · V)"]],
    ["b", `AT: ${f(RATED.S / 1e6, 0)} MVA / (√3 · ${f(RATED.Vp / 1000, 0)} kV) = ${f(IP, 0)} A`],
    ["b", `BT: ${f(RATED.S / 1e6, 0)} MVA / (√3 · ${f(RATED.Vs / 1000, 1)} kV) = ${f(IS, 0)} A`],
    ["b", "A corrente sobe na mesma proporção"],
    ["c", "em que a tensão cai"],
  ] },
  { n: 8, title: "REFRIGERAÇÃO", side: "R", parts: ["radA", "radB", "ventiladores"], to: [192, 60, 200], lines: [
    ["b", "O óleo quente sobe pelas bobinas e"],
    ["c", "desce esfriando pelos radiadores"],
    ["b", "ONAN: óleo e ar circulam sozinhos"],
    ["b", `ONAF: ventiladores ligam a ${RATED.onAt} °C`],
    ["c", `e desligam a ${RATED.offAt} °C`],
    ["f", ["θ ponto quente = θ topo + 26 K · K^1,6"]],
    ["b", `Ambiente ${RATED.ambient} °C · elevação ${RATED.rise} K`],
  ] },
  { n: 9, title: "PROTEÇÕES", side: "R", parts: ["conservador", "buchholz", "respirador"], to: [43, -138, 362], lines: [
    ["b", "Relé Buchholz: gás no óleo → alarme"],
    ["b", "Ponto quente > 150 °C → desliga"],
    ["b", "Conservador: recebe o óleo que dilata"],
    ["b", "Respirador: a sílica-gel seca o ar"],
  ] },
  { n: 6, title: "TEORIA DO TRANSFORMADOR", side: "B", parts: ["at", "bt", "pernas"], to: [84, 60, 150], lines: [
    ["f", [`α = Np / Ns = ${RATED.Np} / ${RATED.Ns} = ${f(ALPHA, 2)}`]],
    ["b", "Δ–Y: Vp / (Vs / √3) = α"],
    ["b", "Potência aparente: S = √3 · V · I"],
    ["f", ["Perdas = P₀ + Pk · K²"]],
    ["b", `P₀ = ${f(RATED.P0 / 1000, 0)} kW (núcleo) · Pk = ${f(RATED.Pk / 1000, 0)} kW (cobre)`],
    ["f", ["η = P saída / P entrada × 100 %"]],
  ] },
  { n: 11, title: "RESUMO DAS TENSÕES", side: "B", lines: [
    ["t", [["Lado", "Linha · Fase · Ligação"], ["AT", `${f(RATED.Vp / 1000, 0)} kV · ${f(RATED.Vp / 1000, 0)} kV · Δ`], ["BT", `${f(RATED.Vs / 1000, 1)} kV · ${f(RATED.Vs / 1000 / Math.sqrt(3), 2)} kV · Y+N`], ["Frequência", `${RATED.Hz} Hz`], ["Relação", `${f(RATED.Vp / RATED.Vs, 1)} : 1`]]],
  ] },
  { n: 12, title: "NORMAS APLICÁVEIS", side: "B", lines: [
    ["b", "ABNT NBR 5356: transformador de potência"],
    ["b", "IEC 60076: power transformers"],
    ["b", "IEC 60076-7: carregamento e temperatura"],
    ["b", "IEC 60296: óleo mineral isolante"],
  ] },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const live = (s) => esc(s).replace(/\{(\w+)\}/g, (_, key) => `<tspan data-q10="${key}">–</tspan>`);

function heightOf(q) {
  let h = PAD + LH + 6;
  for (const [kind, v] of q.lines) {
    if (kind === "f") h += v.length * LH + 12;
    else if (kind === "t") h += v.length * LH + 6;
    else h += LH;
  }
  return h + PAD - 6;
}

function quadroSvg(q, x, y, w) {
  const out = [];
  const h = heightOf(q);
  out.push(`<rect class="qd-box" x="${x}" y="${y}" width="${w}" height="${h}"/>`);
  const head = `${q.n}) ${q.title}`;
  out.push(`<text class="qd-h" x="${x + PAD}" y="${y + PAD + 15}">${esc(head)}</text>`);
  out.push(`<path class="qd-rule" d="M${x + PAD} ${y + PAD + 21}H${x + PAD + head.length * 17 * 0.6}"/>`);
  let cy = y + PAD + LH + 6;
  for (const [kind, v] of q.lines) {
    if (kind === "f") {
      const fw = Math.max(...v.map((s) => s.length)) * CW + 20;
      out.push(`<rect class="qd-f" x="${x + PAD + 10}" y="${cy + 4}" width="${fw}" height="${v.length * LH + 6}"/>`);
      v.forEach((s, i) => out.push(`<text class="qd-t" x="${x + PAD + 20}" y="${cy + 4 + (i + 1) * LH - 2}">${live(s)}</text>`));
      cy += v.length * LH + 12;
    } else if (kind === "t") {
      const c1 = Math.max(...v.map(([a]) => a.length)) * CW + 18;
      v.forEach(([a, b], i) => {
        const ry = cy + i * LH;
        out.push(`<path class="qd-grid" d="M${x + PAD} ${ry + 4}H${x + w - PAD}"/>`);
        out.push(`<text class="qd-t${i === 0 && q.n === 11 ? " qd-th" : ""}" x="${x + PAD + 6}" y="${ry + LH}">${esc(a)}</text><text class="qd-t" x="${x + PAD + c1}" y="${ry + LH}">${esc(b)}</text>`);
      });
      const ty = cy + v.length * LH + 4;
      out.push(`<path class="qd-grid" d="M${x + PAD} ${ty}H${x + w - PAD}M${x + PAD + c1 - 8} ${cy + 4}V${ty}"/>`);
      cy += v.length * LH + 6;
    } else {
      const mark = kind === "b" ? "• " : "  ";
      out.push(`<text class="qd-t" x="${x + PAD}" y="${cy + LH - 4}">${live(mark + v)}</text>`);
      cy += LH;
    }
  }
  return { svg: out.join(""), h };
}

export const FOLHA_SCALE = 1.32;

export function folhaSvg(P, vb0) {
  const S = FOLHA_SCALE;
  const mx = vb0[0] + vb0[2] / 2;
  const my = vb0[1] + vb0[3] / 2;
  const cw = vb0[2] * S;
  const ch = vb0[3] * S;
  const cx = mx - cw / 2;
  const cy = my - ch / 2;
  const scaled = ([x, y]) => [mx + (x - mx) * S, my + (y - my) * S];
  const left = QUADROS.filter((q) => q.side === "L");
  const right = QUADROS.filter((q) => q.side === "R");
  const bottom = QUADROS.filter((q) => q.side === "B");
  const colH = (list) => list.reduce((s, q) => s + heightOf(q), 0) + GAP * (list.length - 1);
  const titleH = 56;
  const top = cy - titleH;
  const midH = Math.max(ch, colH(left), colH(right));
  const x0 = cx - COL - GAP - M;
  const width = cw + 2 * (COL + GAP + M);
  const bw = (width - 2 * M - 2 * GAP) / 3;
  const bh = Math.max(...bottom.map(heightOf));
  const height = titleH + midH + GAP + bh + 2 * M + 20;
  const y0 = top - M;
  const out = [];
  out.push(`<rect class="sh-frame" x="${x0 + 10}" y="${y0 + 10}" width="${width - 20}" height="${height - 20}"/><rect class="sh-frame" data-in x="${x0 + 18}" y="${y0 + 18}" width="${width - 36}" height="${height - 36}"/>`);
  const title = `${STAMP.title.toUpperCase()} · COMO FUNCIONA`;
  out.push(`<text class="qd-title" x="${x0 + width / 2}" y="${top + 24}">${esc(title)}</text><path class="qd-rule" d="M${x0 + width / 2 - title.length * 10.5 * 0.6} ${top + 32}H${x0 + width / 2 + title.length * 10.5 * 0.6}"/>`);
  const place = (list, x) => {
    let y = top + titleH;
    for (const q of list) {
      const r = quadroSvg(q, x, y, COL);
      q.box = [x, y, COL, r.h];
      q.svg = r.svg;
      y += r.h + GAP;
    }
  };
  place(left, x0 + M);
  place(right, cx + cw + GAP);
  bottom.forEach((q, i) => {
    const x = x0 + M + i * (bw + GAP);
    const y = top + titleH + midH + GAP;
    const r = quadroSvg(q, x, y, bw);
    q.box = [x, y, bw, r.h];
    q.svg = r.svg;
  });
  for (const q of QUADROS) {
    let lead = "";
    if (q.to) {
      const [tx, ty] = scaled(k.iso(q.to, P));
      const [bx, by, bw2, bh2] = q.box;
      const sx = q.side === "L" ? bx + bw2 : q.side === "R" ? bx : Math.min(Math.max(tx, bx + 20), bx + bw2 - 20);
      const sy = q.side === "B" ? by : by + PAD + 10;
      const ex = q.side === "B" ? sx : (sx + tx) / 2;
      lead = `<path class="qd-lead" d="M${sx.toFixed(1)} ${sy.toFixed(1)}L${ex.toFixed(1)} ${sy.toFixed(1)}L${tx.toFixed(1)} ${ty.toFixed(1)}"/><circle class="qd-dot" cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="3"/>`;
    }
    out.push(`<g class="qd" data-q="${q.n}" data-title="${esc(q.title)}" data-parts="${(q.parts || []).join(" ")}">${lead}${q.svg}</g>`);
  }
  out.push(`<text class="qd-foot" x="${x0 + width - M}" y="${y0 + height - M + 6}">${esc(`${STAMP.rev} · ${STAMP.project} · ${STAMP.scale}`)}</text>`);
  return { svg: `<g class="folha-ann">${out.join("")}</g>`, vb: [x0, y0, width, height], origin: [mx, my] };
}

export const Q10_KEYS = ["load", "mva", "tap", "np", "vs", "ip", "is", "loss", "eff"];
