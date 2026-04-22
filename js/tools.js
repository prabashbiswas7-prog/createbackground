// ═══════════════════════════════════════════════════════════════
// GenStudio — 20 Tool Renderers
// Each: { name, icon, render(canvas, ctx, p, img) }
// ═══════════════════════════════════════════════════════════════
const TOOLS = {};

// ── 1. BLOCKS ────────────────────────────────────────────────
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
    if (p.grain > 0) GS.applyGrain(cx, W, H, p.grain);
  }
};

// ── 2. GRADIENTS ─────────────────────────────────────────────
TOOLS.gradients = {
  name: 'Gradients', icon: '◑',
  render(C, cx, p) {
    const W = C.width, H = C.height;
    const pal = GS.getPalette(p.palette);
    const stops = pal.map((c, i) => [i / (pal.length - 1 || 1), c]);

    const angle = (p.angle || 0) * Math.PI / 180;
    const id = cx.createImageData(W, H);
    const d = id.data;
    const ns = p.noiseScale || 2;
    const ni = (p.noiseIntensity || 55) / 100;
    const cd = (p.curveDist || 70) / 100;
    const seed = (p.seed || 0) * 0.01;
    const gType = p.gradientType || 'Linear';
    const zoom = (p.zoom !== undefined ? p.zoom : 100) / 100;
    const ox = (p.offsetX || 0) / 100;
    const oy = (p.offsetY || 0) / 100;
    const cx_point = 0.5 + ox;
    const cy_point = 0.5 + oy;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const nx = x/W; const ny = y/H;
        let t = 0;

        if (gType === 'Linear') {
            t = ((nx - 0.5 - ox) * Math.cos(angle) + (ny - 0.5 - oy) * Math.sin(angle)) / zoom + 0.5;
        } else if (gType === 'Radial') {
            const dx = nx - cx_point;
            const dy = ny - cy_point;
            t = Math.sqrt(dx*dx + dy*dy) * 2 / zoom;
        } else if (gType === 'Conic') {
            const dx = nx - cx_point;
            const dy = ny - cy_point;
            let a = Math.atan2(dy, dx);
            if (a < 0) a += Math.PI * 2;
            a = (a - angle + Math.PI*4) % (Math.PI*2);
            t = a / (Math.PI * 2) / zoom;
        }

        const n = GS.fbm(nx*ns + seed, ny*ns + seed, p.detail||2) * ni;
        t = Math.max(0, Math.min(1, t + n * cd));
        const hex = GS.gradientAt(stops, t);
        const [r,g,b] = GS.hexToRgb(hex);
        const i = (y * W + x) * 4;
        d[i]=r; d[i+1]=g; d[i+2]=b; d[i+3]=255;
      }
    }
    cx.putImageData(id, 0, 0);

    const blendModes = {
        'Normal': 'source-over',
        'Multiply': 'multiply',
        'Screen': 'screen',
        'Overlay': 'overlay',
        'Hard Light': 'hard-light'
    };
    cx.globalCompositeOperation = blendModes[p.blendMode || 'Normal'] || 'source-over';

    if (p.depth > 0) {
      const gr = cx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.7);
      gr.addColorStop(0, `rgba(255,255,255,${p.highlights/300})`);
      gr.addColorStop(1, `rgba(0,0,0,${p.shadows/200})`);
      cx.fillStyle = gr; cx.fillRect(0, 0, W, H);
    }
    cx.shadowBlur = 0; cx.shadowOffsetX = 0; cx.shadowOffsetY = 0;
    cx.setLineDash([]); cx.shadowBlur = 0;
    if (p.grain > 0) GS.applyGrain(cx, W, H, p.grain);
  }
};

// ── 3. LINES ─────────────────────────────────────────────────
TOOLS.lines = {
  name: 'Lines', icon: '≡',
  render(C, cx, p) {
    const W = C.width, H = C.height;
    const rng = GS.seededRng(p.seed || 0);
    // background
    if (p.bgGradient) {
      const gr = cx.createLinearGradient(0, 0, W, H);
      gr.addColorStop(0, p.bg); gr.addColorStop(1, p.bg2 || p.bg);
      cx.fillStyle = gr;
    } else { cx.fillStyle = p.bg; }
    cx.fillRect(0, 0, W, H);

    const N = p.count;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1 || 1);
      const lw = p.thickness * (1 + (rng()-0.5)*(p.weightVar||0)/50);
      const alpha = 1 - (rng()*(p.opacityVar||0)/100);
      cx.globalAlpha = Math.max(0.05, alpha);
      cx.lineWidth = Math.max(0.1, lw);
      cx.lineCap = p.lineCap || 'round';
      cx.lineJoin = p.lineJoin || 'round';
      if (p.dashArray > 0) cx.setLineDash([p.dashArray, p.dashArray * 1.5]);
      else cx.setLineDash([]);
      if (p.glow > 0) {
          cx.shadowBlur = p.glow;
          cx.shadowColor = cx.strokeStyle;
      } else {
          cx.shadowBlur = 0;
      }
      cx.strokeStyle = p.colorGradient
        ? GS.gradientAt([[0,p.lineColor],[1,p.lineColor2||p.lineColor]], t)
        : p.lineColor;

      const pad = p.padding;
      cx.beginPath();
      const shape = p.shape;

      if (shape === 'Horizontal Lines') {
        const y = pad + (H - pad*2) * t;
        cx.moveTo(pad, y); cx.lineTo(W-pad, y);
      } else if (shape === 'Vertical Lines') {
        const x = pad + (W - pad*2) * t;
        cx.moveTo(x, pad); cx.lineTo(x, H-pad);
      } else if (shape === 'Sine Waves') {
        const y = pad + (H - pad*2) * t;
        cx.moveTo(pad, y);
        for (let x = pad; x <= W-pad; x += 2) {
          const wob = p.wobble > 0 ? GS.noise2(x*0.01, y*0.01) * p.wobble : 0;
          cx.lineTo(x, y + Math.sin(x * p.frequency + t*(p.colorDrift||0)*0.1) * p.amplitude + wob);
        }
      } else if (shape === 'Zigzag') {
        const y = pad + (H - pad*2) * t;
        cx.moveTo(pad, y);
        const step = Math.max(2, 30 / (p.frequency * 100 + 0.1));
        for (let x = pad; x <= W-pad; x += step) {
          cx.lineTo(x, y + (Math.round((x-pad)/step) % 2 === 0 ? 1 : -1) * p.amplitude);
        }
      } else if (shape === 'Diagonal') {
        const x = pad + (W+H)*t - H;
        cx.moveTo(x, 0); cx.lineTo(x + H, H);
      } else if (shape === 'Concentric') {
        const r = ((H - pad*2) / 2) * t;
        cx.arc(W/2, H/2, r, 0, Math.PI*2);
      } else if (shape === 'Radial') {
        const angle = t * Math.PI * 2;
        cx.moveTo(W/2, H/2);
        cx.lineTo(W/2 + Math.cos(angle)*W, H/2 + Math.sin(angle)*H);
      } else if (shape === 'Spiral') {
        const turns = 8;
        for (let a = 0, first = true; a <= turns*Math.PI*2*t; a += 0.04) {
          const r = a/(turns*Math.PI*2) * Math.min(W,H)/2;
          const xp = W/2 + Math.cos(a)*r, yp = H/2 + Math.sin(a)*r;
          first ? cx.moveTo(xp,yp) : cx.lineTo(xp,yp);
          first = false;
        }
      } else if (shape === 'Grid') {
        if (i < N/2) {
          const x = pad + (W-pad*2)*(i/(N/2));
          cx.moveTo(x, pad); cx.lineTo(x, H-pad);
        } else {
          const y = pad + (H-pad*2)*((i-N/2)/(N/2));
          cx.moveTo(pad, y); cx.lineTo(W-pad, y);
        }
      }
      cx.stroke();
    }
    cx.globalAlpha = 1;
    if (p.halftone > 0) {
      // lightweight halftone pass
      const id2 = cx.getImageData(0,0,W,H);
      const tmp = document.createElement('canvas'); tmp.width=W; tmp.height=H;
      const tc = tmp.getContext('2d');
      tc.fillStyle = p.bg; tc.fillRect(0,0,W,H);
      tc.fillStyle = p.lineColor;
      const ds = Math.max(2, p.halftone);
      for (let y2=0;y2<H;y2+=ds) for (let x2=0;x2<W;x2+=ds) {
        const pi = (y2*W+x2)*4;
        const br = (id2.data[pi]+id2.data[pi+1]+id2.data[pi+2])/(3*255);
        const r2 = ds*(1-br)*0.5;
        if (r2>0.4) { tc.beginPath(); tc.arc(x2+ds/2,y2+ds/2,r2,0,Math.PI*2); tc.fill(); }
      }
      cx.drawImage(tmp,0,0);
    }
    cx.shadowBlur = 0; cx.shadowOffsetX = 0; cx.shadowOffsetY = 0;
    cx.setLineDash([]); cx.shadowBlur = 0;
    if (p.grain > 0) GS.applyGrain(cx, W, H, p.grain);
  }
};

// ── 4. ORGANIC ───────────────────────────────────────────────
TOOLS.organic = {
  name: 'Organic', icon: '〜',
  render(C, cx, p) {
    const W = C.width, H = C.height;
    const rng = GS.seededRng(p.seed);
    cx.fillStyle = p.bg; cx.fillRect(0, 0, W, H);
    const stops = p.stops || [[0,'#00ff41'],[1,'#003a0f']];

    for (let pi2 = 0; pi2 < p.pathCount; pi2++) {
      const t = pi2 / p.pathCount;
      const col = p.colorMode === 'gradient' ? GS.gradientAt(stops, t)
        : GS.getPalette(p.palette||'Terminal')[Math.floor(rng()*5)];
      cx.strokeStyle = col;
      cx.lineWidth = p.lineWeight * (0.4 + rng() * 0.6);
      cx.globalAlpha = 0.6 + rng() * 0.4;
      cx.beginPath();

      let px = rng() * W, py = rng() * H;
      cx.moveTo(px, py);
      const steps = 60 + Math.floor(rng() * 40);
      for (let s = 0; s < steps; s++) {
        const ang = GS.fbm(px/W*p.frequency + p.seed/100, py/H*p.frequency + p.seed/100, 3) * Math.PI * 2 * p.harmonics;
        const wob = (rng()-0.5) * p.wobble * 0.5;
        const sp = (p.amplitude / steps) * 3;
        const nx = px + Math.cos(ang + wob) * sp;
        const ny = py + Math.sin(ang + wob) * sp;
        if (p.roughness > 0) {
          cx.bezierCurveTo(
            px+(rng()-0.5)*p.roughness, py+(rng()-0.5)*p.roughness,
            nx+(rng()-0.5)*p.roughness, ny+(rng()-0.5)*p.roughness,
            nx, ny
          );
        } else { cx.lineTo(nx, ny); }
        px = Math.max(0, Math.min(W, nx));
        py = Math.max(0, Math.min(H, ny));
      }
      if (p.pathType === 'Filled') { cx.closePath(); cx.fillStyle = col; cx.fill(); }
      else cx.stroke();
    }
    cx.globalAlpha = 1;
    cx.shadowBlur = 0; cx.shadowOffsetX = 0; cx.shadowOffsetY = 0;
    cx.setLineDash([]); cx.shadowBlur = 0;
    if (p.grain > 0) GS.applyGrain(cx, W, H, p.grain);
  }
};

// ── 5. PLOTTER ────────────────────────────────────────────────
TOOLS.plotter = {
  name: 'Plotter', icon: '⁙',
  render(C, cx, p) {
    const W = C.width, H = C.height;
    const rng = GS.seededRng(p.seed);
    const pal = GS.getPalette(p.palette);
    cx.fillStyle = p.bg; cx.fillRect(0, 0, W, H);
    const mx = p.margin || 40;
    const cols = p.columns, rows = p.rows;
    const cw = (W - mx*2) / cols, ch = (H - mx*2) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const n = (GS.noise2(c * (p.noiseScale||0.02) + p.seed, r * (p.noiseScale||0.02) + p.seed) + 1) / 2;
        const jx = (rng()-0.5) * cw * p.jitter;
        const jy = (rng()-0.5) * ch * p.jitter;
        const pcx = mx + c*cw + cw/2 + jx;
        const pcy = mx + r*ch + ch/2 + jy;
        let size = p.minSize + (p.maxSize - p.minSize) * n * (p.noiseIntensity||1);
        if (p.scaleJit > 0) size *= (1 + (rng() - 0.5) * (p.scaleJit / 50));
        size = Math.max(0.1, size);

        const col = pal[Math.floor(rng() * pal.length)];
        cx.strokeStyle = col; cx.fillStyle = col;
        cx.lineWidth = p.strokeWeight;
        const rot = (p.rotation + (rng()-0.5)*p.wobble + (rng()-0.5)*p.rotateJit) * Math.PI/180;
        cx.save(); cx.translate(pcx, pcy); cx.rotate(rot);
        cx.beginPath();

        let s = p.shape;
        const shapes = ['Circle','Square','Triangle','Line','Cross','Diamond','Hexagon'];
        if (p.shapeVar > 0 && rng() * 100 < p.shapeVar) {
            s = shapes[Math.floor(rng() * shapes.length)];
        }
        if (s==='Circle') cx.arc(0,0,size/2,0,Math.PI*2);
        else if (s==='Square') cx.rect(-size/2,-size/2,size,size);
        else if (s==='Triangle') { cx.moveTo(0,-size/2); cx.lineTo(size/2,size/2); cx.lineTo(-size/2,size/2); cx.closePath(); }
        else if (s==='Line') { cx.moveTo(-size/2,0); cx.lineTo(size/2,0); }
        else if (s==='Cross') { cx.moveTo(-size/2,0); cx.lineTo(size/2,0); cx.moveTo(0,-size/2); cx.lineTo(0,size/2); }
        else if (s==='Diamond') { cx.moveTo(0,-size/2); cx.lineTo(size/2,0); cx.lineTo(0,size/2); cx.lineTo(-size/2,0); cx.closePath(); }
        else if (s==='Hexagon') {
          for (let i=0;i<6;i++) { const a=i*Math.PI/3-Math.PI/6; cx.lineTo(Math.cos(a)*size/2,Math.sin(a)*size/2); }
          cx.closePath();
        }
        else cx.arc(0,0,size/2,0,Math.PI*2);
        p.filled ? cx.fill() : cx.stroke();
        cx.restore();
      }
    }
    cx.shadowBlur = 0; cx.shadowOffsetX = 0; cx.shadowOffsetY = 0;
    cx.setLineDash([]); cx.shadowBlur = 0;
    if (p.grain > 0) GS.applyGrain(cx, W, H, p.grain);
  }
};

// ── 6. TOPO ───────────────────────────────────────────────────
TOOLS.topo = {
  name: 'Topo', icon: '◎',
  render(C, cx, p) {
    const W = C.width, H = C.height;
    cx.fillStyle = p.bg; cx.fillRect(0, 0, W, H);
    cx.lineWidth = p.strokeWeight;
    const mx = p.margin;

    for (let lv = 0; lv < p.levels; lv++) {
      const t = lv / p.levels;
      const iso = t * 2 - 1;
      if (p.mode === 'Gradient') {
        cx.strokeStyle = GS.gradientAt([[0,p.bg],[1,p.lineColor]], t);
      } else if (p.mode === 'Rainbow') {
        const [r,g,b] = GS.hslToRgb(t*360, 80, 60);
        cx.strokeStyle = GS.rgbToHex(r,g,b);
      } else {
        cx.strokeStyle = p.lineColor;
      }
      cx.globalAlpha = (p.opacity||100)/100;

      // marching squares (simplified edge scan)
      const res = 160;
      const xs = (W - mx*2) / res, ys = (H - mx*2) / res;
      cx.beginPath();
      for (let xi = 0; xi < res; xi++) {
        for (let yi = 0; yi < res; yi++) {
          const x0 = mx + xi*xs, y0 = mx + yi*ys;
          const x1 = x0+xs, y1 = y0+ys;
          const fx = xi/res * (p.noiseScale||0.008) * W;
          const fy = yi/res * (p.noiseScale||0.008) * H;
          const v00 = GS.fbm(fx+p.seed/100, fy+p.seed/100, p.octaves||4);
          const v10 = GS.fbm(fx+xs/(W/(res*(p.noiseScale||0.008)*W))+p.seed/100, fy+p.seed/100, p.octaves||4);
          const v01 = GS.fbm(fx+p.seed/100, fy+ys/(H/(res*(p.noiseScale||0.008)*H))+p.seed/100, p.octaves||4);

          if ((v00 - iso) * (v10 - iso) < 0) {
            const tx = x0 + xs*(iso-v00)/(v10-v00+0.0001);
            cx.moveTo(tx, y0); cx.lineTo(tx, y0+ys*0.5);
          }
          if ((v00 - iso) * (v01 - iso) < 0) {
            const ty = y0 + ys*(iso-v00)/(v01-v00+0.0001);
            cx.moveTo(x0, ty); cx.lineTo(x0+xs*0.5, ty);
          }
        }
      }
      cx.stroke();
    }
    cx.globalAlpha = 1;
    cx.shadowBlur = 0; cx.shadowOffsetX = 0; cx.shadowOffsetY = 0;
    cx.setLineDash([]); cx.shadowBlur = 0;
    if (p.grain > 0) GS.applyGrain(cx, W, H, p.grain);
  }
};

// ── 7. MARBLE ─────────────────────────────────────────────────
TOOLS.marble = {
  name: 'Marble', icon: '◉',
  render(C, cx, p) {
    const W = C.width, H = C.height;
    const id = cx.createImageData(W, H); const d = id.data;
    const main = GS.hexToRgb(p.main || '#f0ece0');
    const low  = GS.hexToRgb(p.low  || '#c8bfab');
    const mid  = GS.hexToRgb(p.mid  || '#9b8e7a');
    const high = GS.hexToRgb(p.high || '#fff9f0');
    const ns = p.noiseScale || 1;
    const seed = (p.seed||0) * 0.01;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const fx = x/W * ns, fy = y/H * ns;
        let warp = 0;
        for (let oct = 0; oct < 3; oct++) {
          warp += GS.noise2(fx*(oct+1)+seed+p.wind*0.1, fy*(oct+1)+seed) * (p.warp||0) / (oct+1);
        }
        const v = (Math.sin((x/W + warp) * Math.PI * (p.strength||1) * 5) + 1) / 2;
        const fbv = (GS.fbm(fx + warp*(p.fbmStrength||1) + seed, fy + warp*(p.fbmDamping||1) + seed, 4) + 1) / 2;
        let t = Math.max(0, Math.min(1, (v*0.6 + fbv*0.4)));
        const cols = t < 0.33 ? [low,mid] : t < 0.66 ? [mid,main] : [main,high];
        const lt = t < 0.33 ? t*3 : t < 0.66 ? (t-0.33)*3 : (t-0.66)*3;
        const c = [0,1,2].map(j => cols[0][j] + lt*(cols[1][j]-cols[0][j]));
        const i = (y*W+x)*4;
        d[i]=Math.round(c[0]); d[i+1]=Math.round(c[1]); d[i+2]=Math.round(c[2]); d[i+3]=255;
      }
    }
    cx.putImageData(id, 0, 0);
    cx.shadowBlur = 0; cx.shadowOffsetX = 0; cx.shadowOffsetY = 0;
    cx.setLineDash([]); cx.shadowBlur = 0;
    if (p.grain > 0) GS.applyGrain(cx, W, H, p.grain);
  }
};

// ── 8. ASCII ──────────────────────────────────────────────────
TOOLS.ascii = {
  name: 'ASCII', icon: 'Aa',
  render(C, cx, p, img) {
    const W = C.width, H = C.height;
    cx.fillStyle = p.bg || '#000000'; cx.fillRect(0, 0, W, H);
    const SETS = {
      Standard: ' .:-=+*#%@',
      Dense:    ' .\'`:;!i1|l(){}[?JrftFnuvXUYCQO0Zmwqpdbkhao*#MW&8%B@$',
      Blocks:   ' ░▒▓█',
      Binary:   ' 01',
      Braille:  ' ⠂⠆⠇⠸⠹⠺⠻⠼⠽⠾⠿',
    };
    const chars = SETS[p.charSet] || SETS.Standard;
    const fs = Math.max(4, p.fontSize || 8);
    const ls = p.lineHeight || 1;
    cx.font = `${fs}px "IBM Plex Mono", monospace`;
    cx.textBaseline = 'top';

    if (img) {
      const tmp = document.createElement('canvas'); tmp.width=W; tmp.height=H;
      const tc = tmp.getContext('2d'); tc.drawImage(img, 0, 0, W, H);
      const id2 = tc.getImageData(0, 0, W, H);
      for (let y = 0; y < H; y += fs * ls) {
        for (let x = 0; x < W; x += fs * 0.6) {
          const pi = (Math.floor(y)*W + Math.floor(x)) * 4;
          const r=id2.data[pi], g=id2.data[pi+1], b=id2.data[pi+2];
          let br = (r*0.299+g*0.587+b*0.114)/255;
          br = Math.max(0,Math.min(1,(br-0.5)*(p.contrast||100)/100+0.5+(p.brightness||0)/200));
          if (p.invert) br = 1 - br;
          const ci = Math.floor(br * (chars.length-1));
          cx.fillStyle = p.matchColors ? `rgb(${r},${g},${b})` : (p.color||'#ffffff');
          cx.fillText(chars[ci] || ' ', x, y);
        }
      }
    } else {
      // pattern mode
      const rng = GS.seededRng(p.seed||0);
      for (let y = 0; y < H; y += fs * ls) {
        for (let x = 0; x < W; x += fs * 0.6) {
          const n = (GS.noise2(x/W*5 + (p.seed||0)/100, y/H*5 + (p.seed||0)/100) + 1)/2;
          const ci = Math.floor(n * chars.length);
          cx.fillStyle = p.color || '#00ff41';
          cx.fillText(chars[ci] || ' ', x, y);
        }
      }
    }
  }
};

// ── 9. DITHER ─────────────────────────────────────────────────
TOOLS.dither = {
  name: 'Dither', icon: '⣿',
  render(C, cx, p, src) {
    const W = C.width, H = C.height;
    const pal = GS.getPalette(p.palette);
    // Build source
    const tmp = document.createElement('canvas'); tmp.width=W; tmp.height=H;
    const tc = tmp.getContext('2d');
    if (src) {
      tc.drawImage(src, 0, 0, W, H);
    } else {
      const gr = tc.createLinearGradient(0,0,W,H);
      pal.forEach((c,i,a) => gr.addColorStop(i/(a.length-1), c));
      tc.fillStyle = gr; tc.fillRect(0,0,W,H);
      if (p.sourceType === 'Noise') {
        const id2 = tc.getImageData(0,0,W,H);
        for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
          const n = (GS.noise2(x/W*4+p.seed/100, y/H*4+p.seed/100)+1)/2;
          const i=(y*W+x)*4;
          id2.data[i] *= n; id2.data[i+1] *= n; id2.data[i+2] *= n;
        }
        tc.putImageData(id2,0,0);
      }
    }
    const srcData = tc.getImageData(0,0,W,H);

    // Bayer matrices
    const B4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]].map(r=>r.map(v=>v/16));
    const B8 = Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>{
      const b4val=B4[r%4][c%4]; return r<4?b4val/2:(b4val+0.5)/2;
    }));
    const mat = p.pattern==='Bayer 8x8' ? B8 : B4;
    const ms = mat.length;

    function nearest(r,g,b) {
      let best=pal[0], bd=Infinity;
      for (const col of pal) {
        const [pr,pg,pb]=GS.hexToRgb(col);
        const dist=(r-pr)**2+(g-pg)**2+(b-pb)**2;
        if (dist<bd) { bd=dist; best=col; }
      }
      return GS.hexToRgb(best);
    }

    cx.clearRect(0,0,W,H);
    cx.fillStyle=pal[0]; cx.fillRect(0,0,W,H);
    const cs = Math.max(1, p.cellSize||2);

    for (let y=0;y<H;y+=cs) {
      for (let x=0;x<W;x+=cs) {
        const i=(y*W+x)*4;
        const r=srcData.data[i]/255, g=srcData.data[i+1]/255, b=srcData.data[i+2]/255;
        const th=mat[Math.floor(y/cs)%ms][Math.floor(x/cs)%ms];
        const [nr,ng,nb]=nearest(
          Math.min(255,(r+th*0.5)*255),
          Math.min(255,(g+th*0.5)*255),
          Math.min(255,(b+th*0.5)*255)
        );
        cx.fillStyle=`rgb(${nr},${ng},${nb})`;
        if (p.shape==='Circle') {
          cx.beginPath(); cx.arc(x+cs/2,y+cs/2,cs/2,0,Math.PI*2); cx.fill();
        } else if (p.shape==='Diamond') {
          cx.beginPath(); cx.moveTo(x+cs/2,y); cx.lineTo(x+cs,y+cs/2);
          cx.lineTo(x+cs/2,y+cs); cx.lineTo(x,y+cs/2); cx.closePath(); cx.fill();
        } else {
          cx.fillRect(x,y,cs,cs);
        }
      }
    }
  }
};

// ── 10. NOISE ─────────────────────────────────────────────────
TOOLS.noise = {
  name: 'Noise', icon: '▓',
  render(C, cx, p) {
    const W = C.width, H = C.height;
    const id = cx.createImageData(W, H); const d = id.data;
    const stops = p.stops || [[0, p.c1||'#050505'],[1, p.c2||'#00ff41']];
    const seed = (p.seed||0) * 0.01;

    for (let y=0;y<H;y++) {
      for (let x=0;x<W;x++) {
        let nx = x/W*(p.scale||4)+seed, ny = y/H*(p.scale||4)+seed;
        if (p.warp > 0) {
          const wx = GS.fbm(nx+3.2, ny+1.7, 2) * p.warp;
          const wy = GS.fbm(nx+1.9, ny+4.1, 2) * p.warp;
          nx += wx; ny += wy;
        }
        let n = (GS.fbm(nx, ny, p.octaves||4) + 1) / 2;
        n = Math.max(0, Math.min(1, n));
        if (p.ridged) n = 1 - Math.abs(n*2-1);
        if (p.terraced && p.terraces > 0) n = Math.round(n*p.terraces)/p.terraces;
        const hex = GS.gradientAt(stops, n);
        const [r,g,b] = GS.hexToRgb(hex);
        const i=(y*W+x)*4; d[i]=r; d[i+1]=g; d[i+2]=b; d[i+3]=255;
      }
    }
    cx.putImageData(id, 0, 0);
    cx.shadowBlur = 0; cx.shadowOffsetX = 0; cx.shadowOffsetY = 0;
    cx.setLineDash([]); cx.shadowBlur = 0;
    if (p.grain > 0) GS.applyGrain(cx, W, H, p.grain);
  }
};

// ── 11. CIRCLES ───────────────────────────────────────────────
TOOLS.circles = {
  name: 'Circles', icon: '○',
  render(C, cx, p) {
    const W = C.width, H = C.height;
    const rng = GS.seededRng(p.seed);
    const pal = GS.getPalette(p.palette);
    cx.fillStyle = p.bg; cx.fillRect(0,0,W,H);

    if (p.type === 'Concentric') {
      const pcx2=W*(p.cx||50)/100, pcy2=H*(p.cy||50)/100;
      for (let i=p.count;i>0;i--) {
        const t=i/p.count;
        cx.beginPath(); cx.arc(pcx2,pcy2,t*Math.min(W,H)*0.48,0,Math.PI*2);
        cx.strokeStyle=pal[i%pal.length]; cx.lineWidth=p.stroke;
        cx.globalAlpha=0.4+t*0.6;
        p.filled?cx.fill():cx.stroke();
      }
    } else if (p.type === 'Random Bubble') {
      const placed=[];
      for (let i=0;i<p.count*6;i++) {
        const r=p.minR+rng()*(p.maxR-p.minR);
        const x=r+rng()*(W-r*2), y=r+rng()*(H-r*2);
        if (p.pack && placed.some(c=>Math.hypot(c.x-x,c.y-y)<c.r+r+2)) continue;
        placed.push({x,y,r,col:pal[Math.floor(rng()*pal.length)]});
        if (placed.length>=p.count) break;
      }
      placed.forEach(c=>{
        cx.beginPath(); cx.arc(c.x,c.y,c.r,0,Math.PI*2);
        cx.fillStyle=c.col; cx.strokeStyle=p.lineColor; cx.lineWidth=p.stroke;
        if(p.filled)cx.fill(); cx.stroke();
      });
    } else { // Grid
      const cols2=p.cols||8,rows2=p.rows||8;
      const cw2=W/cols2,ch2=H/rows2;
      for(let r=0;r<rows2;r++) for(let c=0;c<cols2;c++){
        const n=(GS.noise2(c*0.3+p.seed,r*0.3+p.seed)+1)/2;
        const rad=p.minR+(p.maxR-p.minR)*n;
        const t=(r*cols2+c)/(rows2*cols2);
        cx.beginPath(); cx.arc(c*cw2+cw2/2,r*ch2+ch2/2,rad,0,Math.PI*2);
        cx.fillStyle=pal[Math.floor(t*pal.length)%pal.length];
        cx.strokeStyle=p.lineColor; cx.lineWidth=p.stroke;
        if(p.filled)cx.fill(); cx.stroke();
      }
    }
    cx.globalAlpha=1;
    if(p.grain>0) GS.applyGrain(cx,W,H,p.grain);
  }
};

// ── 12. TYPOGRAPHY ────────────────────────────────────────────
TOOLS.typography = {
  name: 'Type', icon: 'T',
  render(C, cx, p) {
    const W=C.width, H=C.height;
    const rng=GS.seededRng(p.seed);
    const pal=GS.getPalette(p.palette);
    cx.fillStyle=p.bg; cx.fillRect(0,0,W,H);
    const text=(p.text||'GENSTUDIO').split('');
    const font=p.font||'IBM Plex Mono';

    if (p.type==='Scatter') {
      for(let i=0;i<p.count;i++){
        const ch=text[Math.floor(rng()*text.length)];
        const sz=p.minSize+rng()*(p.maxSize-p.minSize);
        const rot=(rng()-0.5)*p.rotation*Math.PI/180;
        cx.save(); cx.translate(rng()*W,rng()*H); cx.rotate(rot);
        cx.font=`${p.weight||'bold'} ${sz}px ${font}`;
        cx.fillStyle=pal[Math.floor(rng()*pal.length)];
        cx.globalAlpha=0.25+rng()*0.75;
        cx.fillText(ch,0,0); cx.restore();
      }
    } else if (p.type==='Stack') {
      let y=p.maxSize;
      while(y<H+p.maxSize){
        let x=0;
        const sz=p.minSize+rng()*(p.maxSize-p.minSize);
        cx.font=`${p.weight||'bold'} ${sz}px ${font}`;
        cx.fillStyle=pal[Math.floor(rng()*pal.length)];
        cx.globalAlpha=0.4+rng()*0.6;
        while(x<W){
          const ch=text[Math.floor(rng()*text.length)];
          cx.fillText(ch,x,y);
          x+=cx.measureText(ch).width+(p.spacing||2);
        }
        y+=sz*(p.lineHeight||1.2);
      }
    } else {
      const sz=Math.min(W,H)*0.14;
      cx.font=`bold ${sz}px ${font}`;
      cx.textAlign='center'; cx.textBaseline='middle';
      cx.fillStyle=pal[0]; cx.globalAlpha=1;
      if(p.glow>0){cx.shadowBlur=p.glow;cx.shadowColor=pal[1]||pal[0];}
      cx.fillText(text.join(''),W/2,H/2);
      cx.shadowBlur=0;
    }
    cx.globalAlpha=1;
    if(p.grain>0) GS.applyGrain(cx,W,H,p.grain);
  }
};

// ── 13. WAVES ─────────────────────────────────────────────────
TOOLS.waves = {
  name: 'Waves', icon: '≈',
  render(C, cx, p) {
    const W=C.width, H=C.height;
    cx.fillStyle=p.bg; cx.fillRect(0,0,W,H);
    const stops=p.stops||[[0,p.c1||'#0e4d68'],[1,p.c2||'#64dfb8']];
    const N=p.layers||12;
    for(let i=0;i<N;i++){
      const t=i/(N-1||1);
      const yBase=H*t + H*(p.offset||0)/100;
      const amp=(p.amplitude||60)*(1-t*0.2);
      const freq=(p.frequency||2)*(1+t*(p.harmonics||3)*0.1);
      const phase=(p.phase||0)*Math.PI/180+t*Math.PI;
      const col=GS.gradientAt(stops,t);
      cx.beginPath(); cx.moveTo(0,H);
      for(let x=0;x<=W;x+=2){
        const nv=p.noise>0?GS.noise2(x/W*4+(p.seed||0)/100,t*2)*p.noise*amp:0;
        const y=yBase+Math.sin(x/W*Math.PI*2*freq+phase)*amp
                     +Math.sin(x/W*Math.PI*2*freq*(p.harmonics||3)+phase*2)*amp*0.25+nv;
        cx.lineTo(x,y);
      }
      cx.lineTo(W,H); cx.closePath();
      cx.fillStyle=col; cx.globalAlpha=(p.opacity||70)/100*(0.35+t*0.65);
      cx.fill();
    }
    cx.globalAlpha=1;
    if(p.grain>0) GS.applyGrain(cx,W,H,p.grain);
  }
};

// ── 14. VORONOI ───────────────────────────────────────────────
TOOLS.voronoi = {
  name: 'Voronoi', icon: '⬡',
  render(C, cx, p) {
    const W=C.width, H=C.height;
    const rng=GS.seededRng(p.seed);
    const pal=GS.getPalette(p.palette);
    const pts=[];
    for(let i=0;i<p.count;i++){
      pts.push({x:rng()*W,y:rng()*H,col:pal[Math.floor(rng()*pal.length)]});
    }
    const id=cx.createImageData(W,H); const d=id.data;
    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        let best=Infinity, bc=pts[0];
        for(const pt of pts){
          const dist = p.metric==='Manhattan' ? Math.abs(x-pt.x)+Math.abs(y-pt.y)
            : p.metric==='Chebyshev' ? Math.max(Math.abs(x-pt.x),Math.abs(y-pt.y))
            : (x-pt.x)**2+(y-pt.y)**2;
          if(dist<best){best=dist;bc=pt;}
        }
        const [r,g,b]=GS.hexToRgb(bc.col);
        const i2=(y*W+x)*4; d[i2]=r;d[i2+1]=g;d[i2+2]=b;d[i2+3]=255;
      }
    }
    cx.putImageData(id,0,0);
    if(p.drawEdges){
      const edgeCol=GS.hexToRgb(p.edgeColor||'#000000');
      const out=cx.getImageData(0,0,W,H);
      for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){
        const i2=(y*W+x)*4;
        const neighbors=[(y-1)*W+x,(y+1)*W+x,y*W+x-1,y*W+x+1];
        if(neighbors.some(n=>out.data[n*4]!==out.data[i2]||out.data[n*4+1]!==out.data[i2+1])){
          out.data[i2]=edgeCol[0];out.data[i2+1]=edgeCol[1];out.data[i2+2]=edgeCol[2];
        }
      }
      cx.putImageData(out,0,0);
    }
    if(p.grain>0) GS.applyGrain(cx,W,H,p.grain);
  }
};

// ── 15. FRACTAL ───────────────────────────────────────────────
TOOLS.fractal = {
  name: 'Fractal', icon: '✦',
  render(C, cx, p) {
    const W=C.width, H=C.height;
    const id=cx.createImageData(W,H); const d=id.data;
    const pal=GS.getPalette(p.palette);
    const maxIter=p.iterations||80;
    const zoom=Math.max(0.001,p.zoom||1);
    const gradStops=pal.map((c,i,a)=>[i/(a.length-1||1),c]);

    for(let py=0;py<H;py++){
      for(let px=0;px<W;px++){
        const c0r=(px-W/2)/(W/4*zoom)+(p.cx||-0.5);
        const c0i=(py-H/2)/(H/4*zoom)+(p.cy||0);
        let zr=p.type==='Julia'?c0r:0;
        let zi=p.type==='Julia'?c0i:0;
        const cr=p.type==='Julia'?(p.juliaC||-0.7):c0r;
        const ci2=p.type==='Julia'?(p.juliaCi||0.27):c0i;
        let iter=0;
        while(iter<maxIter){
          if(p.type==='Burning Ship'){
            const nr=zr*zr-zi*zi+cr;
            const ni2=2*Math.abs(zr*zi)+ci2;
            zr=nr;zi=ni2;
          } else {
            const nr=zr*zr-zi*zi+cr;
            const ni2=2*zr*zi+ci2;
            zr=nr;zi=ni2;
          }
          if(zr*zr+zi*zi>4)break;
          iter++;
        }
        const t=iter===maxIter?0:(p.colorCycles||1)>0?((iter/maxIter*(p.colorCycles||1))%1):iter/maxIter;
        const [r,g,b]=GS.hexToRgb(GS.gradientAt(gradStops,t));
        const i2=(py*W+px)*4; d[i2]=r;d[i2+1]=g;d[i2+2]=b;d[i2+3]=255;
      }
    }
    cx.putImageData(id,0,0);
  }
};

// ── 16. PIXEL SORT ────────────────────────────────────────────
TOOLS.pixelSort = {
  name: 'Pixel Sort', icon: '▦',
  render(C, cx, p, src) {
    const W=C.width, H=C.height;
    if(!src){
      const pal=GS.getPalette(p.palette);
      const gr=cx.createLinearGradient(0,0,W,H);
      pal.forEach((c,i,a)=>gr.addColorStop(i/(a.length-1||1),c));
      cx.fillStyle=gr; cx.fillRect(0,0,W,H);
      GS.applyGrain(cx,W,H,25);
    } else { cx.drawImage(src,0,0,W,H); }

    const id=cx.getImageData(0,0,W,H); const d=id.data;
    const thresh=p.threshold/100;
    function brightness(i){return(d[i]+d[i+1]+d[i+2])/(3*255);}

    if(p.direction==='Horizontal'||p.direction==='Both'){
      for(let y=0;y<H;y++){
        let start=-1;
        for(let x=0;x<=W;x++){
          const b=x<W?brightness((y*W+x)*4):1;
          if(start===-1&&b>thresh) start=x;
          else if(start>-1&&(b<=thresh||x===W)){
            const seg=[];
            for(let s=start;s<x;s++) seg.push({r:d[(y*W+s)*4],g:d[(y*W+s)*4+1],b:d[(y*W+s)*4+2],bright:brightness((y*W+s)*4)});
            const sorted=p.sortBy==='Hue'?
              seg.sort((a,b2)=>GS.rgbToHsl(a.r,a.g,a.b)[0]-GS.rgbToHsl(b2.r,b2.g,b2.b)[0]):
              seg.sort((a,b2)=>a.bright-b2.bright);
            sorted.forEach((px2,i2)=>{const idx=(y*W+start+i2)*4;d[idx]=px2.r;d[idx+1]=px2.g;d[idx+2]=px2.b;});
            start=-1;
          }
        }
      }
    }
    if(p.direction==='Vertical'||p.direction==='Both'){
      for(let x=0;x<W;x++){
        let start=-1;
        for(let y=0;y<=H;y++){
          const b=y<H?brightness((y*W+x)*4):1;
          if(start===-1&&b>thresh) start=y;
          else if(start>-1&&(b<=thresh||y===H)){
            const seg=[];
            for(let s=start;s<y;s++) seg.push({r:d[(s*W+x)*4],g:d[(s*W+x)*4+1],b:d[(s*W+x)*4+2],bright:brightness((s*W+x)*4)});
            seg.sort((a,b2)=>a.bright-b2.bright);
            seg.forEach((px2,i2)=>{const idx=((start+i2)*W+x)*4;d[idx]=px2.r;d[idx+1]=px2.g;d[idx+2]=px2.b;});
            start=-1;
          }
        }
      }
    }
    cx.putImageData(id,0,0);
  }
};

// ── 17. TRUCHET ───────────────────────────────────────────────
TOOLS.truchet = {
  name: 'Truchet', icon: '⊕',
  render(C, cx, p) {
    const W=C.width, H=C.height;
    const rng=GS.seededRng(p.seed);
    const pal=GS.getPalette(p.palette);
    cx.fillStyle=p.bg||pal[0]; cx.fillRect(0,0,W,H);
    const ts=p.tileSize||40;
    const cols=Math.ceil(W/ts)+1, rows=Math.ceil(H/ts)+1;

    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const x=c*ts-(W%ts)/2, y=r*ts-(H%ts)/2;
        const flip=rng()<0.5;
        const c1=pal[Math.floor(rng()*pal.length)];
        const c2=p.twoColor?pal[Math.floor(rng()*pal.length)]:c1;
        cx.save(); cx.beginPath(); cx.rect(x,y,ts,ts); cx.clip();
        cx.lineWidth=p.stroke; cx.strokeStyle=c1;
        if(p.type==='Classic'){
          cx.beginPath();
          if(flip){cx.arc(x,y,ts/2,0,Math.PI/2);cx.arc(x+ts,y+ts,ts/2,Math.PI,Math.PI*3/2);}
          else{cx.arc(x+ts,y,ts/2,Math.PI/2,Math.PI);cx.arc(x,y+ts,ts/2,Math.PI*3/2,Math.PI*2);}
          cx.stroke();
        } else if(p.type==='Diagonal'){
          cx.beginPath();
          flip?cx.moveTo(x,y):cx.moveTo(x+ts,y);
          flip?cx.lineTo(x+ts,y+ts):cx.lineTo(x,y+ts);
          cx.stroke();
        } else if(p.type==='SquareCurve'){
          cx.fillStyle=c2;
          cx.fillRect(flip?x:x+ts/2,flip?y:y+ts/2,ts/2,ts/2);
        } else if(p.type==='Triangle'){
          cx.fillStyle=c2; cx.beginPath();
          if(flip){cx.moveTo(x,y);cx.lineTo(x+ts,y);cx.lineTo(x,y+ts);}
          else{cx.moveTo(x+ts,y);cx.lineTo(x+ts,y+ts);cx.lineTo(x,y+ts);}
          cx.closePath(); cx.fill();
        }
        cx.restore();
      }
    }
    if(p.grain>0) GS.applyGrain(cx,W,H,p.grain);
  }
};

// ── 18. CRYSTAL ───────────────────────────────────────────────
TOOLS.crystal = {
  name: 'Crystal', icon: '◈',
  render(C, cx, p) {
    const W=C.width, H=C.height;
    const rng=GS.seededRng(p.seed);
    const pal=GS.getPalette(p.palette);
    cx.fillStyle=p.bg; cx.fillRect(0,0,W,H);
    const cols2=p.cols||12, rows2=p.rows||12;
    const cw2=W/cols2, ch2=H/rows2;

    // Build jittered grid points
    const pts=[];
    for(let r=0;r<=rows2+1;r++) for(let c=0;c<=cols2+1;c++){
      pts.push({
        x: c*cw2+(rng()-0.5)*cw2*(p.jitter||60)/100,
        y: r*ch2+(rng()-0.5)*ch2*(p.jitter||60)/100
      });
    }
    const W2=cols2+2;
    for(let r=0;r<=rows2;r++) for(let c=0;c<=cols2;c++){
      const i=r*W2+c;
      const a=pts[i],b=pts[i+1],cc=pts[i+W2],dd=pts[i+W2+1];
      [[a,b,cc],[b,cc,dd]].forEach(([p1,p2,p3])=>{
        const mcx=(p1.x+p2.x+p3.x)/3, mcy=(p1.y+p2.y+p3.y)/3;
        const n=(GS.noise2(mcx/W*3+p.seed,mcy/H*3+p.seed)+1)/2;
        const col=pal[Math.floor(n*pal.length)%pal.length];
        cx.beginPath(); cx.moveTo(p1.x,p1.y); cx.lineTo(p2.x,p2.y); cx.lineTo(p3.x,p3.y);
        cx.closePath(); cx.fillStyle=col; cx.fill();
        if(p.stroke>0){cx.strokeStyle=p.lineColor||'rgba(0,0,0,0.2)';cx.lineWidth=p.stroke;cx.stroke();}
      });
    }
    if(p.grain>0) GS.applyGrain(cx,W,H,p.grain);
  }
};

// ── 19. SPIROGRAPH ────────────────────────────────────────────
TOOLS.spirograph = {
  name: 'Spirograph', icon: '❋',
  render(C, cx, p) {
    const W=C.width, H=C.height;
    cx.fillStyle=p.bg||'#000000'; cx.fillRect(0,0,W,H);
    const stops=[[0,p.c1||'#00ff41'],[0.5,p.c2||'#003a0f'],[1,p.c3||'#00ff41']];
    const pcx2=W/2, pcy2=H/2;
    const R=Math.min(p.R||300,Math.min(W,H)*0.48);
    const r=Math.min(p.r||113,R-1);
    const d=p.d||80;
    const steps=p.steps||4000;
    cx.lineWidth=p.stroke||1;

    let prevX=null, prevY=null;
    for(let i=0;i<=steps;i++){
      const t=i/steps*Math.PI*2*(p.loops||15);
      const x=pcx2+(R-r)*Math.cos(t)+d*Math.cos((R-r)/Math.max(1,r)*t);
      const y=pcy2+(R-r)*Math.sin(t)-d*Math.sin((R-r)/Math.max(1,r)*t);
      if(prevX!==null){
        cx.beginPath(); cx.moveTo(prevX,prevY); cx.lineTo(x,y);
        cx.strokeStyle=GS.gradientAt(stops,i/steps);
        cx.stroke();
      }
      prevX=x; prevY=y;
    }
    if(p.grain>0) GS.applyGrain(cx,W,H,p.grain);
  }
};

// ── 20. FLOW FIELD ────────────────────────────────────────────
TOOLS.flowField = {
  name: 'Flow Field', icon: '⟳',
  render(C, cx, p) {
    const W=C.width, H=C.height;
    cx.fillStyle=p.bg; cx.fillRect(0,0,W,H);
    const rng=GS.seededRng(p.seed);
    const pal=GS.getPalette(p.palette);
    const N=Math.min(p.count||500, 3000);
    const particles=Array.from({length:N},()=>({
      x:rng()*W, y:rng()*H, age:0,
      maxAge:p.life+Math.floor(rng()*p.life),
      col:pal[Math.floor(rng()*pal.length)]
    }));

    cx.lineWidth=p.weight||1;
    const sc=p.scale||3, seed=(p.seed||0)/100;
    const spd=p.speed||2, curl=p.curl||1;

    for(let step=0;step<(p.steps||150);step++){
      for(const pt of particles){
        if(pt.age>=pt.maxAge){ pt.x=rng()*W; pt.y=rng()*H; pt.age=0; continue; }
        const angle=GS.fbm(pt.x/W*sc+seed, pt.y/H*sc+seed, p.octaves||2)*Math.PI*2*curl;
        const nx=pt.x+Math.cos(angle)*spd, ny=pt.y+Math.sin(angle)*spd;
        cx.globalAlpha=(1-pt.age/pt.maxAge)*(p.opacity||40)/100;
        cx.strokeStyle=pt.col;
        cx.beginPath(); cx.moveTo(pt.x,pt.y); cx.lineTo(nx,ny); cx.stroke();
        pt.x=((nx%W)+W)%W; pt.y=((ny%H)+H)%H; pt.age++;
      }
    }
    cx.globalAlpha=1;
    if(p.grain>0) GS.applyGrain(cx,W,H,p.grain);
  }
};

// ── 21. SPACE ─────────────────────────────────────────────────
TOOLS.space = {
  name: 'Space', icon: '✨',
  render(C, cx, p) {
    const W = C.width, H = C.height;
    const rng = GS.seededRng(p.seed);
    const pal = GS.getPalette(p.palette);

    // Background gradient for deep space
    const bgGrad = cx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H));
    bgGrad.addColorStop(0, p.bg1 || '#0a0a2a');
    bgGrad.addColorStop(1, p.bg2 || '#000000');
    cx.fillStyle = bgGrad;
    cx.fillRect(0, 0, W, H);

    // Nebula (FBM Noise)
    if (p.nebula > 0) {
      const id = cx.getImageData(0, 0, W, H);
      const d = id.data;
      const ns = p.nebulaScale || 2;
      const c1 = GS.hexToRgb(pal[0]);
      const c2 = GS.hexToRgb(pal[Math.min(1, pal.length - 1)]);
      const intensity = p.nebula / 100;

      for(let y=0; y<H; y++) {
        for(let x=0; x<W; x++) {
          const nx = x/W * ns;
          const ny = y/H * ns;
          let n = (GS.fbm(nx + p.seed, ny + p.seed, 4) + 1) / 2;
          n = Math.pow(n, 1.5) * intensity;

          const i = (y*W+x)*4;
          d[i] = Math.min(255, d[i] + (c1[0] * n + c2[0] * n * 0.5));
          d[i+1] = Math.min(255, d[i+1] + (c1[1] * n + c2[1] * n * 0.5));
          d[i+2] = Math.min(255, d[i+2] + (c1[2] * n + c2[2] * n * 0.5));
        }
      }
      cx.putImageData(id, 0, 0);
    }

    // Stars
    const starCount = p.stars || 1000;
    for (let i = 0; i < starCount; i++) {
      const x = rng() * W;
      const y = rng() * H;
      const r = rng() * rng() * (p.starSize || 2) + 0.5;
      const alpha = 0.3 + rng() * 0.7;

      cx.beginPath();
      cx.arc(x, y, r, 0, Math.PI * 2);

      // Star colors
      let col = '#ffffff';
      const colRand = rng();
      if (colRand > 0.95) col = pal[Math.floor(rng() * pal.length)];
      else if (colRand > 0.8) col = '#aaddff';
      else if (colRand > 0.7) col = '#ffddaa';

      cx.fillStyle = col;
      cx.globalAlpha = alpha;

      if (rng() > 0.9 && p.glow > 0) {
        cx.shadowBlur = p.glow;
        cx.shadowColor = col;
      } else {
        cx.shadowBlur = 0;
      }

      cx.fill();
    }

    cx.shadowBlur = 0;
    cx.globalAlpha = 1;
    if (p.grain > 0) GS.applyGrain(cx, W, H, p.grain);
  }
};

// ── 22. NATURE ────────────────────────────────────────────────
TOOLS.nature = {
  name: 'Nature', icon: '⛰',
  render(C, cx, p) {
    const W = C.width, H = C.height;
    const rng = GS.seededRng(p.seed);
    const pal = GS.getPalette(p.palette);

    // Sky
    const skyGrad = cx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, p.skyTop || '#87CEEB');
    skyGrad.addColorStop(1, p.skyBottom || '#E0F6FF');
    cx.fillStyle = skyGrad;
    cx.fillRect(0, 0, W, H);

    // Sun/Moon
    if (p.sunSize > 0) {
      const sx = W * (p.sunX || 0.5);
      const sy = H * (p.sunY || 0.3);
      cx.beginPath();
      cx.arc(sx, sy, p.sunSize, 0, Math.PI*2);
      cx.fillStyle = p.sunColor || '#FFD700';
      if (p.sunGlow > 0) {
          cx.shadowBlur = p.sunGlow;
          cx.shadowColor = cx.fillStyle;
      }
      cx.fill();
      cx.shadowBlur = 0;
    }

    // Mountains
    const layers = p.layers || 3;
    for (let l = 0; l < layers; l++) {
      const t = l / (layers - 1 || 1); // 0 to 1

      // Color based on depth (atmospheric perspective)
      let c1 = GS.hexToRgb(pal[l % pal.length]);
      let skyC = GS.hexToRgb(p.skyBottom || '#E0F6FF');

      // Mix mountain color with sky color based on depth
      const mix = 1 - t; // Further mountains (t=0) have more sky color
      const r = Math.round(c1[0] * t + skyC[0] * mix);
      const g = Math.round(c1[1] * t + skyC[1] * mix);
      const b = Math.round(c1[2] * t + skyC[2] * mix);

      cx.fillStyle = `rgb(${r},${g},${b})`;

      const baseY = H * (0.4 + t * 0.4);
      const amp = (p.amplitude || 100) * (1 - t * 0.3);
      const freq = (p.frequency || 3) * (1 + t);

      cx.beginPath();
      cx.moveTo(0, H);

      for (let x = 0; x <= W; x += 5) {
        const nx = x / W * freq;
        // Combine low freq and high freq noise for rugged mountains
        const n1 = GS.fbm(nx + l * 10 + p.seed, l + p.seed, 3);
        const y = baseY + n1 * amp;
        cx.lineTo(x, y);
      }

      cx.lineTo(W, H);
      cx.closePath();
      cx.fill();

      // Optional Trees on the closest layer
      if (l === layers - 1 && p.trees > 0) {
         cx.fillStyle = '#1a3a1a'; // Dark green
         for (let i = 0; i < p.trees; i++) {
             const tx = rng() * W;
             const nx = tx / W * freq;
             const n1 = GS.fbm(nx + l * 10 + p.seed, l + p.seed, 3);
             const ty = baseY + n1 * amp;

             const th = 10 + rng() * 30;
             const tw = th * 0.4;

             cx.beginPath();
             cx.moveTo(tx, ty);
             cx.lineTo(tx - tw/2, ty + th);
             cx.lineTo(tx + tw/2, ty + th);
             cx.closePath();
             cx.fill();
         }
      }
    }

    if (p.grain > 0) GS.applyGrain(cx, W, H, p.grain);
  }
};

// ── 23. CLOUDS ────────────────────────────────────────────────
TOOLS.clouds = {
  name: 'Clouds', icon: '☁',
  render(C, cx, p) {
    const W = C.width, H = C.height;

    // Base sky
    const skyGrad = cx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, p.bg1 || '#4A90E2');
    skyGrad.addColorStop(1, p.bg2 || '#87CEEB');
    cx.fillStyle = skyGrad;
    cx.fillRect(0, 0, W, H);

    const id = cx.getImageData(0, 0, W, H);
    const d = id.data;

    const scale = p.scale || 3;
    const octaves = p.octaves || 5;
    const cover = (p.cover || 50) / 100; // 0 to 1
    const sharpness = p.sharpness || 0.9;

    const c1 = GS.hexToRgb(p.cloudColor || '#ffffff');
    const c2 = GS.hexToRgb(p.shadowColor || '#aaccff');

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const nx = x / W * scale;
        const ny = y / H * scale;

        // FBM for cloud density
        let n = (GS.fbm(nx + p.seed, ny + p.seed, octaves) + 1) / 2;

        // Cloud mapping
        let v = Math.max(0, n - (1 - cover));
        v = Math.pow(v, sharpness) * 2;
        v = Math.min(1, v);

        if (v > 0) {
            // Fake lighting / shading based on noise derivative
            const dy = (GS.fbm(nx + p.seed, ny + 0.01 + p.seed, octaves) + 1) / 2;
            const shadow = Math.max(0, n - dy) * 5;

            const r = c1[0] * (1 - shadow) + c2[0] * shadow;
            const g = c1[1] * (1 - shadow) + c2[1] * shadow;
            const b = c1[2] * (1 - shadow) + c2[2] * shadow;

            const i = (y * W + x) * 4;
            // Alpha blend
            d[i] = r * v + d[i] * (1 - v);
            d[i+1] = g * v + d[i+1] * (1 - v);
            d[i+2] = b * v + d[i+2] * (1 - v);
        }
      }
    }
    cx.putImageData(id, 0, 0);

    if (p.grain > 0) GS.applyGrain(cx, W, H, p.grain);
  }
};

// ── 24. PAINT ─────────────────────────────────────────────────
TOOLS.paint = {
  name: 'Paint', icon: '🖌',
  render(C, cx, p) {
    const W = C.width, H = C.height;
    const rng = GS.seededRng(p.seed);
    const pal = GS.getPalette(p.palette);

    cx.fillStyle = p.bg || '#f0f0f0';
    cx.fillRect(0, 0, W, H);

    const strokes = p.strokes || 1000;

    for (let i = 0; i < strokes; i++) {
        const x = rng() * W;
        const y = rng() * H;

        // Direction based on flow field
        const angle = GS.fbm(x/W * (p.scale || 2) + p.seed, y/H * (p.scale || 2) + p.seed, 2) * Math.PI * 2 * (p.curl || 1);

        const len = p.length * (0.5 + rng() * 0.5);
        const thick = p.thickness * (0.5 + rng() * 1.5);

        const cIdx = Math.floor(rng() * pal.length);
        cx.fillStyle = pal[cIdx];

        cx.save();
        cx.translate(x, y);
        cx.rotate(angle);

        cx.globalAlpha = (p.opacity || 80) / 100;

        // Brush stroke shape
        cx.beginPath();
        cx.ellipse(0, 0, len/2, thick/2, 0, 0, Math.PI * 2);
        cx.fill();

        // Bristle details
        if (p.bristles > 0) {
            cx.fillStyle = 'rgba(0,0,0,0.1)';
            for(let b=0; b<p.bristles; b++) {
                const bx = (rng() - 0.5) * len;
                const by = (rng() - 0.5) * thick;
                cx.fillRect(bx, by, len * rng() * 0.5, 1);
            }
        }

        cx.restore();
    }

    cx.globalAlpha = 1;
    if (p.grain > 0) GS.applyGrain(cx, W, H, p.grain);
  }
};

// ── 25. MATRIX ────────────────────────────────────────────────
TOOLS.matrix = {
  name: 'Matrix', icon: '01',
  render(C, cx, p) {
    const W = C.width, H = C.height;
    const rng = GS.seededRng(p.seed);

    cx.fillStyle = p.bg || '#000000';
    cx.fillRect(0, 0, W, H);

    const fs = Math.max(8, p.fontSize || 16);
    cx.font = `${fs}px "IBM Plex Mono", monospace`;
    cx.textBaseline = 'top';

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
    const cols = Math.floor(W / fs);

    for (let i = 0; i < cols; i++) {
        const x = i * fs;

        // Column properties based on noise/seed
        const n = GS.noise2(i * 0.1, p.seed);
        const startY = (n * H * 2) - H; // Start position
        const speed = (p.speed || 1) * (0.5 + Math.abs(GS.noise2(i * 0.2, p.seed+1)));
        const length = Math.floor((p.length || 20) * (0.5 + Math.abs(GS.noise2(i * 0.3, p.seed+2))));

        // Animate based on "time" (we use a phase offset parameter)
        const timeOffset = (p.time || 0) * speed * fs;
        let headY = (startY + timeOffset) % (H + length * fs);
        if (headY < 0) headY += (H + length * fs);

        for (let j = 0; j < length; j++) {
            const y = headY - j * fs;
            if (y < -fs || y > H) continue;

            const charIdx = Math.floor(rng() * chars.length);
            const char = chars[charIdx];

            // Brightness fades out
            const ratio = 1 - (j / length);

            if (j === 0) {
                cx.fillStyle = p.headColor || '#ffffff';
                if (p.glow > 0) {
                    cx.shadowBlur = p.glow;
                    cx.shadowColor = p.headColor;
                }
            } else {
                // Main color with fading opacity
                const rgb = GS.hexToRgb(p.tailColor || '#00ff41');
                cx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${ratio})`;
                cx.shadowBlur = 0;
            }

            cx.fillText(char, x, y);
        }
    }

    cx.shadowBlur = 0;
    if (p.grain > 0) GS.applyGrain(cx, W, H, p.grain);
  }
};
