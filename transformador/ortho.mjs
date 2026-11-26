import { D, HV, LV, hvAxis, CONS, RAD, RAD_R_X, RAD_L_X, CAB } from "./parts.mjs";
import { HV_TURRET, hvPorcelain, LV_TURRET, lvPorcelain } from "./draw/terminais.mjs";

const { TX0, TX1, TY0, TY1, Z_FLOOR, Z_BASE, Z_WALL, Z_LID, OIL_Z, CORE_X, CORE_Y, WALL } = D;
const f = (n) => Math.round(n * 10) / 10;

class View {
  constructor(id, title, horiz, vert, box, flipV = false) {
    this.id = id;
    this.title = title;
    this.horiz = horiz;
    this.vert = vert;
    this.box = box;
    this.flipV = flipV;
    this.out = [];
  }
  X(u) { return f(u); }
  Y(v) { return f(this.flipV ? v : -v); }
  rect(part, u0, v0, u1, v1, cls = "") {
    const [a, b] = [Math.min(u0, u1), Math.min(this.Y(v0), this.Y(v1))];
    const w = Math.abs(u1 - u0);
    const h = Math.abs(this.Y(v1) - this.Y(v0));
    this.out.push(`<rect class="ov ${cls}" ${part ? `data-p="${part}"` : ""} x="${this.X(a)}" y="${f(b)}" width="${f(w)}" height="${f(h)}"/>`);
  }
  circ(part, u, v, r, cls = "") {
    this.out.push(`<circle class="ov ${cls}" ${part ? `data-p="${part}"` : ""} cx="${this.X(u)}" cy="${this.Y(v)}" r="${f(r)}"/>`);
  }
  poly(part, pts, cls = "") {
    this.out.push(`<polygon class="ov ${cls}" ${part ? `data-p="${part}"` : ""} points="${pts.map(([u, v]) => `${this.X(u)},${this.Y(v)}`).join(" ")}"/>`);
  }
  line(part, pts, cls = "line") {
    this.out.push(`<polyline class="ov ${cls}" ${part ? `data-p="${part}"` : ""} points="${pts.map(([u, v]) => `${this.X(u)},${this.Y(v)}`).join(" ")}"/>`);
  }
  ax(pts) {
    this.out.push(`<polyline class="ov-ax" points="${pts.map(([u, v]) => `${this.X(u)},${this.Y(v)}`).join(" ")}"/>`);
  }
  dimH(u0, u1, v, label, off = 14) {
    const y = this.Y(v) + off;
    const t = (u) => `M${this.X(u) - 3} ${f(y + 3)}L${this.X(u) + 3} ${f(y - 3)}`;
    this.out.push(`<path class="ov-dim" d="M${this.X(u0)} ${this.Y(v)}V${f(y + 4)}M${this.X(u1)} ${this.Y(v)}V${f(y + 4)}M${this.X(u0)} ${f(y)}H${this.X(u1)}${t(u0)}${t(u1)}"/><text class="ov-txt" x="${this.X((u0 + u1) / 2)}" y="${f(y - 4)}" text-anchor="middle">${label}</text>`);
  }
  dimV(v0, v1, u, label, off = -14) {
    const x = this.X(u) + off;
    const t = (v) => `M${f(x - 3)} ${this.Y(v) + 3}L${f(x + 3)} ${this.Y(v) - 3}`;
    this.out.push(`<path class="ov-dim" d="M${this.X(u)} ${this.Y(v0)}H${f(x - 4)}M${this.X(u)} ${this.Y(v1)}H${f(x - 4)}M${f(x)} ${this.Y(v0)}V${this.Y(v1)}${t(v0)}${t(v1)}"/><text class="ov-txt" x="${f(x - 5)}" y="${f((this.Y(v0) + this.Y(v1)) / 2)}" text-anchor="end">${label}</text>`);
  }
  html() {
    const [u0, v0, u1, v1] = this.box;
    const y0 = this.flipV ? v0 : -v1;
    const h = v1 - v0;
    return `<figure class="ov-frame"><figcaption>${this.title}</figcaption><svg viewBox="${u0} ${y0} ${u1 - u0} ${h}" role="img" aria-label="${this.title}"><defs><pattern id="hatch-${this.id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V6" stroke="var(--anatomy-mid)" stroke-width="1"/></pattern></defs>${this.out.join("")}</svg></figure>`;
  }
}

const mm = (units) => `${((units * D.MM) / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m`;
const HATCH = (id) => `style="fill:url(#hatch-${id})"`;

function bushing(view, part, bh, bz, ah, az, sheds = true) {
  const len = Math.hypot(ah, az) || 1;
  const t = [ah / len, az / len];
  const n = [-t[1], t[0]];
  const at = (s, r) => [bh + t[0] * s * 1 + n[0] * r, bz + t[1] * s + n[1] * r];
  const unitLen = 1 / len;
  void unitLen;
  const S = (s) => s * len;
  const L = [];
  const R = [];
  const push = (s, r) => { L.push(at(S(s), r)); R.push(at(S(s), -r)); };
  for (const [s, r] of [...HV_TURRET, ...hvPorcelain()]) push(s, r);
  view.poly(part, [...L, ...R.reverse()]);
}

function lvOutline(v, h, z) {
  const prof = [...LV_TURRET, ...lvPorcelain()];
  v.poly("buchaBT", [...prof.map(([s, r]) => [h - r, z + s]), ...prof.reverse().map(([s, r]) => [h + r, z + s])]);
}

function frontal() {
  const v = new View("f", "Vista frontal", "x", "z", [-205, -60, 255, 440], false);
  v.rect("base", -62, 0, 155, Z_BASE);
  v.rect("cuba", TX0, Z_BASE, TX1, Z_WALL);
  v.rect("tampa", -58, Z_WALL, 158, Z_LID);
  v.rect("radB", RAD_L_X, 70, RAD_L_X + RAD.depth, 255);
  v.rect("radA", RAD_R_X - 6, 70, RAD_R_X + RAD.depth, 255);
  v.rect("ventiladores", 167, 44, 217, 76);
  v.rect("ventiladores", -123, 44, -73, 76);
  v.rect("escada", -42, 50, -14, 250);
  v.rect("armario", CAB.x, CAB.z0, CAB.x + CAB.w, CAB.z1);
  v.rect("eletrodutos", 30, 0, 38, CAB.z0);
  v.rect("eletrodutos", 58, 0, 66, CAB.z0);
  v.circ("termometro", 130, 196, 12);
  v.circ("dreno", 126, 62, 9);
  v.rect("corrimao", -52, Z_LID, 152, Z_LID + 42, "line");
  v.line("corrimao", [[-52, Z_LID + 38], [152, Z_LID + 38]]);
  v.line("tubo", [[-20, 358], [-20, 268]]);
  v.rect("conservador", CONS.x0, CONS.z - CONS.r, CONS.x0 + CONS.len, CONS.z + CONS.r);
  v.line("suportes", [[-35, Z_LID], [-35, 355]]);
  v.line("suportes", [[140, Z_LID], [140, 355]]);
  v.rect("respirador", 120, CONS.z - 72, 140, CONS.z - 8);
  LV.forEach(([x]) => lvOutline(v, x, Z_LID));
  HV.forEach(({ base, phi }, i) => {
    const a = hvAxis(phi);
    bushing(v, ["buchaA", "buchaB", "buchaC"][i], base[0], Z_LID, a[0], a[2]);
  });
  HV.forEach(({ base }) => v.rect("flanges", base[0] - 29, Z_LID, base[0] + 29, Z_LID + 3));
  v.dimH(TX0, TX1, 0, mm(TX1 - TX0), 36);
  v.dimV(0, Z_LID, RAD_L_X, mm(Z_LID), -22);
  v.ax([[CORE_X, 0], [CORE_X, 440]]);
  return v;
}

function lateral() {
  const v = new View("l", "Vista lateral", "y", "z", [-315, -60, 300, 440], false);
  v.rect("base", -158, 0, 282, Z_BASE);
  v.rect("cuba", TY0, Z_BASE, TY1, Z_WALL);
  v.rect("tampa", -154, Z_WALL, 278, Z_LID);
  for (let i = 0; i < RAD.count; i++) {
    const yc = RAD.y0 + RAD.pitch * i;
    v.rect("radA", yc - RAD.thick / 2, 76, yc + RAD.thick / 2, 252);
  }
  v.line("radA", [[-140, 90], [260, 90]]);
  v.line("radA", [[-140, 238], [260, 238]]);
  [-67.5, 22.5, 112.5, 202.5].forEach((y) => v.rect("ventiladores", y - 28, 44, y + 28, 76));
  v.rect("armario", CAB.y, CAB.z0, CAB.y + CAB.d, CAB.z1);
  v.rect("escada", TY1 + 6, 50, TY1 + 10, 250);
  v.rect("termometro", TY1, 184, TY1 + 8, 208);
  v.rect("dreno", TY1, 56, TY1 + 17, 68);
  v.rect("corrimao", -140, Z_LID, 262, Z_LID + 42, "line");
  v.line("corrimao", [[-140, Z_LID + 38], [262, Z_LID + 38]]);
  v.circ("conservador", CONS.y, CONS.z, CONS.r);
  v.circ("conservador", CONS.y, CONS.z, 12, "line");
  v.line("tubo", [[-202, 358], [-142, 268]]);
  v.line("suportes", [[-144, Z_LID], [-196, 355]]);
  v.rect("respirador", CONS.y - 32, CONS.z - 72, CONS.y - 12, CONS.z - 8);
  LV.forEach(([, y]) => lvOutline(v, y, Z_LID));
  HV.forEach(({ base, phi }, i) => {
    const a = hvAxis(phi);
    bushing(v, ["buchaA", "buchaB", "buchaC"][i], base[1], Z_LID, a[1], a[2]);
  });
  v.dimH(TY0, TY1, 0, mm(TY1 - TY0), 36);
  v.dimV(0, 424, -270, mm(424), -16);
  return v;
}

function plan() {
  const v = new View("p", "Planta", "x", "y", [-150, -290, 255, 305], true);
  v.rect("base", -62, -158, 155, 282);
  v.rect("cuba", TX0, TY0, TX1, TY1);
  v.rect("tampa", -58, -154, 158, 278);
  v.rect("radB", RAD_L_X, -120, RAD_L_X + RAD.depth, 255);
  v.rect("radA", RAD_R_X, -120, RAD_R_X + RAD.depth, 255);
  [-67.5, 22.5, 112.5, 202.5].forEach((y) => [192, -98].forEach((x) => { v.circ("ventiladores", x, y, 28); v.circ("ventiladores", x, y, 6, "line"); }));
  v.rect("armario", CAB.x, CAB.y, CAB.x + CAB.w, CAB.y + CAB.d);
  v.rect("escada", -42, TY1 + 6, -14, TY1 + 10);
  v.rect("conservador", CONS.x0, CONS.y - CONS.r, CONS.x0 + CONS.len, CONS.y + CONS.r);
  v.rect("respirador", 120, CONS.y - 44, 140, CONS.y - 24);
  v.line("tubo", [[-20, -202], [-20, -142]]);
  v.line("suportes", [[-35, -144], [-35, -196]]);
  v.line("suportes", [[140, -144], [140, -196]]);
  v.circ("tampoes", 0, -90, 24, "line");
  v.circ("tampoes", 40, 220, 18, "line");
  v.rect("corrimao", -50, -140, 150, 262, "line");
  v.circ("comutador", CORE_X, 232, 13, "line");
  LV.forEach(([x, y]) => v.circ("buchaBT", x, y, 5.6));
  HV.forEach(({ base, phi }, i) => {
    const a = hvAxis(phi);
    v.circ("flanges", base[0], base[1], 29, "line");
    bushing(v, ["buchaA", "buchaB", "buchaC"][i], base[0], base[1], a[0], a[1]);
  });
  [[-48, -144], [-48, 266], [148, -144], [148, 266]].forEach(([x, y]) => v.rect("olhais", x - 6, y - 1.5, x + 6, y + 1.5));
  v.dimH(TX0, TX1, TY1 + 24, mm(TX1 - TX0), 28);
  v.out.push(`<path class="ov-ax" d="M${CORE_X} -285V300"/><text class="ov-txt" x="${CORE_X - 3}" y="-278" text-anchor="end">A</text><text class="ov-txt" x="${CORE_X - 3}" y="298" text-anchor="end">A</text>`);
  return v;
}

function section() {
  const v = new View("s", "Corte A-A", "y", "z", [-255, -60, 300, 440], false);
  const h = (part, u0, v0, u1, v1) => {
    v.out.push(`<rect class="ov" ${HATCH("s")} data-p="${part}" x="${Math.min(u0, u1)}" y="${v.Y(Math.max(v0, v1))}" width="${Math.abs(u1 - u0)}" height="${Math.abs(v1 - v0)}"/>`);
  };
  h("base", -158, 0, -144, Z_BASE);
  h("base", 268, 0, 282, Z_BASE);
  v.rect("oleo", TY0 + WALL, Z_FLOOR, TY1 - WALL, OIL_Z);
  v.out.push(`<path class="ov-ax" d="M${TY0 + WALL} ${v.Y(OIL_Z)}H${TY1 - WALL}"/>`);
  h("cuba", TY0, Z_BASE, TY1, Z_FLOOR);
  h("cuba", TY0, Z_FLOOR, TY0 + WALL, Z_WALL);
  h("cuba", TY1 - WALL, Z_FLOOR, TY1, Z_WALL);
  h("tampa", -154, Z_WALL, 278, Z_LID);
  v.rect("calcos", CORE_Y[0] - 22, Z_FLOOR, CORE_Y[2] + 22, D.YOKE_LOW);
  CORE_Y.forEach((y) => {
    v.rect("pernas", y - 15, D.YOKE_LOW + 18, y + 15, D.YOKE_HIGH - 18);
    v.rect("cilindros", y - 19.8, 86, y - 18.6, 204);
    v.rect("cilindros", y + 18.6, 86, y + 19.8, 204);
    v.rect("cilindros", y - 29.2, 86, y - 28, 204);
    v.rect("cilindros", y + 28, 86, y + 29.2, 204);
    v.rect("bt", y - 26.5, 94, y - 21.4, 196, "");
    v.rect("bt", y + 21.4, 94, y + 26.5, 196);
    for (const sgn of [-1, 1]) {
      for (let d = 0; d < 8; d++) {
        const z0 = 88 + d * (114 / 8) + 0.8;
        const z1 = z0 + 114 / 8 - 1.6;
        const a = y + sgn * 30.6;
        const b = y + sgn * 38;
        v.rect("at", a, z0, b, z1);
      }
    }
    v.rect("calcos", y - 38, 198, y + 38, 203);
  });
  v.rect("jugos", CORE_Y[0] - 20, D.YOKE_LOW, CORE_Y[2] + 20, D.YOKE_LOW + 18);
  v.rect("jugos", CORE_Y[0] - 20, D.YOKE_HIGH - 18, CORE_Y[2] + 20, D.YOKE_HIGH);
  v.rect("comutador", 219, 120, 245, 222);
  v.line("comutador", [[232, 222], [232, 244]]);
  v.circ("conservador", CONS.y, CONS.z, CONS.r);
  v.circ("conservador", CONS.y, CONS.z, CONS.r - 3, "line");
  v.rect("armario", CAB.y, CAB.z0, CAB.y + CAB.d, CAB.z1);
  v.dimH(TY0, TY1, 0, mm(TY1 - TY0), 36);
  v.dimV(Z_FLOOR, OIL_Z, -158, `óleo ${mm(OIL_Z - Z_FLOOR)}`, -6);
  return v;
}

export function orthoHtml() {
  return `<div class="tf-ortho">${[frontal(), lateral(), plan(), section()].map((v) => v.html()).join("")}</div>`;
}
