import * as k from "./kit/iso-kit.mjs";
import { PARTS, SYSTEMS, BOM_ORDER } from "./parts.mjs";

const NUM = /-?\d+(?:\.\d+)?/g;

export function boundsOf(svg) {
  const clean = svg.replace(/<clipPath[\s\S]*?<\/clipPath>/g, "").replace(/<circle class="fx-bub"[^>]*\/>/g, "");
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const take = (x, y) => {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  };
  for (const m of clean.matchAll(/\sd="([^"]*)"/g)) {
    const n = m[1].match(NUM);
    if (!n) continue;
    for (let i = 0; i + 1 < n.length; i += 2) take(Number(n[i]), Number(n[i + 1]));
  }
  for (const m of clean.matchAll(/<circle[^>]*\scx="(-?[\d.]+)"[^>]*\scy="(-?[\d.]+)"/g)) take(Number(m[1]), Number(m[2]));
  return [x0, y0, x1, y1];
}

export function instanceBounds(items, P) {
  const map = new Map();
  for (const it of items) {
    if (!it.part || it.cls.includes("v-cut")) continue;
    const key = `${it.part}|${it.inst}`;
    const [a, b, c, d] = boundsOf(it.svg);
    if (!Number.isFinite(a)) continue;
    const [mx, my] = k.axisVector(P, it.move);
    const rec = map.get(key) || { part: it.part, inst: it.inst, box: [Infinity, Infinity, -Infinity, -Infinity], shift: [mx, my] };
    rec.box = [Math.min(rec.box[0], a + mx), Math.min(rec.box[1], b + my), Math.max(rec.box[2], c + mx), Math.max(rec.box[3], d + my)];
    map.set(key, rec);
  }
  return map;
}

export function packSheet(bounds, { width = 1700, gap = 30, margin = 48, titleH = 66, share = 360 } = {}) {
  const placed = [];
  const titles = [];
  const rows = [];
  let row = null;
  const newRow = () => {
    row = { items: [], x: margin, h: 0 };
    rows.push(row);
  };
  newRow();
  for (const sys of BOM_ORDER) {
    const rects = [];
    for (const p of sys.parts) {
      for (const [key, rec] of bounds) {
        if (rec.part !== p.id || rec.inst.startsWith('x')) continue;
        rects.push({ key, part: p.id, inst: rec.inst, rec, sys: sys.id });
      }
    }
    if (row.items.length && row.x > width - margin - share) newRow();
    let first = true;
    for (const r of rects) {
      const w = r.rec.box[2] - r.rec.box[0];
      const h = r.rec.box[3] - r.rec.box[1];
      if (row.items.length && row.x + w > width - margin) newRow();
      if (first) {
        titles.push({ sys: sys.id, n: sys.n, name: sys.name, row, x: row.x });
        first = false;
      }
      row.items.push({ ...r, w, h, x: row.x });
      row.x += w + gap;
      row.h = Math.max(row.h, h);
    }
  }
  let y = margin;
  for (const r of rows) {
    r.y = y + titleH;
    y = r.y + r.h + gap;
  }
  for (const r of rows) for (const it of r.items) placed.push({ ...it, y: r.y + (r.h - it.h) / 2 });
  const height = y - gap + margin;
  const offsets = {};
  for (const r of placed) offsets[r.key] = [r.x - r.rec.box[0], r.y - r.rec.box[1]];
  const marks = titles.map((t) => ({ sys: t.sys, n: t.n, name: t.name, x: t.x, y: t.row.y - 46 }));
  return { placed, titles: marks, width, height, offsets };
}

void PARTS;
void SYSTEMS;
