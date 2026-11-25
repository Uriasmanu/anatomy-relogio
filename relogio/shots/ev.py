import json
js="""(()=>{const o={};document.querySelectorAll('[data-a]').forEach(e=>{const a=e.getAttribute('data-a');const b=e.getBBox();const t=e.getAttribute('transform')||'';(o[a]=o[a]||[]).push([Math.round(b.x),Math.round(b.y),Math.round(b.x+b.width),Math.round(b.y+b.height),t.slice(0,40)])});const r={};for(const k of ['bezel','case','dial','hands','motion']){r[k]=o[k]};return JSON.stringify(r)})()"""
json.dump([["wait",500],["click","svg"],["wait",4000],["eval",js]],open('shots/ev.json','w'))
