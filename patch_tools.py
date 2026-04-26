import re

with open('js/tools.js', 'r') as f:
    content = f.read()

search = """// ── 1. BLOCKS ────────────────────────────────────────────────
TOOLS.blocks = {
  name: 'Blocks', icon: '⊞',
  render(C, cx, p) {
    const W = C.width, H = C.height;
    const rng = GS.seededRng(p.seed);
    const pal = GS.getPalette(p.palette);
    cx.fillStyle = p.bg; cx.fillRect(0, 0, W, H);

    const rects = [];
    const minS = p.minSize || 24;
    function split(x, y, w, h, depth) {
      if (depth <= 0 || w < minS * 2 || h < minS * 2) { rects.push([x,y,w,h]); return; }
      const sb = (p.splitBias !== undefined ? p.splitBias : 50) / 100;
      const doH = p.type === 'Columns' ? false : p.type === 'Rows' ? true : rng() < sb;
      const f = 0.25 + rng() * 0.5 + (rng() - 0.5) * (p.asymmetry / 200);
      const prob = Math.min(0.95, p.complexity / 10);
      if (rng() > prob) { rects.push([x,y,w,h]); return; }
      if (doH) {
        const cut = Math.max(minS, Math.min(h - minS, h * f));
        split(x, y, w, cut, depth - 1);
        split(x, y + cut, w, h - cut, depth - 1);
      } else {
        const cut = Math.max(minS, Math.min(w - minS, w * f));
        split(x, y, cut, h, depth - 1);
        split(x + cut, y, w - cut, h, depth - 1);
      }
    }
    split(0, 0, W, H, p.count);

    cx.globalAlpha = (p.opacity !== undefined ? p.opacity : 100) / 100;

    rects.forEach(([rx, ry, rw, rh]) => {
      const pad = p.padding || 0;
      rx += pad / 2; ry += pad / 2;
      rw -= pad; rh -= pad;
      if (rw <= 0 || rh <= 0) return;

      const useCol = rng() * 100 < p.density;
      cx.fillStyle = useCol ? pal[Math.floor(rng() * pal.length)] : p.bg;
      if (p.wobble > 0) {
        const wo = p.wobble * 0.25;
        cx.beginPath();
        cx.moveTo(rx + (rng()-0.5)*wo, ry + (rng()-0.5)*wo);
        cx.lineTo(rx+rw + (rng()-0.5)*wo, ry + (rng()-0.5)*wo);
        cx.lineTo(rx+rw + (rng()-0.5)*wo, ry+rh + (rng()-0.5)*wo);
        cx.lineTo(rx + (rng()-0.5)*wo, ry+rh + (rng()-0.5)*wo);
        cx.closePath(); cx.fill();
      } else if (p.rounding > 0) {
        cx.beginPath();
        cx.roundRect(rx, ry, rw, rh, p.rounding);
        cx.fill();
      } else {
        cx.fillRect(rx, ry, rw, rh);
      }
      if (p.stroke > 0) {
        cx.strokeStyle = p.lineColor;
        cx.lineWidth = p.stroke;
        if (p.wobble == 0 && p.rounding > 0) {
            cx.stroke();
        } else {
            cx.strokeRect(rx + p.stroke/2, ry + p.stroke/2, rw - p.stroke, rh - p.stroke);
        }
      }
    });
    cx.globalAlpha = 1.0;
    cx.shadowBlur = 0; cx.shadowOffsetX = 0; cx.shadowOffsetY = 0;
    cx.setLineDash([]); cx.shadowBlur = 0;
    GS.applyPostFX(cx, W, H, p);
  }
};"""


replace = """// ── 1. BLOCKS ────────────────────────────────────────────────
TOOLS.blocks = {
  name: 'Blocks', icon: '⊞',
  render(C, cx, p) {
    const W = C.width, H = C.height;
    const rng = GS.seededRng(p.seed);
    const pal = GS.getPalette(p.palette);
    cx.fillStyle = p.bg; cx.fillRect(0, 0, W, H);

    const rects = [];
    const minS = p.minSize || 24;
    function split(x, y, w, h, depth) {
      if (depth <= 0 || w < minS * 2 || h < minS * 2) { rects.push([x,y,w,h]); return; }
      const sb = (p.splitBias !== undefined ? p.splitBias : 50) / 100;
      const doH = p.type === 'Columns' ? false : p.type === 'Rows' ? true : rng() < sb;
      const f = 0.25 + rng() * 0.5 + (rng() - 0.5) * (p.asymmetry / 200);
      const prob = Math.min(0.95, p.complexity / 10);
      if (rng() > prob) { rects.push([x,y,w,h]); return; }
      if (doH) {
        const cut = Math.max(minS, Math.min(h - minS, h * f));
        split(x, y, w, cut, depth - 1);
        split(x, y + cut, w, h - cut, depth - 1);
      } else {
        const cut = Math.max(minS, Math.min(w - minS, w * f));
        split(x, y, cut, h, depth - 1);
        split(x + cut, y, w - cut, h, depth - 1);
      }
    }

    // We expand the split area to ensure rotation covers corners
    const maxDim = Math.sqrt(W*W + H*H);
    const expX = (W - maxDim) / 2;
    const expY = (H - maxDim) / 2;
    split(expX, expY, maxDim, maxDim, p.count);

    cx.globalAlpha = (p.opacity !== undefined ? p.opacity : 100) / 100;

    // Setup rotation
    cx.save();
    cx.translate(W/2, H/2);
    cx.rotate((p.rotation || 0) * Math.PI / 180);
    cx.translate(-W/2, -H/2);

    rects.forEach(([rx, ry, rw, rh]) => {
      // Sparsity check
      if ((p.sparsity || 0) > 0 && rng() * 100 < p.sparsity) return;

      const pad = p.padding || 0;
      rx += pad / 2; ry += pad / 2;
      rw -= pad; rh -= pad;
      if (rw <= 0 || rh <= 0) return;

      const useCol = rng() * 100 < p.density;
      const baseColor = useCol ? pal[Math.floor(rng() * pal.length)] : p.bg;

      cx.save();

      // Jitter rotation per block
      if ((p.rotationJitter || 0) > 0) {
        const jitterAmt = (p.rotationJitter * Math.PI / 180);
        const rot = (rng() - 0.5) * jitterAmt;
        cx.translate(rx + rw/2, ry + rh/2);
        cx.rotate(rot);
        cx.translate(-(rx + rw/2), -(ry + rh/2));
      }

      // Setup Shadows
      if ((p.shadowIntensity || 0) > 0 && (p.shadowBlur > 0 || Math.abs(p.shadowX) > 0 || Math.abs(p.shadowY) > 0)) {
         cx.shadowColor = `rgba(0,0,0,${p.shadowIntensity / 100})`;
         cx.shadowBlur = p.shadowBlur;
         // Adjust shadow offsets to compensate for global rotation so they fall uniformly
         const rad = -(p.rotation || 0) * Math.PI / 180;
         cx.shadowOffsetX = p.shadowX * Math.cos(rad) - p.shadowY * Math.sin(rad);
         cx.shadowOffsetY = p.shadowX * Math.sin(rad) + p.shadowY * Math.cos(rad);
      } else {
         cx.shadowColor = 'transparent';
      }

      // Check for Gradient or Pattern fill
      const doGrad = rng() * 100 < (p.gradientChance || 0);
      const doPat = rng() * 100 < (p.patternChance || 0);

      if (doGrad && useCol) {
          const g = cx.createLinearGradient(rx, ry, rx+rw, ry+rh);
          g.addColorStop(0, pal[Math.floor(rng() * pal.length)]);
          g.addColorStop(1, pal[Math.floor(rng() * pal.length)]);
          cx.fillStyle = g;
      } else if (doPat && useCol) {
          // create a quick pattern canvas
          const pcv = document.createElement('canvas');
          pcv.width = 10; pcv.height = 10;
          const px = pcv.getContext('2d');
          px.fillStyle = p.bg; px.fillRect(0,0,10,10);
          px.strokeStyle = baseColor; px.lineWidth = 1;
          px.beginPath();
          if (rng() > 0.5) { // diagonal lines
              px.moveTo(0,0); px.lineTo(10,10);
              px.moveTo(-5,5); px.lineTo(5,15);
              px.moveTo(5,-5); px.lineTo(15,5);
          } else { // dots
              px.arc(5,5, 2, 0, Math.PI*2);
              px.fillStyle = baseColor; px.fill();
          }
          px.stroke();
          cx.fillStyle = cx.createPattern(pcv, 'repeat');
      } else {
          cx.fillStyle = baseColor;
      }

      // Draw Base Shape
      const drawShape = (ox, oy, ow, oh) => {
          if (p.wobble > 0) {
            const wo = p.wobble * 0.25;
            cx.beginPath();
            cx.moveTo(ox + (rng()-0.5)*wo, oy + (rng()-0.5)*wo);
            cx.lineTo(ox+ow + (rng()-0.5)*wo, oy + (rng()-0.5)*wo);
            cx.lineTo(ox+ow + (rng()-0.5)*wo, oy+oh + (rng()-0.5)*wo);
            cx.lineTo(ox + (rng()-0.5)*wo, oy+oh + (rng()-0.5)*wo);
            cx.closePath(); cx.fill();
          } else if (p.rounding > 0) {
            cx.beginPath();
            cx.roundRect(ox, oy, ow, oh, p.rounding);
            cx.fill();
          } else {
            cx.fillRect(ox, oy, ow, oh);
          }
      };

      drawShape(rx, ry, rw, rh);

      // Clear shadow for strokes and inner shapes
      cx.shadowColor = 'transparent';

      // Inner Shapes
      const inners = p.innerShapes || 0;
      if (inners > 0) {
         for (let i=1; i<=inners; i++) {
             const ioff = i * (Math.min(rw, rh) / (inners * 2 + 2));
             const iw = rw - ioff*2;
             const ih = rh - ioff*2;
             if (iw > 0 && ih > 0) {
                 cx.fillStyle = pal[Math.floor(rng() * pal.length)];
                 drawShape(rx+ioff, ry+ioff, iw, ih);
             }
         }
      }

      // Stroke
      if (p.stroke > 0) {
        cx.strokeStyle = p.lineColor;
        cx.lineWidth = p.stroke;
        if (p.wobble == 0 && p.rounding > 0) {
            cx.stroke();
        } else if (p.wobble > 0) {
            cx.stroke(); // stroke the already drawn wobbly path
        } else {
            cx.strokeRect(rx + p.stroke/2, ry + p.stroke/2, rw - p.stroke, rh - p.stroke);
        }
      }

      cx.restore();
    });

    cx.restore();

    cx.globalAlpha = 1.0;
    cx.shadowBlur = 0; cx.shadowOffsetX = 0; cx.shadowOffsetY = 0;
    cx.setLineDash([]); cx.shadowBlur = 0;
    GS.applyPostFX(cx, W, H, p);
  }
};"""

if search in content:
    content = content.replace(search, replace)
    with open('js/tools.js', 'w') as f:
        f.write(content)
    print("Patch applied successfully.")
else:
    print("Search string not found.")
