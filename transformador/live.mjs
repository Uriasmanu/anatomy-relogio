import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const modelSource = () => readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");

export const FAN_SRC = `function bladePath(cx, cy, cz, angle) {
  const out = [];
  for (let i = 0; i < 5; i++) {
    const a = angle + (i / 5) * Math.PI * 2;
    const pt = (r, da) => iso([cx + r * Math.cos(a + da), cy + r * Math.sin(a + da), cz], P);
    out.push(pathOf([pt(6, -0.16), pt(21, 0.12), pt(21, 0.58), pt(6, 0.42)], true));
  }
  return out.join("");
}`;

export function makeBlade(k, P) {
  return new Function("iso", "pathOf", "P", `${FAN_SRC}\nreturn bladePath;`)(k.iso, k.pathOf, P);
}

export function liveScript(data) {
  return `
${modelSource()}
const P = ${JSON.stringify(data.P)};
const V = ${JSON.stringify(data.V)};
const PARTS = ${JSON.stringify(data.parts)};
const SYSTEMS = ${JSON.stringify(data.systems)};
const OFFS = ${JSON.stringify(data.offsets)};
const VBS = ${JSON.stringify(data.vbs)};
const FANS = ${JSON.stringify(data.fans)};
const OTI = ${JSON.stringify(data.oti)};
const TAP = ${JSON.stringify(data.tap)};
${FAN_SRC}
const byId = Object.fromEntries(PARTS.map((p) => [p.id, p]));
const root = document.querySelector("[data-root]");
const stage = document.querySelector(".iso-stage");
const svgRoot = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const toggle = document.querySelector("[data-toggle]");
const cutBtn = document.querySelector("[data-cut-btn]");
const info = document.querySelector("[data-info]");
const live7 = svgRoot.querySelector('[data-layer="7"]');
const loadInput = document.querySelector("#tf-load");
const cell = (name) => document.querySelector('[data-cell="' + name + '"]');
const still = matchMedia("(prefers-reduced-motion: reduce)");
const qa = (sel) => [...svgRoot.querySelectorAll(sel)];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const num = (v, d = 1) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const unitOf = (m) => axisVector(P, m);
const nodes = qa(".it[data-p]").map((el) => {
  const p = byId[el.dataset.p];
  const m = el.dataset.m.split(",").map(Number);
  return { el, p, id: p.id, inst: el.dataset.i, hidden: el.dataset.i.startsWith("x"), key: Number(el.dataset.k || 0), m, u: unitOf(m), off: OFFS[p.id + "|" + el.dataset.i] || [0, 0], sheetOnly: el.classList.contains("v-sheet"), sort: el.parentNode === live7 };
});
const sorted = nodes.filter((n) => n.sort);
const balloons = qa(".sh-bal, .sh-cota");
const groundEls = qa(".it.ground");
const titles = qa(".sh-title");
const annot = svgRoot.querySelector(".sheet-ann");
const rows = [...document.querySelectorAll("[data-pick]")];
const ovs = [...document.querySelectorAll(".ov[data-p]")];
const sysBtns = [...document.querySelectorAll("[data-sys-toggle]")];
const fanEls = qa("[data-fan]");
const needleEl = svgRoot.querySelector("[data-oti-needle]");
const tapArm = svgRoot.querySelector("[data-tap-arm]");
const tapDots = qa("[data-tap-dot]");
const spring = Object.fromEntries(PARTS.map((p) => [p.id, { x: 0, v: 0, target: 0, at: 0, armed: false }]));
const spread = Object.fromEntries(PARTS.map((p) => [p.id, 0]));
const state = {
  stage: 0, sel: null, hov: null, sysFocus: null, off: new Set(), cut: false, clock: 0, spT0: -1, spDir: 0,
  vb: VBS[0].slice(), tap: 4, tapShown: 4, load: 0.6, oil: steadyOil(0.6, false), fans: false, fanRate: 0, fanAngle: 0,
  touring: !still.matches, idle: 0, say: "", tourT: 0,
};
let frame = 0, last = 0, visible = false;
const STAGGER = 0.3, STIFF = 64, DRAG = 14.2;
const FLY = PARTS.reduce((m, p) => Math.max(m, p.rank), 0);

function setStage(n) {
  if (state.stage === n) return;
  const opening = n > state.stage;
  state.stage = n;
  const wantApart = n >= 1;
  const list = [...PARTS].sort((a, b) => (wantApart ? a.rank - b.rank : b.rank - a.rank));
  list.forEach((p, i) => {
    const s = spring[p.id];
    const m = byId[p.id].move;
    if (!(m[0] || m[1] || m[2])) return;
    if (s.target === (wantApart ? 1 : 0)) return;
    s.target = wantApart ? 1 : 0;
    const rank = wantApart ? p.rank : FLY - p.rank;
    s.at = state.clock + rank * STAGGER + (i % 7) * 0.02;
    s.armed = true;
  });
  state.spDir = n === 2 ? 1 : -1;
  state.spT0 = state.clock + (n === 2 ? (wantApart && opening && !PARTS.every((p) => spring[p.id].x === 1) ? (FLY + 1) * STAGGER + 0.6 : 0.05) : 0);
  if (n === 2 && state.cut) setCut(false);
  run();
}
function setCut(on) {
  if (on && state.stage === 2) return;
  state.cut = on;
  svgRoot.toggleAttribute("data-cut", on);
  cutBtn.setAttribute("aria-pressed", on ? "true" : "false");
  run();
}
const effective = () => state.hov || state.sel;
function paintSelection() {
  const id = effective();
  const sys = !id && state.sysFocus ? state.sysFocus : null;
  const on = (pid) => (id ? pid === id : sys ? byId[pid].sys === sys : false);
  svgRoot.toggleAttribute("data-focus", Boolean(id || sys));
  nodes.forEach((n) => n.el.toggleAttribute("data-on", on(n.id)));
  balloons.forEach((b) => b.toggleAttribute("data-on", on(b.dataset.p)));
  ovs.forEach((o) => o.toggleAttribute("data-on", on(o.dataset.p)));
  rows.forEach((r) => r.toggleAttribute("data-on", on(r.dataset.pick)));
  document.querySelector(".tf-board").toggleAttribute("data-focus", Boolean(id || sys));
  const p = id ? byId[id] : null;
  const s = sys ? SYSTEMS.find((x) => x.id === sys) : null;
  info.textContent = p ? p.n + " · " + p.name + " — " + p.does + " " + p.nominal + (p.qty > 1 ? " (" + p.qty + " no total)." : ".")
    : s ? s.n + " · " + s.name + ": " + PARTS.filter((x) => x.sys === s.id).map((x) => x.name).join(", ") + "."
    : "Passe o mouse sobre uma peça ou escolha uma linha da lista. O botão avança: montado, desmontado, prancha.";
  stage.setAttribute("aria-valuetext", p ? p.name : s ? s.name : "nenhuma peça selecionada");
  if (id === "oleo" && state.stage < 2 && !state.cut) setCut(true);
  run();
}
function select(id) { state.sel = state.sel === id ? null : id; if (id) state.sysFocus = null; paintSelection(); }
function hover(id) { if (state.hov === id) return; state.hov = id; paintSelection(); }
function focusSystem(id) { state.sysFocus = id; state.sel = null; paintSelection(); }
function toggleSystem(id) {
  state.off.has(id) ? state.off.delete(id) : state.off.add(id);
  sysBtns.forEach((b) => b.setAttribute("aria-pressed", state.off.has(b.dataset.sysToggle) ? "false" : "true"));
  document.querySelectorAll("tbody[data-sys]").forEach((t) => t.toggleAttribute("data-off", state.off.has(t.dataset.sys)));
  run();
}
function step(dt) {
  state.clock += dt;
  const calm = still.matches;
  let moving = false;
  for (const p of PARTS) {
    const s = spring[p.id];
    if (s.armed && state.clock < s.at) { moving = true; continue; }
    s.armed = false;
    if (calm) { s.x = s.target; s.v = 0; continue; }
    for (let i = 0; i < 4; i++) { s.v += ((s.target - s.x) * STIFF - s.v * DRAG) * dt / 4; s.x += s.v * dt / 4; }
    if (Math.abs(s.target - s.x) < 5e-4 && Math.abs(s.v) < 5e-4) { s.x = s.target; s.v = 0; } else moving = true;
  }
  const t = state.clock - state.spT0;
  for (const p of PARTS) {
    const goal = state.spDir > 0 ? smooth(calm ? 1 : (t - p.n * 0.03) / 1.1) : 0;
    const cur = spread[p.id];
    const next = state.spDir > 0 ? Math.max(cur, goal) : Math.max(0, cur - (calm ? 1 : dt / 0.8));
    if (next !== cur) { spread[p.id] = next; moving = true; }
  }
  const goalVb = VBS[state.stage];
  const k = calm ? 1 : 1 - Math.exp(-dt / 0.28);
  let vbMoving = false;
  for (let i = 0; i < 4; i++) {
    const d = goalVb[i] - state.vb[i];
    if (Math.abs(d) > 0.05) { state.vb[i] += d * k; vbMoving = true; } else state.vb[i] = goalVb[i];
  }
  if (state.touring) {
    state.tourT += dt;
    const target = clamp(0.62 + 0.4 * Math.sin((state.tourT / 38) * Math.PI * 2 - 1.2), 0.15, 1.05);
    state.load += (target - state.load) * (1 - Math.exp(-dt / 0.8));
    state.tap = Math.round(4 + 4 * Math.sin((state.tourT / 26) * Math.PI * 2));
    loadInput.value = Math.round(state.load * 100);
  } else { state.idle += dt; if (state.idle > 12 && !calm) { state.touring = true; state.tourT = 0; } }
  state.tapShown = calm ? state.tap : state.tapShown + (state.tap - state.tapShown) * (1 - Math.exp(-dt / 0.22));
  if (Math.abs(state.tap - state.tapShown) < 0.004) state.tapShown = state.tap;
  const goalOil = steadyOil(state.load, state.fans);
  state.oil = calm ? goalOil : state.oil + (goalOil - state.oil) * (1 - Math.exp(-dt / OIL_TAU));
  state.fans = fansWanted(state.oil, state.fans);
  const want = state.fans ? 16 : 0;
  state.fanRate = calm ? want : state.fanRate + (want - state.fanRate) * (1 - Math.exp(-dt / 0.9));
  state.fanAngle += state.fanRate * dt;
  return moving || vbMoving;
}
let order = [];
const fmt = (n) => n.toFixed(2);
function draw() {
  const sp = Math.max(...PARTS.map((p) => spread[p.id]));
  const sheet = sp > 0.01;
  for (const n of nodes) {
    const x = spring[n.id].x;
    const s = spread[n.id];
    const tx = n.u[0] * x + n.off[0] * s;
    const ty = n.u[1] * x + n.off[1] * s;
    n.el.setAttribute("transform", tx || ty ? "translate(" + fmt(tx) + " " + fmt(ty) + ")" : "");
    if (!tx && !ty) n.el.removeAttribute("transform");
    const off = state.off.has(n.p.sys);
    const op = off ? 0 : n.hidden ? 1 - smooth(s * 1.6) : n.sheetOnly ? smooth(s * 1.4) : 1;
    n.el.style.opacity = op >= 0.999 ? "" : String(op);
    n.el.style.pointerEvents = off || (n.hidden && s > 0.4) ? "none" : "";
  }
  const keyed = sorted.map((n) => ({ n, key: n.key + (n.m[0] * V[0] + n.m[1] * V[1] + n.m[2] * V[2]) * spring[n.id].x })).sort((a, b) => a.key - b.key);
  const ids = keyed.map((e) => e.n);
  if (ids.some((n, i) => n !== order[i])) { order = ids; const frag = document.createDocumentFragment(); ids.forEach((n) => frag.appendChild(n.el)); live7.appendChild(frag); }
  const settled = state.stage === 2 ? PARTS.every((p) => spread[p.id] >= 0.999) : false;
  const annotOn = state.stage === 2 ? smooth((Math.min(...PARTS.map((p) => spread[p.id])) - 0.6) / 0.4) : 0;
  annot.style.opacity = String(annotOn);
  annot.style.pointerEvents = annotOn > 0.9 ? "" : "none";
  balloons.forEach((b) => (b.style.display = state.off.has(byId[b.dataset.p].sys) ? "none" : ""));
  titles.forEach((t) => (t.style.display = state.off.has(t.dataset.sys) ? "none" : ""));
  root.toggleAttribute("data-sheet", sp > 0.5);
  svgRoot.toggleAttribute("data-spread", sp > 0.01);
  groundEls.forEach((g) => (g.style.opacity = String(1 - smooth(sp * 1.6))));
  root.dataset.stage = String(state.stage);
  if (state.stage === 2 && state.cut) setCut(false);
  const vb = state.vb;
  svgRoot.setAttribute("viewBox", vb.map((v) => v.toFixed(2)).join(" "));
  const w = svgRoot.getBoundingClientRect().width || 1000;
  svgRoot.style.setProperty("--tk", (vb[2] / w).toFixed(3));
  const tap = state.tapShown;
  if (tapArm) tapArm.setAttribute("transform", translateAlong(P, [0, 0, TAP.step * tap]));
  tapDots.forEach((d) => d.toggleAttribute("data-lit", Number(d.dataset.tapDot) === state.tap));
  if (needleEl) {
    const a = ((-135 + (270 * clamp(state.oil, 0, 150)) / 150) * Math.PI) / 180;
    needleEl.setAttribute("d", segment([OTI.x, OTI.y, OTI.z], [OTI.x + OTI.r * Math.sin(a), OTI.y, OTI.z + OTI.r * Math.cos(a)], P));
  }
  fanEls.forEach((el) => { const i = Number(el.dataset.fan); const f = FANS[i]; const d = bladePath(f[0], f[1], f[2], state.fanAngle + i * 0.7); el.querySelectorAll("path").forEach((p) => p.setAttribute("d", d)); });
  const vs = lineVoltageLV(state.tap), is = currentLV(state.tap, state.load), ip = currentHV(state.load);
  const moving = PARTS.some((p) => spring[p.id].armed || spring[p.id].x !== spring[p.id].target);
  const id = effective();
  const label = id ? byId[id].n + " · " + byId[id].name
    : moving ? (state.stage ? "desmontando" : "montando")
    : state.stage === 0 ? "Vs " + num(vs / 1000, 2) + " kV · óleo " + num(state.oil, 0) + " °C"
    : state.stage === 1 ? "desmontado · " + SYSTEMS.length + " sistemas"
    : settled ? "prancha · " + PARTS.length + " peças" : "montando a prancha";
  if (label !== state.say) {
    state.say = label; readout.textContent = label;
    cell("vp").textContent = num(RATED.Vp / 1000, 1) + " kV";
    cell("vs").textContent = num(vs / 1000, 2) + " kV";
    cell("tap").textContent = (tapFraction(state.tap) >= 0 ? "+" : "−") + num(Math.abs(tapFraction(state.tap)) * 100, 2) + " %";
    cell("np").textContent = turnsHV(state.tap) + " / " + RATED.Ns;
    cell("ip").textContent = num(ip, 0) + " A";
    cell("is").textContent = num(is, 0) + " A";
    cell("load").textContent = num(state.load * 100, 0) + " % · " + num(state.load * 25, 1) + " MVA";
    cell("flux").textContent = num(fluxDensity(state.tap), 2) + " T";
    cell("loss").textContent = num(totalLoss(state.load) / 1000, 0) + " kW";
    cell("eff").textContent = num(efficiency(state.load) * 100, 2) + " %";
    cell("oil").textContent = num(state.oil, 0) + " °C";
    cell("fans").textContent = state.fans ? "ligados · ONAF" : "desl. · ONAN";
  }
  const tv = document.querySelector("[data-tapval]");
  if (tv) tv.textContent = (tapFraction(state.tap) >= 0 ? "+" : "−") + num(Math.abs(tapFraction(state.tap)) * 100, 2) + " %";
  toggle.textContent = ["Desmontar", "Desmontar mais", "Montar"][state.stage];
  cutBtn.disabled = state.stage === 2;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
  last = now;
  step(dt);
  draw();
  frame = visible ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
const take = () => { state.touring = false; state.idle = 0; };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
toggle.addEventListener("click", () => { take(); setStage((state.stage + 1) % 3); });
cutBtn.addEventListener("click", () => { take(); setCut(!state.cut); });
sysBtns.forEach((b) => b.addEventListener("click", () => { take(); toggleSystem(b.dataset.sysToggle); }));
rows.forEach((r) => {
  r.addEventListener("click", () => { take(); select(r.dataset.pick); });
  r.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") hover(r.dataset.pick); });
  r.addEventListener("pointerleave", () => hover(null));
  r.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); take(); select(r.dataset.pick); } });
});
const hitOf = (target) => { const g = target.closest ? target.closest(".it[data-p], .sh-bal, .sh-cota, .ov[data-p]") : null; return g && g.dataset.p ? g.dataset.p : null; };
document.querySelectorAll(".iso-stage, .tf-ortho").forEach((area) => {
  area.addEventListener("pointermove", (e) => { if (e.pointerType !== "touch") hover(hitOf(e.target)); });
  area.addEventListener("pointerleave", () => hover(null));
  area.addEventListener("click", (e) => { take(); const id = hitOf(e.target); if (id) select(id); else if (state.sel) select(state.sel); });
});
document.querySelector("[data-tap-down]").addEventListener("click", () => { take(); state.tap = clamp(state.tap - 1, 0, 8); run(); });
document.querySelector("[data-tap-up]").addEventListener("click", () => { take(); state.tap = clamp(state.tap + 1, 0, 8); run(); });
loadInput.addEventListener("input", () => { take(); state.load = clamp(Number(loadInput.value) / 100, 0.05, 1.1); run(); });
stage.addEventListener("keydown", (e) => {
  const ids = SYSTEMS.map((s) => s.id);
  const at = state.sysFocus ? ids.indexOf(state.sysFocus) : -1;
  if (e.key === " " || e.key === "Enter") { e.preventDefault(); take(); setStage((state.stage + 1) % 3); }
  else if (e.key === "ArrowRight") { e.preventDefault(); take(); focusSystem(ids[(at + 1) % ids.length]); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); take(); focusSystem(ids[(at - 1 + ids.length) % ids.length]); }
  else if (e.key === "ArrowUp") { e.preventDefault(); take(); state.load = clamp(state.load + 0.05, 0.05, 1.1); loadInput.value = Math.round(state.load * 100); run(); }
  else if (e.key === "ArrowDown") { e.preventDefault(); take(); state.load = clamp(state.load - 0.05, 0.05, 1.1); loadInput.value = Math.round(state.load * 100); run(); }
  else if (e.key === "Escape") { take(); state.sel = null; state.sysFocus = null; paintSelection(); }
  else if (e.key === "Home") { take(); setStage(0); }
  else if (e.key === "End") { take(); setStage(2); }
});
window.addEventListener("resize", run);
window.__tf = { setStage, setCut, select, toggleSystem, state, spring, spread };
loadInput.value = Math.round(state.load * 100);
paintSelection();
visible = true; step(0.016); draw(); visible = false;
`;
}
