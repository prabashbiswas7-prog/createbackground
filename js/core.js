// ── GenStudio Core ──────────────────────────────────────────────
const GS = (() => {

// ── Noise (Simplex, fast) ─────────────────────────────────────
const _perm = (() => {
  const p = Array.from({length:256},(_,i)=>i);
  for(let i=255;i>0;i--){const j=Math.floor(Math.random()*(i+1));[p[i],p[j]]=[p[j],p[i]];}
  return [...p,...p];
})();
let _seedOffset = 0;

function seededRandom(seed) {
  let s = seed ^ 0xDEADBEEF;
  return () => {
    s = (Math.imul(s^(s>>>16),0x45d9f3b)|0);
    s = (Math.imul(s^(s>>>16),0x45d9f3b)|0);
    return ((s>>>0)/4294967296);
  };
}

function noise2d(x, y) {
  const F2=0.5*(Math.sqrt(3)-1), G2=(3-Math.sqrt(3))/6;
  const s=(x+y)*F2, i=Math.floor(x+s), j=Math.floor(y+s);
  const t=(i+j)*G2, X0=i-t, Y0=j-t;
  const x0=x-X0, y0=y-Y0;
  const i1=x0>y0?1:0, j1=x0>y0?0:1;
  const x1=x0-i1+G2, y1=y0-j1+G2;
  const x2=x0-1+2*G2, y2=y0-1+2*G2;
  const ii=i&255, jj=j&255;
  const gi0=_perm[ii+_perm[jj]]%12;
  const gi1=_perm[ii+i1+_perm[jj+j1]]%12;
  const gi2=_perm[ii+1+_perm[jj+1]]%12;
  const grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
  let n=0;
  let t0=0.5-x0*x0-y0*y0;
  if(t0>=0){t0*=t0;n+=t0*t0*(grad3[gi0][0]*x0+grad3[gi0][1]*y0);}
  let t1=0.5-x1*x1-y1*y1;
  if(t1>=0){t1*=t1;n+=t1*t1*(grad3[gi1][0]*x1+grad3[gi1][1]*y1);}
  let t2=0.5-x2*x2-y2*y2;
  if(t2>=0){t2*=t2;n+=t2*t2*(grad3[gi2][0]*x2+grad3[gi2][1]*y2);}
  return 70*n;
}

function fbm(x, y, octaves=4, lacunarity=2, gain=0.5) {
  let v=0, amp=0.5, freq=1, max=0;
  for(let i=0;i<octaves;i++){v+=amp*noise2d(x*freq,y*freq);max+=amp;amp*=gain;freq*=lacunarity;}
  return v/max;
}

// ── Color Utilities ───────────────────────────────────────────
function hexToRgb(hex) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return [r,g,b];
}
function rgbToHex(r,g,b) {
  return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
}
function hslToRgb(h,s,l) {
  s/=100;l/=100;
  const a=s*Math.min(l,1-l);
  const f=n=>{const k=(n+h/30)%12;return l-a*Math.max(Math.min(k-3,9-k,1),-1);};
  return [Math.round(f(0)*255),Math.round(f(8)*255),Math.round(f(4)*255)];
}
function rgbToHsl(r,g,b) {
  r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2;
  if(max===min) return [0,0,Math.round(l*100)];
  const d=max-min, s=l>0.5?d/(2-max-min):d/(max+min);
  let h=max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4;
  return [Math.round(h*60),Math.round(s*100),Math.round(l*100)];
}
function lerpColor(a,b,t) {
  const [r1,g1,b1]=hexToRgb(a),[r2,g2,b2]=hexToRgb(b);
  return rgbToHex(r1+(r2-r1)*t,g1+(g2-g1)*t,b1+(b2-b1)*t);
}
function colorAtGradient(stops, t) {
  t=Math.max(0,Math.min(1,t));
  for(let i=1;i<stops.length;i++){
    const [p0,c0]=stops[i-1],[p1,c1]=stops[i];
    if(t<=p1){return lerpColor(c0,c1,(t-p0)/(p1-p0));}
  }
  return stops[stops.length-1][1];
}

// ── Palettes ─────────────────────────────────────────────────
const PALETTES = {
  'Mondrian':    ['#ffffff','#f5c518','#d62626','#1a3a8f','#111111'],
  'Purple Dream':['#1a0533','#4a1080','#7c5cfc','#c084fc','#f5d0fe'],
  'Ocean':       ['#0f1c2e','#0e4d68','#1a9e8c','#64dfb8','#cffafe'],
  'Sunset':      ['#1a0520','#6d1042','#d4483a','#f4a261','#ffecd2'],
  'Neon':        ['#0d0d0d','#ff0090','#00ffcc','#ffe600','#7700ff'],
  'Earth':       ['#1a0f00','#4a3012','#8b5e2e','#c9956a','#e8d5b7'],
  'Pastel':      ['#fbe4f4','#c8e6f4','#c8f4e4','#f4f0c8','#f4d4c8'],
  'Brutalist':   ['#000000','#ff3300','#ffffff','#ffff00','#0033ff'],
  'Grayscale':   ['#000000','#404040','#808080','#c0c0c0','#ffffff'],
  'Game Boy':    ['#0f380f','#306230','#8bac0f','#9bbc0f'],
  'CGA':         ['#000000','#0000aa','#00aa00','#00aaaa','#aa0000','#aa00aa','#aa5500','#aaaaaa'],
  'Botanical':   ['#1a2e1a','#2d5a27','#52a65e','#a8d5a2','#e8f5e9'],
  'Lava':        ['#0d0000','#5c0a00','#c0280a','#ff6a00','#ffe066'],
  'Nordic':      ['#1b2735','#2c3e50','#4a6fa5','#9bb0c1','#ecf0f1'],
  'Retro':       ['#2b0a3d','#7b1fa2','#e91e63','#ff9800','#ffeb3b'],
  'Ink':         ['#f5f0e8','#d4c5a9','#8b7355','#4a3728','#1a0f0a'],
  'Arctic':      ['#e8f4f8','#b8dce8','#6ab4d0','#2979a0','#0d3f5c'],
  'Forest':      ['#0a1a0a','#1e4620','#2e7d32','#66bb6a','#c8e6c9'],
  'Copper':      ['#1a0a00','#5c2e00','#a0522d','#cd853f','#f5deb3'],
  'Cyberpunk':   ['#0d0d1a','#1a0033','#ff00ff','#00ffff','#ffff00'],
};

function getPalette(name) { return PALETTES[name] || PALETTES['Mondrian']; }
function randomPalette() { const k=Object.keys(PALETTES); return k[Math.floor(Math.random()*k.length)]; }

// ── Canvas Sizes ─────────────────────────────────────────────
const SIZES = {
  'Square 1:1':     [800,800],
  'Landscape 4:3':  [1066,800],
  'Portrait 3:4':   [800,1066],
  'Wide 16:9':      [1280,720],
  'Portrait 9:16':  [720,1280],
  'A4':             [794,1123],
  'Twitter':        [1200,675],
  'Instagram':      [1080,1080],
  'Story':          [1080,1920],
};

// ── DOM helpers ──────────────────────────────────────────────
function $(sel,ctx=document){return ctx.querySelector(sel);}
function $$(sel,ctx=document){return [...ctx.querySelectorAll(sel)];}

function slider(id, onChange) {
  const el=document.getElementById(id);
  if(!el)return;
  const val=el.parentElement?.querySelector('.ctrl-val')||el.closest('.ctrl')?.querySelector('.ctrl-val');
  el.addEventListener('input',()=>{ if(val)val.textContent=el.value; onChange(parseFloat(el.value)); });
  if(val)val.textContent=el.value;
}
function on(id,ev,fn){const el=document.getElementById(id);if(el)el.addEventListener(ev,fn);}
function sel(id,fn){const el=document.getElementById(id);if(el)el.addEventListener('change',()=>fn(el.value));}
function tog(id,fn){
  const el=document.getElementById(id);
  if(!el)return;
  el.addEventListener('click',()=>{el.classList.toggle('on');fn(el.classList.contains('on'));});
}
function val(id){const el=document.getElementById(id);return el?el.value:null;}
function numVal(id){const el=document.getElementById(id);return el?parseFloat(el.value):0;}
function boolVal(id){const el=document.getElementById(id);return el?el.classList.contains('on'):false;}

function toast(msg, dur=2200) {
  const t=document.createElement('div');
  t.className='toast'; t.textContent=msg;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(()=>t.remove(),dur);
}

// ── Export ────────────────────────────────────────────────────
function exportPNG(canvas, filename='genstudio') {
  const link=document.createElement('a');
  link.download=`${filename}-${Date.now()}.png`;
  link.href=canvas.toDataURL('image/png');
  link.click();
  toast('PNG exported ✓');
}
function exportSVG(svgEl, filename='genstudio') {
  const s=new XMLSerializer().serializeToString(svgEl);
  const blob=new Blob([s],{type:'image/svg+xml'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.download=`${filename}-${Date.now()}.svg`;
  link.href=url; link.click();
  URL.revokeObjectURL(url);
  toast('SVG exported ✓');
}
function exportJPG(canvas, filename='genstudio', q=0.92) {
  const link=document.createElement('a');
  link.download=`${filename}-${Date.now()}.jpg`;
  link.href=canvas.toDataURL('image/jpeg',q);
  link.click();
  toast('JPG exported ✓');
}

// ── Offscreen render helper ───────────────────────────────────
function makeCanvas(w,h) {
  const c=document.createElement('canvas');
  c.width=w; c.height=h; return c;
}

// ── Web Worker runner ─────────────────────────────────────────
function runWorker(src, data, onDone, onProgress) {
  const blob=new Blob([src],{type:'application/javascript'});
  const url=URL.createObjectURL(blob);
  const w=new Worker(url);
  w.onmessage=(e)=>{
    if(e.data.type==='done'){onDone(e.data);URL.revokeObjectURL(url);w.terminate();}
    else if(e.data.type==='progress'&&onProgress){onProgress(e.data.pct);}
  };
  w.postMessage(data);
  return w;
}

// ── Section collapse ─────────────────────────────────────────
function initSections(container) {
  container.querySelectorAll('.section-header').forEach(h=>{
    h.addEventListener('click',()=>h.closest('.section').classList.toggle('collapsed'));
  });
}

// ── Canvas size picker ────────────────────────────────────────
function initSizePicker(containerId, onChange) {
  const c=document.getElementById(containerId);
  if(!c)return;
  c.querySelectorAll('.size-pill').forEach(pill=>{
    pill.addEventListener('click',()=>{
      c.querySelectorAll('.size-pill').forEach(p=>p.classList.remove('active'));
      pill.classList.add('active');
      const name=pill.dataset.size;
      if(name==='custom'){
        document.getElementById('custom-w')&&onChange(
          parseInt(document.getElementById('custom-w').value)||800,
          parseInt(document.getElementById('custom-h').value)||800
        );
      } else {
        const [w,h]=SIZES[name]||[800,800];
        onChange(w,h);
      }
    });
  });
}

// ── Grain effect on canvas ────────────────────────────────────
function applyGrain(ctx, w, h, amount) {
  if(amount<=0)return;
  const id=ctx.getImageData(0,0,w,h);
  const d=id.data;
  for(let i=0;i<d.length;i+=4){
    const n=(Math.random()-0.5)*amount*2.55;
    d[i]+=n; d[i+1]+=n; d[i+2]+=n;
  }
  ctx.putImageData(id,0,0);
}

// ── Halftone ─────────────────────────────────────────────────
function applyHalftone(ctx, w, h, dotSize, fg='#000000') {
  if(dotSize<=0)return;
  const id=ctx.getImageData(0,0,w,h);
  const tmp=document.createElement('canvas'); tmp.width=w; tmp.height=h;
  const t=tmp.getContext('2d');
  t.fillStyle='#ffffff'; t.fillRect(0,0,w,h);
  t.fillStyle=fg;
  for(let y=0;y<h;y+=dotSize){
    for(let x=0;x<w;x+=dotSize){
      const i=(y*w+x)*4;
      const brightness=(id.data[i]+id.data[i+1]+id.data[i+2])/3/255;
      const r=dotSize*(1-brightness)*0.5;
      if(r>0.5){
        t.beginPath(); t.arc(x+dotSize/2,y+dotSize/2,r,0,Math.PI*2);
        t.fill();
      }
    }
  }
  ctx.drawImage(tmp,0,0);
}

return {noise2d,fbm,seededRandom,hexToRgb,rgbToHex,hslToRgb,rgbToHsl,lerpColor,
  colorAtGradient,PALETTES,SIZES,getPalette,randomPalette,
  $,$$ ,slider,on,sel,tog,val,numVal,boolVal,toast,
  exportPNG,exportSVG,exportJPG,makeCanvas,runWorker,
  initSections,initSizePicker,applyGrain,applyHalftone};
})();
