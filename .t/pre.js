window.__frames = 0; const r = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = (f) => r((t) => { window.__frames++; f(t); });
