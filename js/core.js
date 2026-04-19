// ═══════════════════════════════════════════════════════════════
// GenStudio Core — noise, color, export, UI helpers
// ═══════════════════════════════════════════════════════════════
const GS = (() => {

// ── Seeded PRNG ───────────────────────────────────────────────
function seededRng(seed) {
  let s = (seed | 0) + 1;
  return function() {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

// ── Permutation table (fixed, not random) ────────────────────
const PERM = (() => {
  const base = [
    151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,
    69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,
    252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,
    168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,
    211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,
    216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,
    164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,
    126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,
    213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,
    253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,
    242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,
    192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
    138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
  ];
  const p = [...base, ...base];
  return p;
})();

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a, b, t) { return a + t * (b - a); }
function grad(hash, x, y) {
  const h = hash & 3;
  const u = h < 2 ? x : y, v = h < 2 ? y : x;
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
}

function noise2(x, y) {
  const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x), yf = y - Math.floor(y);
  const u = fade(xf), v = fade(yf);
  const aa = PERM[PERM[xi] + yi];
  const ab = PERM[PERM[xi] + yi + 1];
  const ba = PERM[PERM[xi + 1] + yi];
  const bb = PERM[PERM[xi + 1] + yi + 1];
  return lerp(
    lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
    lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
    v
  );
}

function fbm(x, y, octaves = 4, lacunarity = 2, gain = 0.5) {
  let v = 0, amp = 0.5, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    v += amp * noise2(x * freq, y * freq);
    max += amp; amp *= gain; freq *= lacunarity;
  }
  return v / max;
}

// ── Color utils ───────────────────────────────────────────────
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16)
  ];
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  ).join('');
}
function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0)
        : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)];
}
function lerpHex(a, b, t) {
  const [r1,g1,b1] = hexToRgb(a), [r2,g2,b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2-r1)*t, g1 + (g2-g1)*t, b1 + (b2-b1)*t);
}
function gradientAt(stops, t) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 1; i < stops.length; i++) {
    const [p0, c0] = stops[i - 1], [p1, c1] = stops[i];
    if (t <= p1) return lerpHex(c0, c1, (t - p0) / Math.max(0.001, p1 - p0));
  }
  return stops[stops.length - 1][1];
}

// ── Palettes ─────────────────────────────────────────────────
const PALETTES = {
  'Terminal':    ['#000000','#003a0f','#00ff41','#7affaa','#ffffff'],
  'Mondrian':    ['#ffffff','#f5c518','#d62626','#1a3a8f','#111111'],
  'Cyberpunk':   ['#0d0d1a','#ff00ff','#00ffff','#ffff00','#7700ff'],
  'Ocean':       ['#0f1c2e','#0e4d68','#1a9e8c','#64dfb8','#cffafe'],
  'Sunset':      ['#1a0520','#6d1042','#d4483a','#f4a261','#ffecd2'],
  'Neon':        ['#0d0d0d','#ff0090','#00ffcc','#ffe600','#7700ff'],
  'Lava':        ['#0d0000','#5c0a00','#c0280a','#ff6a00','#ffe066'],
  'Nordic':      ['#1b2735','#2c3e50','#4a6fa5','#9bb0c1','#ecf0f1'],
  'Ink':         ['#f5f0e8','#d4c5a9','#8b7355','#4a3728','#1a0f0a'],
  'Earth':       ['#1a0f00','#4a3012','#8b5e2e','#c9956a','#e8d5b7'],
  'Grayscale':   ['#000000','#404040','#808080','#c0c0c0','#ffffff'],
  'Pastel':      ['#fbe4f4','#c8e6f4','#c8f4e4','#f4f0c8','#f4d4c8'],
  'Game Boy':    ['#0f380f','#306230','#8bac0f','#9bbc0f','#ffffff'],
  'Brutalist':   ['#000000','#ff3300','#ffffff','#ffff00','#0033ff'],
  'Botanical':   ['#1a2e1a','#2d5a27','#52a65e','#a8d5a2','#e8f5e9'],
  'Arctic':      ['#e8f4f8','#b8dce8','#6ab4d0','#2979a0','#0d3f5c'],
  'Forest':      ['#0a1a0a','#1e4620','#2e7d32','#66bb6a','#c8e6c9'],
  'Copper':      ['#1a0a00','#5c2e00','#a0522d','#cd853f','#f5deb3'],
  'Retro':       ['#2b0a3d','#7b1fa2','#e91e63','#ff9800','#ffeb3b'],
  'Purple Dream':['#1a0533','#4a1080','#7c5cfc','#c084fc','#f5d0fe'],
  'CGA':         ['#000000','#0000aa','#00aa00','#00aaaa','#aa0000'],
};

const PALETTE_NAMES = Object.keys(PALETTES);
function getPalette(n) { return PALETTES[n] || PALETTES['Terminal']; }
function randPalette(rng) {
  return PALETTE_NAMES[Math.floor((rng || Math.random)() * PALETTE_NAMES.length)];
}

// ── Canvas sizes ─────────────────────────────────────────────
const SIZES = {
  'SQ':   [800, 800],
  '4:3':  [1066, 800],
  '3:4':  [800, 1066],
  '16:9': [1280, 720],
  '9:16': [720, 1280],
  'A4':   [794, 1123],
  'TW':   [1200, 675],
  'IG':   [1080, 1080],
};

// ── Apply grain ───────────────────────────────────────────────
function applyGrain(ctx, w, h, amount) {
  if (!amount || amount <= 0) return;
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  const a = amount * 2.2;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * a;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i+1] = Math.max(0, Math.min(255, d[i+1] + n));
    d[i+2] = Math.max(0, Math.min(255, d[i+2] + n));
  }
  ctx.putImageData(imageData, 0, 0);
}

// ── Export ────────────────────────────────────────────────────
function exportPNG(canvas, name) {
  const a = document.createElement('a');
  a.download = `genstudio-${name}-${Date.now()}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
  toast('PNG exported');
}
function exportJPG(canvas, name) {
  const a = document.createElement('a');
  a.download = `genstudio-${name}-${Date.now()}.jpg`;
  a.href = canvas.toDataURL('image/jpeg', 0.93);
  a.click();
  toast('JPG exported');
}
function exportSVG(canvas, name) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
<image href="${canvas.toDataURL()}" width="${canvas.width}" height="${canvas.height}"/>
</svg>`;
  const a = document.createElement('a');
  a.download = `genstudio-${name}-${Date.now()}.svg`;
  a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  a.click();
  toast('SVG exported');
}

// ── Toast ─────────────────────────────────────────────────────
function toast(msg, dur = 2000) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = '> ' + msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), dur);
}

return {
  seededRng, noise2, fbm,
  hexToRgb, rgbToHex, hslToRgb, rgbToHsl, lerpHex, gradientAt,
  PALETTES, PALETTE_NAMES, getPalette, randPalette,
  SIZES, applyGrain,
  exportPNG, exportJPG, exportSVG, toast
};
})();
