export const PAGE_CSS = `
.tf-bar{display:flex;flex-wrap:wrap;gap:12px 14px;align-items:center;margin-top:14px}
.tf-btn{font:500 12px/1 var(--anatomy-mono);color:var(--anatomy-strong);background:var(--anatomy-card);border:1px solid var(--anatomy-mid);padding:10px 16px;cursor:pointer;letter-spacing:.06em;text-transform:uppercase;min-width:40px}
.tf-btn:hover:not(:disabled){border-color:var(--anatomy-hi)}
.tf-btn:disabled{opacity:.4;cursor:default}
.tf-btn[aria-pressed="true"]{background:var(--anatomy-face);border-color:var(--anatomy-hi)}
.tf-btn:focus-visible,.iso-stage:focus-visible,.bom-row:focus-visible,.tf-chip:focus-visible,.bom-toggle:focus-visible{outline:1px solid var(--anatomy-hi);outline-offset:3px}
.tf-sys{display:flex;flex-wrap:wrap;gap:6px;margin-left:auto}
.tf-chip{display:inline-flex;align-items:center;gap:7px;font:12px/1 ui-sans-serif,system-ui,sans-serif;color:var(--anatomy-text);background:var(--anatomy-card);border:1px solid var(--anatomy-faint);padding:8px 11px;cursor:pointer}
.tf-chip i{width:9px;height:9px;border:1px solid var(--anatomy-hi);background:var(--anatomy-hi)}
.tf-chip[aria-pressed="false"]{color:var(--anatomy-muted)}
.tf-chip[aria-pressed="false"] i{background:transparent;border-color:var(--anatomy-mid)}
.tf-info{margin:12px 0 0;color:var(--anatomy-text);font-size:13px;line-height:1.55;min-height:3.1em}
.tf-panel{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:1px;margin-top:14px;background:var(--anatomy-faint);border:1px solid var(--anatomy-faint)}
.tf-cell{background:var(--anatomy-card);padding:10px 12px}
.tf-cell b{display:block;font:500 15px/1.25 var(--anatomy-mono);color:var(--anatomy-strong);font-variant-numeric:tabular-nums;white-space:nowrap}
.tf-cell span{display:block;margin-top:3px;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--anatomy-muted)}
.tf-controls{display:flex;flex-wrap:wrap;gap:12px 32px;margin-top:14px;align-items:center;font-family:var(--anatomy-mono);font-size:12px;color:var(--anatomy-text)}
.tf-controls label{display:flex;align-items:center;gap:12px}
.tf-controls input[type=range]{width:220px;accent-color:var(--anatomy-hi)}
.tf-tap{display:flex;align-items:center;gap:8px}
.tf-tap output{min-width:84px;text-align:center;color:var(--anatomy-strong)}
.iso-stage{touch-action:pan-y;user-select:none}
.iso-stage .iso-svg{overflow:hidden}
.it{transition:opacity .3s}
.it[data-on] .iso-fill{fill:var(--anatomy-face)}
.it[data-on] .iso-top{fill:var(--anatomy-lit-top)}
.it[data-on] .iso-shade{fill:var(--anatomy-lit-shade)}
.it[data-on] .iso-edge{stroke:var(--anatomy-lit)}
.it[data-on] .iso-solid[data-seamless]>.iso-top{stroke:var(--anatomy-lit-top)}
.it[data-on] .iso-solid[data-seamless]>.iso-shade{stroke:var(--anatomy-lit-shade)}
[data-focus] .it:not([data-on]) .iso-edge[data-tone="hi"],[data-focus] .it:not([data-on]) .iso-line[data-tone="hi"]{stroke:var(--anatomy-mid)}
[data-focus] .it:not([data-on]) .iso-edge[data-tone="mid"],[data-focus] .it:not([data-on]) .iso-line[data-tone="mid"]{stroke:var(--anatomy-lo)}
[data-focus] .it:not([data-on]) .iso-edge[data-tone="lo"],[data-focus] .it:not([data-on]) .iso-line[data-tone="lo"]{stroke:var(--anatomy-faint)}
.it.x-cut{transition:opacity .35s}
[data-cut] .g-cut{opacity:.1!important;pointer-events:none}
[data-cut] .x-cut{opacity:0!important;pointer-events:none}
.it.v-cut{opacity:0;pointer-events:none;transition:opacity .35s}
[data-cut] .v-cut{opacity:1;pointer-events:none}
.it.v-sheet{pointer-events:none}
[data-tap-dot] circle{fill:var(--anatomy-mid)}
[data-tap-dot][data-lit] circle{fill:var(--anatomy-lit)}
.iso-solid .iso-halo{pointer-events:none}

[data-spread] g[clip-path]{clip-path:none}
.sheet-ann{opacity:0;pointer-events:none}
.sh-frame{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2px}
.sh-frame[data-in]{stroke:var(--anatomy-lo);stroke-width:.8px}
.sh-t{font:600 calc(11px * var(--tk, 1)) var(--anatomy-mono);fill:var(--anatomy-strong);letter-spacing:.08em}
.sh-rule{stroke:var(--anatomy-mid);fill:none;stroke-width:1px}
.sh-lead{stroke:var(--anatomy-hi);stroke-width:.8px;fill:none}
.sh-dot{fill:var(--anatomy-strong);r:calc(2.2px * var(--tk, 1))}
.sh-ball{fill:var(--anatomy-paper);stroke:var(--anatomy-hi);stroke-width:1px;r:calc(9.5px * var(--tk, 1))}
.sh-n{font:600 calc(10px * var(--tk, 1)) var(--anatomy-mono);fill:var(--anatomy-strong);text-anchor:middle;dominant-baseline:central}
.sh-dim{stroke:var(--anatomy-mid);stroke-width:.8px;fill:none}
.sh-v{font:calc(9.5px * var(--tk, 1)) var(--anatomy-mono);fill:var(--anatomy-text);text-anchor:middle;paint-order:stroke;stroke:var(--anatomy-paper);stroke-width:calc(3.5px * var(--tk, 1));stroke-linejoin:round}
.sh-v.end{text-anchor:end}
.sh-bal,.sh-cota{pointer-events:all;cursor:pointer}
.sh-bal[data-on] .sh-ball{fill:var(--anatomy-lit);stroke:var(--anatomy-lit)}
.sh-bal[data-on] .sh-n{fill:var(--anatomy-paper)}
.sh-bal[data-on] .sh-lead{stroke:var(--anatomy-lit);stroke-width:1.2px}
.sh-cota[data-on] .sh-dim{stroke:var(--anatomy-lit)}
[data-focus] .sh-bal:not([data-on]),[data-focus] .sh-cota:not([data-on]){opacity:.45}

.tf-board{display:grid;grid-template-columns:minmax(0,1fr);gap:18px;margin-top:18px}
.tf-side{display:none}
[data-stage="2"] .tf-board{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);align-items:start}
[data-stage="2"] .tf-side{display:block}
@media (max-width:820px){[data-stage="2"] .tf-board{grid-template-columns:minmax(0,1fr)}}
.bom{width:100%;border-collapse:collapse;font-size:12.5px;background:var(--anatomy-card);border:1px solid var(--anatomy-faint)}
.bom caption{caption-side:top;text-align:left;font:600 11px var(--anatomy-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--anatomy-muted);padding:0 0 8px}
.bom thead th{font:500 10.5px var(--anatomy-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--anatomy-muted);text-align:left;padding:7px 10px;border-bottom:1px solid var(--anatomy-faint)}
.bom td,.bom th{padding:6px 10px;vertical-align:top}
.bom .bom-sys th{padding:0;border-top:1px solid var(--anatomy-faint);background:var(--anatomy-face)}
.bom-toggle{display:flex;align-items:center;gap:9px;width:100%;text-align:left;font:600 11.5px var(--anatomy-mono);letter-spacing:.05em;color:var(--anatomy-strong);background:transparent;border:0;padding:8px 10px;cursor:pointer}
.bom-toggle i{width:8px;height:8px;border:1px solid var(--anatomy-hi);background:var(--anatomy-hi)}
.bom-toggle[aria-pressed="false"] i{background:transparent}
.bom-row{cursor:pointer;border-top:1px solid var(--anatomy-faint);color:var(--anatomy-text)}
.bom-row .n{font:500 11px var(--anatomy-mono);color:var(--anatomy-muted);width:34px}
.bom-row .nm{color:var(--anatomy-strong)}
.bom-row .q{font:11px var(--anatomy-mono);text-align:right;width:38px}
.bom-row .nom{color:var(--anatomy-muted);font-size:11.5px}
.bom-row:hover,.bom-row[data-on]{background:var(--anatomy-face)}
.bom-row[data-on] .n{color:var(--anatomy-strong)}
.tf-board[data-focus] .bom-row:not([data-on]){opacity:.6}
tbody[data-off] .bom-row{opacity:.3;text-decoration:line-through}
@media (max-width:640px){.bom .nom{display:none}.bom thead th:last-child{display:none}}

.tf-ortho{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--anatomy-faint);border:1px solid var(--anatomy-faint)}
.ov-frame{background:var(--anatomy-paper);padding:8px 8px 4px;margin:0}
.ov-frame figcaption{font:600 10px var(--anatomy-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--anatomy-muted);padding:2px 2px 6px}
.ov-frame svg{display:block;width:100%;height:auto}
.ov{fill:var(--anatomy-paper);stroke:var(--anatomy-hi);stroke-width:1px;vector-effect:non-scaling-stroke}
.ov.line{fill:none}
.ov.faint{stroke:var(--anatomy-lo)}
.ov.cut{fill:none;stroke:var(--anatomy-mid)}
.ov[data-on]{fill:var(--anatomy-face);stroke:var(--anatomy-lit);stroke-width:1.6px}
.ov.line[data-on]{fill:none}
.ov-dim{fill:none;stroke:var(--anatomy-mid);stroke-width:.8px;vector-effect:non-scaling-stroke}
.ov-txt{font:18px var(--anatomy-mono);fill:var(--anatomy-text);paint-order:stroke;stroke:var(--anatomy-paper);stroke-width:4px}
.ov-ax{fill:none;stroke:var(--anatomy-lo);stroke-width:.8px;stroke-dasharray:6 3 1.5 3;vector-effect:non-scaling-stroke}
.tf-stamp{margin-top:14px;border:1px solid var(--anatomy-hi);background:var(--anatomy-paper);font-size:12px}
.st-title{font:600 13px var(--anatomy-mono);letter-spacing:.05em;color:var(--anatomy-strong);padding:10px 12px;border-bottom:1px solid var(--anatomy-hi)}
.st-row{display:flex;justify-content:space-between;gap:12px;padding:5px 12px;border-bottom:1px solid var(--anatomy-faint);color:var(--anatomy-text)}
.st-row b{font-weight:500;color:var(--anatomy-strong);text-align:right}
.st-foot{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:7px 12px;font:10.5px var(--anatomy-mono);letter-spacing:.05em;color:var(--anatomy-muted)}

.iso-fill,.iso-shade,.iso-top,.iso-plate,.bom,.tf-stamp,.ov{transition:fill .6s,stroke .6s,background-color .6s}
.iso-line{transition:stroke .6s}
.tf-root[data-sheet]{
  --anatomy-paper:#0c1a2b;--anatomy-card:#0f2033;--anatomy-face:#153354;--anatomy-top:#173a60;
  --anatomy-shade-0:#0a1727;--anatomy-shade-1:#0d1c31;--anatomy-shade-2:#10233b;--anatomy-shade-3:#142b47;
  --anatomy-lit-top:#1d4a7a;--anatomy-lit-shade:#173b62;
  --anatomy-hi:#cfe6ff;--anatomy-mid:#6f9bc9;--anatomy-lo:#41668f;--anatomy-faint:#254468;--anatomy-lit:#ffffff;
  --anatomy-text:#a9c4e2;--anatomy-strong:#e9f4ff;--anatomy-muted:#6f90b5;--anatomy-halo:#04101d;
}
.iso[data-theme="light"] .tf-root[data-sheet]{
  --anatomy-paper:#eaf2fb;--anatomy-card:#f3f8fd;--anatomy-face:#ffffff;--anatomy-top:#ffffff;
  --anatomy-shade-0:#c9d9ea;--anatomy-shade-1:#d6e3f1;--anatomy-shade-2:#e0eaf5;--anatomy-shade-3:#ebf2f9;
  --anatomy-lit-top:#ffffff;--anatomy-lit-shade:#dfeaf6;
  --anatomy-hi:#0f3a69;--anatomy-mid:#5f87b3;--anatomy-lo:#9db9d6;--anatomy-faint:#cddced;--anatomy-lit:#001f44;
  --anatomy-text:#365a82;--anatomy-strong:#0b2d54;--anatomy-muted:#6d8bad;--anatomy-halo:#6f8aa8;
}
@media (max-width:900px){.tf-panel{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media (max-width:460px){.tf-panel{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:760px){[data-stage="2"] .iso-stage{overflow-x:auto;overscroll-behavior-x:contain}[data-stage="2"] .iso-stage .iso-svg{width:980px;max-width:none}}
@media (max-width:560px){.iso-stage{margin:0 -4px}.tf-sys{margin-left:0}}


.fx-line{fill:none;stroke-width:1.5px;stroke-linecap:round;opacity:0;transition:opacity .5s;pointer-events:none}
.fx-bub{fill:var(--anatomy-paper);stroke:var(--anatomy-lit);stroke-width:.8px;opacity:0;pointer-events:none}
.fx-glass{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:.8px}
.fx-level{fill:var(--t-top, var(--anatomy-mid));stroke:none}
[data-live] .fx-line{opacity:1}
.fx-oil{stroke-dasharray:3 6}
.fx-hot{stroke:var(--t-top, var(--anatomy-hi))}
.fx-cold{stroke:var(--t-bot, var(--anatomy-mid))}
.fx-oil{stroke-dashoffset:calc(var(--oil-off, 0) * -1px)}
.fx-oil.fx-rev{stroke-dashoffset:calc(var(--oil-off, 0) * 1px)}
.fx-cur{stroke:var(--anatomy-lit);stroke-width:1.2px;stroke-dasharray:2 9;stroke-dashoffset:calc(var(--cur-off, 0) * -1px)}
.fx-cur-lv{stroke-width:2.4px;stroke-dasharray:4 7}
.fx-flux{stroke:var(--anatomy-lit);stroke-width:2px;stroke-dasharray:5 5}
[data-flux="ab"]{stroke-dashoffset:calc(var(--f-ab, 0) * 1px)}
[data-flux="bc"]{stroke-dashoffset:calc(var(--f-bc, 0) * 1px)}
[data-live] [data-flux="ab"]{opacity:var(--f-ab-o, 0)}
[data-live] [data-flux="bc"]{opacity:var(--f-bc-o, 0)}
.fx-breath{stroke:var(--anatomy-lit);stroke-width:1.6px;stroke-dasharray:2 4;stroke-dashoffset:calc(var(--br-off, 0) * 1px)}
[data-live] .fx-breath{opacity:var(--br-o, 0)}
[data-tripped] .fx-cur,[data-tripped] .fx-flux{opacity:0!important}
[data-live] .it[data-p="at"] .iso-fill,[data-live] .it[data-p="bt"] .iso-fill{fill:color-mix(in srgb,var(--t-hot, transparent) 32%,var(--anatomy-paper))}
[data-live] .it[data-p="oleo"] .iso-line[data-tone="lo"]{stroke:color-mix(in srgb,var(--t-top, var(--anatomy-lo)) 70%,var(--anatomy-paper))}
[data-live] [data-oti-needle]{stroke:var(--t-top)}
[data-alarm] .it[data-p="buchholz"] .iso-edge{stroke:var(--anatomy-red)}
[data-alarm] .it[data-p="buchholz"] .iso-fill{fill:color-mix(in srgb,var(--anatomy-red) 22%,var(--anatomy-paper))}
.tf-over{font:11px var(--anatomy-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--anatomy-red);visibility:hidden}
.tf-over[data-on]{visibility:visible}
.tf-clock{font:11px var(--anatomy-mono);letter-spacing:.05em;color:var(--anatomy-muted)}
.tf-cell b[data-state="alarm"]{color:var(--anatomy-red)}
`;
