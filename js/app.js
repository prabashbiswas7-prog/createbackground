// ═══════════════════════════════════════════════════════════════
// GenStudio App — UI, state, rendering
// ═══════════════════════════════════════════════════════════════
const App = (() => {

const TOOL_ORDER = [
  'blocks','gradients','lines','organic','plotter','topo','marble',
  'ascii','dither','noise','circles','typography','waves','voronoi',
  'fractal','pixelSort','truchet','crystal','spirograph','flowField',
  'space','nature','clouds','paint','matrix'
];

// ── Default params ────────────────────────────────────────────
const DEFAULTS = {
  blocks:    { w:1200,h:1200,seed:42,type:'Mondrian',count:10,complexity:4,asymmetry:50,bg:'#ffffff',palette:'Mondrian',density:40,stroke:2,lineColor:'#111111',wobble:40,minSize:24,padding:0,rounding:0,opacity:100,splitBias:50 },
  gradients: { w:1200,h:1200,seed:0,angle:45,noiseScale:2,noiseIntensity:55,curveDist:70,detail:2,depth:60,highlights:50,shadows:55,brightness:0,contrast:100,saturation:100,palette:'Purple Dream',gradientType:'Linear',zoom:100,offsetX:0,offsetY:0,blendMode:'Normal' },
  lines:     { w:1200,h:1200,seed:42,shape:'Sine Waves',frequency:0.026,amplitude:68,count:40,padding:50,thickness:1.5,bg:'#0a0a0f',bg2:'#1a0a3a',lineColor:'#00ff41',lineColor2:'#003a0f',colorGradient:true,bgGradient:false,weightVar:0,wobble:0,opacityVar:0,rotationJitter:0,colorDrift:0,freqVar:0,halftone:0,dashArray:0,glow:0,lineCap:'round',lineJoin:'round' },
  organic:   { w:1200,h:1200,seed:35025,pathType:'Waves',pathCount:51,lineWeight:34,amplitude:55,frequency:0.056,harmonics:3,wobble:12,roughness:12,colorMode:'gradient',bg:'#050505',palette:'Terminal',shadowBlur:0,shadowX:0,shadowY:0,scale:100,stops:[[0,'#00ff41'],[0.5,'#003a0f'],[1,'#00ff41']] },
  plotter:   { w:1200,h:1200,seed:12345,type:'Dot Grid',columns:20,rows:20,jitter:0,shape:'Circle',minSize:4,maxSize:24,strokeWeight:1,filled:true,rotation:0,wobble:0,noiseScale:0.02,noiseIntensity:1,palette:'Terminal',bg:'#050505',margin:40,shapeVar:0,rotateJit:0,scaleJit:0 },
  topo:      { w:1200,h:1200,seed:12345,levels:20,noiseScale:0.008,octaves:4,falloff:0.5,strokeWeight:1.5,wobble:0,smoothing:50,bg:'#050505',mode:'Single',lineColor:'#00ff41',opacity:100,margin:20 },
  marble:    { w:1200,h:1200,seed:0,noiseScale:1,wind:0,warp:0,fbmStrength:1,fbmDamping:1,main:'#f0ece0',low:'#c8bfab',mid:'#9b8e7a',high:'#fff9f0',strength:1 },
  ascii:     { w:1200,h:1200,seed:0,fontSize:8,letterSpacing:0,lineHeight:1,charSet:'Standard',matchColors:false,bg:'#000000',color:'#00ff41',contrast:100,brightness:0,invert:false },
  dither:    { w:1200,h:1200,seed:0,palette:'Game Boy',sourceType:'Gradient',pattern:'Bayer 4x4',shape:'Square',cellSize:2 },
  noise:     { w:1200,h:1200,seed:0,scale:4,octaves:4,warp:0,ridged:false,terraced:false,terraces:8,c1:'#050505',c2:'#00ff41',stops:[[0,'#050505'],[0.5,'#003a0f'],[1,'#00ff41']] },
  circles:   { w:1200,h:1200,seed:0,type:'Concentric',count:20,cx:50,cy:50,minR:8,maxR:60,palette:'Terminal',bg:'#050505',lineColor:'rgba(0,255,65,0.3)',stroke:1,filled:false,pack:true,rows:8,cols:8 },
  typography:{ w:1200,h:1200,seed:0,text:'GENSTUDIO',type:'Scatter',font:'IBM Plex Mono',weight:'bold',count:200,minSize:10,maxSize:80,rotation:360,spacing:2,lineHeight:1.2,glow:0,palette:'Terminal',bg:'#050505' },
  waves:     { w:1200,h:1200,seed:0,layers:12,amplitude:60,frequency:2,harmonics:3,phase:0,offset:0,noise:0,opacity:70,bg:'#0f1c2e',c1:'#0e4d68',c2:'#64dfb8',stops:[[0,'#0e4d68'],[0.5,'#1a9e8c'],[1,'#64dfb8']] },
  voronoi:   { w:1200,h:1200,seed:0,count:40,palette:'Terminal',metric:'Euclidean',drawEdges:true,edgeColor:'#000000' },
  fractal:   { w:1200,h:1200,type:'Mandelbrot',cx:-0.5,cy:0,zoom:1,iterations:80,juliaC:-0.7,juliaCi:0.27,colorCycles:1,palette:'Cyberpunk' },
  pixelSort: { w:1200,h:1200,seed:0,direction:'Horizontal',threshold:50,sortBy:'Brightness',palette:'Terminal' },
  truchet:   { w:1200,h:1200,seed:0,type:'Classic',tileSize:40,stroke:2,palette:'Mondrian',bg:'#ffffff',twoColor:true },
  crystal:   { w:1200,h:1200,seed:0,cols:12,rows:12,jitter:60,palette:'Terminal',bg:'#050505',lineColor:'rgba(0,255,65,0.15)',stroke:0.5 },
  spirograph:{ w:1200,h:1200,bg:'#050505',R:300,r:113,d:80,loops:15,steps:4000,stroke:1,c1:'#00ff41',c2:'#003a0f',c3:'#7affaa' },
  flowField: { w:1200,h:1200,seed:0,count:500,life:80,steps:150,speed:2,scale:3,octaves:2,curl:1,weight:1,opacity:40,palette:'Terminal',bg:'#050505' },
  space:     { w:1200,h:1200,seed:42,stars:2000,starSize:2,glow:20,nebula:50,nebulaScale:2,palette:'Cyberpunk',bg1:'#0a0a2a',bg2:'#000000' },
  nature:    { w:1200,h:1200,seed:123,layers:4,amplitude:150,frequency:2,skyTop:'#87CEEB',skyBottom:'#E0F6FF',sunSize:60,sunX:0.7,sunY:0.3,sunColor:'#FFD700',sunGlow:50,trees:100,palette:'Forest' },
  clouds:    { w:1200,h:1200,seed:42,scale:3,octaves:5,cover:50,sharpness:0.9,bg1:'#4A90E2',bg2:'#87CEEB',cloudColor:'#ffffff',shadowColor:'#aaccff' },
  paint:     { w:1200,h:1200,seed:42,strokes:1500,length:80,thickness:30,scale:2,curl:1,opacity:80,bristles:20,palette:'Mondrian',bg:'#f0f0f0' },
  matrix:    { w:1200,h:1200,seed:42,fontSize:20,speed:1,length:25,time:0,headColor:'#ffffff',tailColor:'#00ff41',bg:'#000000',glow:10 },
};

// ── State ─────────────────────────────────────────────────────
let canvas, ctx;
let current = 'blocks';
let params = {};
window.params = params;
window.current_tool = () => current;
window.globalFX = { blur: 0, vignette: 0, smoothness: 0, grain: 0 };
let renderTimer = null;
let loadedImage = null;

// Deep clone defaults
function resetParams(tool) {
  params[tool] = JSON.parse(JSON.stringify(DEFAULTS[tool] || {}));
}
TOOL_ORDER.forEach(t => resetParams(t));

// ── Sidebar HTML builders ─────────────────────────────────────
function R(id, name, val, min, max, step, suffix='') {
  const display = typeof val === 'number' ? (Number.isInteger(step) ? val : parseFloat(val).toFixed(step < 0.01 ? 3 : step < 0.1 ? 2 : 1)) : val;
  return `<div class="ctrl">
    <div class="ctrl-row"><span class="ctrl-lbl">${name}</span><span class="ctrl-v" id="v_${id}">${display}${suffix}</span></div>
    <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}">
  </div>`;
}
function S(id, name, opts, val) {
  const opts2 = opts.map(o => `<option value="${o}"${o===val?' selected':''}>${o}</option>`).join('');
  return `<div class="ctrl"><div class="ctrl-row"><span class="ctrl-lbl">${name}</span></div><select id="${id}">${opts2}</select></div>`;
}
function PAL(p, id="palette", name="Palette") {
  return S(id, name, PAL_OPTS, p[id]) + (p[id] === "Custom" ? C2("custom1","C1",p.custom1||"#ff0000") + C2("custom2","C2",p.custom2||"#00ff00") + C2("custom3","C3",p.custom3||"#0000ff") + C2("custom4","C4",p.custom4||"#ffff00") + C2("custom5","C5",p.custom5||"#00ffff") : "");
}
function C2(id, name, val) {
  return `<div class="color-row"><span class="color-lbl">${name}</span><div class="color-swatch" style="background:${val||'#000'}"><input type="color" id="${id}" value="${val||'#000000'}"></div></div>`;
}
function T(id, name, val) {
  return `<div class="tog-row"><span class="tog-lbl">${name}</span><button class="tog${val?' on':''}" id="${id}"></button></div>`;
}
function SEC(title, body, open=true) {
  return `<div class="sec${open?'':' closed'}"><div class="sec-hdr"><span class="sec-title">${title}</span><span class="sec-arrow">▾</span></div><div class="sec-body">${body}</div></div>`;
}
function CANVAS_SEC(p) {
  const snames = Object.keys(GS.SIZES);
  const pills = snames.map(n => {
    const [w,h]=GS.SIZES[n];
    const active = p.w===w&&p.h===h;
    return `<button class="size-pill${active?' active':''}" data-size="${n}">${n}</button>`;
  }).join('');
  return SEC('Canvas', `<div class="size-grid">${pills}</div>
<div class="custom-size">
  <input type="number" id="cw" value="${p.w}" min="200" max="4096" style="width:70px">
  <span>×</span>
  <input type="number" id="ch" value="${p.h}" min="200" max="4096" style="width:70px">
</div>`);
}
const PAL_OPTS = GS.PALETTE_NAMES;

function buildPanel(tool) {
  const p = params[tool];
  const panels = {
    blocks: SEC('Color',
        C2('bg','Background',p.bg) +
        PAL(p) +
        R('density','Color Density',p.density,0,100,1) +
        C2('lineColor','Border Color',p.lineColor)
        + R('opacity','Opacity',p.opacity,0,100,1)
      ) +
      SEC('Pattern',
        R('seed','Seed',p.seed,0,9999,1) +
        S('type','Type',['Mondrian','Columns','Rows','Grid'],p.type) +
        R('count','Depth',p.count,2,20,1) +
        R('complexity','Split Chance',p.complexity,1,10,0.1) +
        R('asymmetry','Asymmetry',p.asymmetry,0,100,1)
        + R('minSize','Min Size',p.minSize,10,200,1)
        + R('padding','Padding',p.padding,0,50,1)
        + R('splitBias','Split Bias',p.splitBias,0,100,1)
      ) +
      SEC('Stroke',
        R('stroke','Line Weight',p.stroke,0,20,0.5) +
        R('wobble','Edge Wobble',p.wobble,0,100,1)
        + R('rounding','Corner Rounding',p.rounding,0,100,1)
      ) +
      CANVAS_SEC(p),

    gradients: SEC('Color',
        PAL(p) +
        S('gradientType','Type',['Linear','Radial','Conic'],p.gradientType) +
        S('blendMode','Blend Mode',['Normal','Multiply','Screen','Overlay','Hard Light'],p.blendMode)
      ) +
      SEC('Flow',
        R('seed','Seed',p.seed,0,9999,1) +
        R('angle','Angle',p.angle,0,360,1,'°') +
        R('zoom','Zoom',p.zoom,10,300,1,'%') +
        R('offsetX','Offset X',p.offsetX,-100,100,1,'%') +
        R('offsetY','Offset Y',p.offsetY,-100,100,1,'%') +
        R('noiseScale','Noise Scale',p.noiseScale,0.1,12,0.1) +
        R('noiseIntensity','Intensity',p.noiseIntensity,0,100,1) +
        R('curveDist','Curve Distortion',p.curveDist,0,100,1) +
        R('detail','Detail',p.detail,1,8,1)
      ) +
      SEC('Depth & Light',
        R('depth','Depth',p.depth,0,100,1) +
        R('highlights','Highlights',p.highlights,0,100,1) +
        R('shadows','Shadows',p.shadows,0,100,1)
      ) +
      SEC('Adjustments',

        R('brightness','Brightness',p.brightness,-100,100,1) +
        R('contrast','Contrast',p.contrast,50,200,1) +
        R('saturation','Saturation',p.saturation,0,200,1)
      ) +
      CANVAS_SEC(p),

    lines: SEC('Background',
        T('bgGradient','Gradient BG',p.bgGradient) +
        C2('bg','BG Color 1',p.bg) +
        C2('bg2','BG Color 2',p.bg2||p.bg)
      ) +
      SEC('Color',
        T('colorGradient','Gradient Lines',p.colorGradient) +
        C2('lineColor','Line Color',p.lineColor) +
        C2('lineColor2','Color 2',p.lineColor2||p.lineColor)
      ) +
      SEC('Shape',
        S('shape','Shape',['Sine Waves','Horizontal Lines','Vertical Lines','Zigzag','Diagonal','Concentric','Radial','Spiral','Grid'],p.shape) +
        R('frequency','Frequency',p.frequency,0.001,0.3,0.001) +
        R('amplitude','Amplitude',p.amplitude,0,300,1) +
        R('count','Count',p.count,1,300,1) +
        R('padding','Padding',p.padding,0,200,1) +
        R('thickness','Thickness',p.thickness,0.1,20,0.1) +
        R('dashArray','Dashes',p.dashArray,0,100,1) +
        S('lineCap','Line Cap',['butt','round','square'],p.lineCap) +
        S('lineJoin','Line Join',['miter','round','bevel'],p.lineJoin) +
        R('seed','Seed',p.seed,0,9999,1)
      ) +
      SEC('Effects',
        R('halftone','Halftone',p.halftone,0,30,1) +
        R('glow','Glow',p.glow,0,50,1)
      ) +
      SEC('Variation',
        R('weightVar','Weight Var',p.weightVar,0,100,1) +
        R('wobble','Wobble',p.wobble,0,100,1) +
        R('opacityVar','Opacity Var',p.opacityVar,0,100,1) +
        R('rotationJitter','Rotation Jitter',p.rotationJitter,0,45,0.5,'°') +
        R('colorDrift','Color Drift',p.colorDrift,0,100,1)
      ) +
      CANVAS_SEC(p),

    organic: SEC('Color',
        C2('bg','Background',p.bg) +
        S('colorMode','Mode',['gradient','palette'],p.colorMode) +
        PAL(p)
      ) +
      SEC('Paths',
        R('seed','Seed',p.seed,0,99999,1) +
        S('pathType','Type',['Waves','Filled','Curl','Strand'],p.pathType) +
        R('pathCount','Path Count',p.pathCount,1,200,1) +
        R('lineWeight','Line Weight',p.lineWeight,0.1,80,0.5) +
        R('scale','Scale',p.scale,10,300,1,'%')
      ) +
      SEC('Algorithm',
        R('amplitude','Amplitude',p.amplitude,1,300,1) +
        R('frequency','Frequency',p.frequency,0.005,0.5,0.005) +
        R('harmonics','Harmonics',p.harmonics,1,8,1) +
        R('wobble','Wobble',p.wobble,0,100,1) +
        R('roughness','Roughness',p.roughness,0,100,1)
      ) +
      SEC('Shadow',
        R('shadowBlur','Shadow Blur',p.shadowBlur,0,100,1) +
        R('shadowX','Shadow X',p.shadowX,-100,100,1) +
        R('shadowY','Shadow Y',p.shadowY,-100,100,1)
      ) +
      CANVAS_SEC(p),

    plotter: SEC('Color',
        C2('bg','Background',p.bg) +
        PAL(p)
      ) +
      SEC('Grid',
        R('seed','Seed',p.seed,0,99999,1) +
        S('type','Type',['Dot Grid','Random','Hexagonal'],p.type) +
        R('columns','Columns',p.columns,2,80,1) +
        R('rows','Rows',p.rows,2,80,1) +
        R('jitter','Jitter',p.jitter,0,1,0.01) +
        R('margin','Margin',p.margin,0,200,1)
      ) +
      SEC('Shape',
        S('shape','Shape',['Circle','Square','Triangle','Line','Cross','Diamond','Hexagon'],p.shape) +
        R('shapeVar','Shape Mix',p.shapeVar,0,100,1) +
        R('minSize','Min Size',p.minSize,1,80,1) +
        R('maxSize','Max Size',p.maxSize,1,150,1) +
        R('strokeWeight','Stroke',p.strokeWeight,0.1,10,0.1) +
        T('filled','Filled',p.filled) +
        R('rotation','Rotation',p.rotation,0,360,1,'°') +
        R('wobble','Wobble',p.wobble,0,180,1,'°') +
        R('rotateJit','Rotation Jitter',p.rotateJit,0,180,1,'°') +
        R('scaleJit','Scale Jitter',p.scaleJit,0,100,1,'%')
      ) +
      SEC('Noise',
        R('noiseScale','Scale',p.noiseScale,0.001,0.1,0.001) +
        R('noiseIntensity','Intensity',p.noiseIntensity,0,3,0.05)
      ) +
      CANVAS_SEC(p),

    topo: SEC('Color',
        C2('bg','Background',p.bg) +
        S('mode','Mode',['Single','Gradient','Rainbow'],p.mode) +
        C2('lineColor','Line Color',p.lineColor) +
        R('opacity','Opacity',p.opacity,10,100,1,'%')
      ) +
      SEC('Terrain',
        R('seed','Seed',p.seed,0,99999,1) +
        R('levels','Contour Levels',p.levels,2,80,1) +
        R('noiseScale','Scale',p.noiseScale,0.001,0.05,0.001) +
        R('octaves','Octaves',p.octaves,1,8,1) +
        R('falloff','Falloff',p.falloff,0.1,2,0.05)
      ) +
      SEC('Stroke',
        R('strokeWeight','Weight',p.strokeWeight,0.1,12,0.1) +
        R('wobble','Wobble',p.wobble,0,50,1)
      ) +
      SEC('Effects',

        R('margin','Margin',p.margin,0,100,1)
      ) +
      CANVAS_SEC(p),

    marble: SEC('Colors',
        C2('main','Main',p.main) + C2('low','Low',p.low) +
        C2('mid','Mid',p.mid) + C2('high','High',p.high)
      ) +
      SEC('Fluid',
        R('seed','Seed',p.seed,0,9999,1) +
        R('noiseScale','Scale',p.noiseScale,0.1,10,0.1) +
        R('wind','Wind',p.wind,0,5,0.1) +
        R('warp','Warp',p.warp,0,5,0.1) +
        R('strength','Strength',p.strength,0.1,10,0.1)
      ) +
      SEC('FBM',
        R('fbmStrength','FBM Strength',p.fbmStrength,0,5,0.1) +
        R('fbmDamping','FBM Damping',p.fbmDamping,0,5,0.1)
      ) +
      CANVAS_SEC(p),

    ascii: SEC('Color',
        C2('bg','Background',p.bg) +
        C2('color','Text Color',p.color||'#00ff41')
      ) +
      SEC('Source',
        `<div class="upload-zone" id="ascii-zone"><input type="file" id="ascii-file" accept="image/*"><div>LOAD IMAGE</div><div style="font-size:9px;margin-top:3px;color:var(--text4)">drag & drop or click</div></div>
        <button class="btn btn-ghost btn-sm" id="ascii-clear" style="width:100%;margin-bottom:4px">CLEAR IMAGE</button>`
      ) +
      SEC('Characters',
        S('charSet','Char Set',['Standard','Dense','Blocks','Binary','Braille'],p.charSet) +
        T('matchColors','Match Image Colors',p.matchColors)
      ) +
      SEC('Rendering',
        R('fontSize','Font Size',p.fontSize,4,32,1) +
        R('lineHeight','Line Height',p.lineHeight,0.5,3,0.1) +
        R('seed','Seed (pattern)',p.seed,0,9999,1)
      ) +
      SEC('Adjustments',
        R('contrast','Contrast',p.contrast,50,200,1) +
        R('brightness','Brightness',p.brightness,-100,100,1) +
        T('invert','Invert',p.invert)
      ) +
      CANVAS_SEC(p),

    dither: SEC('Palette', PAL(p)) +
      SEC('Source',
        `<div class="upload-zone" id="dither-zone"><input type="file" id="dither-file" accept="image/*"><div>LOAD IMAGE</div></div>` +
        S('sourceType','Source Type',['Gradient','Noise'],p.sourceType)
      ) +
      SEC('Pattern',
        S('pattern','Matrix',['Bayer 4x4','Bayer 8x8'],p.pattern) +
        S('shape','Cell Shape',['Square','Circle','Diamond'],p.shape) +
        R('cellSize','Cell Size',p.cellSize,1,20,1,'px') +
        R('seed','Seed',p.seed,0,9999,1)
      ) +
      CANVAS_SEC(p),

    noise: SEC('Color',
        C2('c1','Dark Color',p.c1) +
        C2('c2','Light Color',p.c2)
      ) +
      SEC('Noise',
        R('seed','Seed',p.seed,0,9999,1) +
        R('scale','Scale',p.scale,0.5,20,0.1) +
        R('octaves','Octaves',p.octaves,1,8,1) +
        R('warp','Domain Warp',p.warp,0,3,0.05)
      ) +
      SEC('Style',
        T('ridged','Ridged',p.ridged) +
        T('terraced','Terraced',p.terraced) +
        R('terraces','Terraces',p.terraces,2,20,1)
      ) +
      CANVAS_SEC(p),

    circles: SEC('Color',
        C2('bg','Background',p.bg) +
        PAL(p) +
        C2('lineColor','Stroke Color',p.lineColor)
      ) +
      SEC('Type',
        R('seed','Seed',p.seed,0,9999,1) +
        S('type','Type',['Concentric','Random Bubble','Grid'],p.type) +
        R('count','Count',p.count,3,600,1) +
        R('cx','Center X',p.cx,0,100,1,'%') +
        R('cy','Center Y',p.cy,0,100,1,'%')
      ) +
      SEC('Size',
        R('minR','Min Radius',p.minR,1,300,1) +
        R('maxR','Max Radius',p.maxR,1,500,1) +
        R('stroke','Stroke',p.stroke,0,15,0.5) +
        T('filled','Filled',p.filled) +
        T('pack','Pack (no overlap)',p.pack) +
        R('rows','Grid Rows',p.rows,2,30,1) +
        R('cols','Grid Cols',p.cols,2,30,1)
      ) +
      CANVAS_SEC(p),

    typography: SEC('Color',
        C2('bg','Background',p.bg) +
        PAL(p)
      ) +
      SEC('Text',
        `<div class="ctrl"><div class="ctrl-row"><span class="ctrl-lbl">Text</span></div><input type="text" id="text" value="${p.text||'GENSTUDIO'}"></div>` +
        S('type','Layout',['Scatter','Stack','Path'],p.type) +
        R('seed','Seed',p.seed,0,9999,1)
      ) +
      SEC('Font',
        S('font','Font',['IBM Plex Mono','Space Grotesk','Georgia','Arial Black','Courier New','Impact'],p.font) +
        S('weight','Weight',['100','300','400','700','900','bold'],p.weight) +
        R('minSize','Min Size',p.minSize,4,300,1) +
        R('maxSize','Max Size',p.maxSize,4,500,1) +
        R('spacing','Spacing',p.spacing,0,30,0.5) +
        R('lineHeight','Line Height',p.lineHeight,0.5,3,0.1)
      ) +
      SEC('Transform',
        R('count','Count',p.count,10,2000,10) +
        R('rotation','Rotation Range',p.rotation,0,360,1,'°') +
        R('glow','Glow',p.glow,0,100,1)
      ) +
      CANVAS_SEC(p),

    waves: SEC('Color',
        C2('bg','Background',p.bg) +
        C2('c1','Wave Start',p.c1||'#0e4d68') +
        C2('c2','Wave End',p.c2||'#64dfb8')
      ) +
      SEC('Wave',
        R('seed','Seed',p.seed,0,9999,1) +
        R('layers','Layers',p.layers,1,50,1) +
        R('amplitude','Amplitude',p.amplitude,0,400,1) +
        R('frequency','Frequency',p.frequency,0.2,20,0.1) +
        R('harmonics','Harmonics',p.harmonics,1,12,0.5) +
        R('phase','Phase',p.phase,0,360,1,'°') +
        R('offset','Y Offset',p.offset,-50,100,1,'%') +
        R('noise','Noise',p.noise,0,1,0.01) +
        R('opacity','Opacity',p.opacity,10,100,1,'%')
      ) +
      CANVAS_SEC(p),

    voronoi: SEC('Color',
        PAL(p) +
        T('drawEdges','Draw Edges',p.drawEdges) +
        C2('edgeColor','Edge Color',p.edgeColor||'#000000')
      ) +
      SEC('Points',
        R('seed','Seed',p.seed,0,9999,1) +
        R('count','Points',p.count,3,300,1) +
        S('metric','Distance',['Euclidean','Manhattan','Chebyshev'],p.metric)
      ) +
      CANVAS_SEC(p),

    fractal: SEC('Color',
        PAL(p) +
        R('colorCycles','Color Cycles',p.colorCycles,0,10,0.5)
      ) +
      SEC('Type',
        S('type','Fractal',['Mandelbrot','Julia','Burning Ship'],p.type) +
        R('iterations','Iterations',p.iterations,20,500,5) +
        R('zoom','Zoom',p.zoom,0.1,50,0.1) +
        R('cx','Center X',p.cx,-3,3,0.01) +
        R('cy','Center Y',p.cy,-2,2,0.01)
      ) +
      SEC('Julia',
        R('juliaC','C Real',p.juliaC,-2,2,0.01) +
        R('juliaCi','C Imag',p.juliaCi,-2,2,0.01)
      ) +
      CANVAS_SEC(p),

    pixelSort: SEC('Source',
        `<div class="upload-zone" id="ps-zone"><input type="file" id="ps-file" accept="image/*"><div>LOAD IMAGE</div></div>` +
        PAL(p, 'palette', 'Base Palette')
      ) +
      SEC('Sort',
        S('direction','Direction',['Horizontal','Vertical','Both'],p.direction) +
        R('threshold','Threshold',p.threshold,0,100,1,'%') +
        S('sortBy','Sort By',['Brightness','Hue','Saturation'],p.sortBy)
      ) +
      CANVAS_SEC(p),

    truchet: SEC('Color',
        C2('bg','Background',p.bg) +
        PAL(p)
      ) +
      SEC('Tile',
        R('seed','Seed',p.seed,0,9999,1) +
        S('type','Type',['Classic','Diagonal','SquareCurve','Triangle'],p.type) +
        R('tileSize','Size',p.tileSize,8,120,4) +
        R('stroke','Stroke',p.stroke,0.5,12,0.5) +
        T('twoColor','Two Color',p.twoColor)
      ) +
      CANVAS_SEC(p),

    crystal: SEC('Color',
        C2('bg','Background',p.bg) +
        PAL(p) +
        C2('lineColor','Edge Color',p.lineColor||'rgba(0,0,0,0.2)') +
        R('stroke','Edge Weight',p.stroke,0,6,0.25)
      ) +
      SEC('Grid',
        R('seed','Seed',p.seed,0,9999,1) +
        R('cols','Columns',p.cols,3,50,1) +
        R('rows','Rows',p.rows,3,50,1) +
        R('jitter','Jitter',p.jitter,0,100,1,'%')
      ) +
      CANVAS_SEC(p),

    spirograph: SEC('Color',
        C2('bg','Background',p.bg) +
        C2('c1','Color Start',p.c1||'#00ff41') +
        C2('c2','Color Mid',p.c2||'#003a0f') +
        C2('c3','Color End',p.c3||'#7affaa')
      ) +
      SEC('Parameters',
        R('R','Outer Radius',p.R,50,600,5) +
        R('r','Inner Radius',p.r,5,595,5) +
        R('d','Pen Offset',p.d,0,400,5) +
        R('loops','Loops',p.loops,1,60,1) +
        R('steps','Resolution',p.steps,200,10000,100) +
        R('stroke','Stroke',p.stroke,0.1,10,0.1)
      ) +
      CANVAS_SEC(p),

    flowField: SEC('Color',
        C2('bg','Background',p.bg) +
        PAL(p)
      ) +
      SEC('Particles',
        R('seed','Seed',p.seed,0,9999,1) +
        R('count','Count',p.count,50,3000,50) +
        R('life','Lifespan',p.life,10,300,5) +
        R('steps','Steps',p.steps,30,400,10) +
        R('speed','Speed',p.speed,0.2,15,0.2) +
        R('weight','Line Weight',p.weight,0.1,8,0.1) +
        R('opacity','Opacity',p.opacity,5,100,1,'%')
      ) +
      SEC('Field',
        R('scale','Field Scale',p.scale,0.5,20,0.5) +
        R('octaves','Octaves',p.octaves,1,6,1) +
        R('curl','Curl',p.curl,0.1,6,0.1)
      ) +
      CANVAS_SEC(p),

    space: SEC('Background',
        C2('bg1','Core Background',p.bg1) +
        C2('bg2','Edge Background',p.bg2)
      ) +
      SEC('Cosmos',
        R('seed','Seed',p.seed,0,9999,1) +
        R('stars','Stars',p.stars,100,10000,100) +
        R('starSize','Max Star Size',p.starSize,0.5,5,0.1) +
        R('glow','Star Glow',p.glow,0,50,1)
      ) +
      SEC('Nebula',
        R('nebula','Nebula Intensity',p.nebula,0,100,1) +
        R('nebulaScale','Nebula Scale',p.nebulaScale,0.5,10,0.5) +
        PAL(p)
      ) +
      CANVAS_SEC(p),

    nature: SEC('Colors',
        PAL(p)
      ) +
      SEC('Landscape',
        R('seed','Seed',p.seed,0,9999,1) +
        R('layers','Mountain Layers',p.layers,1,10,1) +
        R('amplitude','Height',p.amplitude,10,500,5) +
        R('frequency','Ruggedness',p.frequency,0.5,10,0.5) +
        R('trees','Trees',p.trees,0,500,10)
      ) +
      SEC('Sky',
        C2('skyTop','Sky Top',p.skyTop) +
        C2('skyBottom','Sky Bottom',p.skyBottom) +
        R('sunSize','Sun Size',p.sunSize,0,300,5) +
        R('sunX','Sun X',p.sunX,0,1,0.01) +
        R('sunY','Sun Y',p.sunY,0,1,0.01) +
        C2('sunColor','Sun Color',p.sunColor) +
        R('sunGlow','Sun Glow',p.sunGlow,0,100,1)
      ) +
      CANVAS_SEC(p),

    clouds: SEC('Colors',
        C2('bg1','Sky Top',p.bg1) +
        C2('bg2','Sky Bottom',p.bg2) +
        C2('cloudColor','Cloud Highlights',p.cloudColor) +
        C2('shadowColor','Cloud Shadows',p.shadowColor)
      ) +
      SEC('Noise',
        R('seed','Seed',p.seed,0,9999,1) +
        R('scale','Scale',p.scale,0.5,15,0.5) +
        R('octaves','Detail (Octaves)',p.octaves,1,8,1) +
        R('cover','Cloud Cover',p.cover,0,100,1,'%') +
        R('sharpness','Sharpness',p.sharpness,0.1,3,0.1)
      ) +
      CANVAS_SEC(p),

    paint: SEC('Colors',
        C2('bg','Background Canvas',p.bg) +
        PAL(p)
      ) +
      SEC('Brush',
        R('seed','Seed',p.seed,0,9999,1) +
        R('strokes','Strokes',p.strokes,100,10000,100) +
        R('length','Length',p.length,10,300,5) +
        R('thickness','Thickness',p.thickness,1,100,1) +
        R('bristles','Bristles Detail',p.bristles,0,100,1) +
        R('opacity','Opacity',p.opacity,1,100,1,'%')
      ) +
      SEC('Flow',
        R('scale','Flow Scale',p.scale,0.5,10,0.5) +
        R('curl','Curl',p.curl,0.1,5,0.1)
      ) +
      CANVAS_SEC(p),

    matrix: SEC('Colors',
        C2('bg','Background',p.bg) +
        C2('headColor','Head Color',p.headColor) +
        C2('tailColor','Tail Color',p.tailColor) +
        R('glow','Glow',p.glow,0,50,1)
      ) +
      SEC('Code',
        R('seed','Seed',p.seed,0,9999,1) +
        R('fontSize','Font Size',p.fontSize,6,48,1) +
        R('length','Trail Length',p.length,5,100,1) +
        R('speed','Speed Var',p.speed,0.1,3,0.1) +
        R('time','Time Offset',p.time,0,1000,1)
      ) +
      CANVAS_SEC(p)
  };
  return panels[tool] || SEC('Controls', '<p style="color:var(--text4);font-size:10px;padding:4px">No controls for this tool.</p>');
}


// ── Switch tool ───────────────────────────────────────────────
function switchTool(id) {
  if (!TOOLS[id]) return;
  current = id;
  // nav highlight
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const ni = document.querySelector(`.nav-item[data-tool="${id}"]`);
  if (ni) ni.classList.add('active');
  // header title
  const tt = document.getElementById('tool-name');
  if (tt) tt.innerHTML = `<span>${TOOLS[id].name}</span>`;
  // build sidebar
  const sc = document.getElementById('sidebar-content');
  if (sc) {
    sc.innerHTML = buildPanel(id);
    bindSection(id);
    sc.querySelectorAll('.sec-hdr').forEach(h => {
      h.addEventListener('click', () => h.closest('.sec').classList.toggle('closed'));
    });

  }
  schedRender();
}


// ── Bind controls ─────────────────────────────────────────────
function bindSection(tool) {
  const p = params[tool];
  const sc = document.getElementById('sidebar-content');
  if (!sc) return;

  // Ranges
  sc.querySelectorAll('input[type=range]').forEach(el => {
    el.addEventListener('input', () => {
      const v = parseFloat(el.value);
      p[el.id] = v;
      const vEl = document.getElementById('v_' + el.id);
      if (vEl) vEl.textContent = el.value + (el.dataset.suffix || '');
      schedRender();
    });
  });

  // Selects
  sc.querySelectorAll('select').forEach(el => {
    el.addEventListener('change', () => { p[el.id] = el.value; schedRender(); });
  });

  // Colors
  sc.querySelectorAll('input[type=color]').forEach(el => {
    el.addEventListener('input', () => {
      p[el.id] = el.value;
      el.closest('.color-swatch').style.background = el.value;
      // Update stops for gradients tool
      if (tool === 'gradients' && el.id.startsWith('gc')) {
        const idx = parseInt(el.id.slice(2));
        if (p.stops[idx]) p.stops[idx][1] = el.value;
      }

      // Update noise stops
      if (tool === 'noise') {
        if (!p.stops) p.stops = [[0, '#050505'], [0.5, '#003a0f'], [1, '#00ff41']];
        p.stops[0][1] = p.c1 || p.stops[0][1];
        p.stops[2][1] = p.c2 || p.stops[2][1];
      }
      if (tool === 'waves') {
        if (!p.stops) p.stops = [[0, '#0e4d68'], [0.5, '#1a9e8c'], [1, '#64dfb8']];
        p.stops[0][1] = p.c1 || p.stops[0][1];
        p.stops[2][1] = p.c2 || p.stops[2][1];
      }

      schedRender();
    });
  });

  // Toggles
  sc.querySelectorAll('.tog').forEach(el => {
    el.addEventListener('click', () => {
      el.classList.toggle('on');
      p[el.id] = el.classList.contains('on');
      schedRender();
    });
  });

  // Text inputs
  sc.querySelectorAll('input[type=text]').forEach(el => {
    el.addEventListener('input', () => { p[el.id] = el.value; schedRender(); });
  });

  // Number inputs (custom w/h)
  const cw = document.getElementById('cw'), ch = document.getElementById('ch');
  if (cw) cw.addEventListener('change', () => { p.w = Math.max(100, Math.min(4096, parseInt(cw.value)||800)); schedRender(); });
  if (ch) ch.addEventListener('change', () => { p.h = Math.max(100, Math.min(4096, parseInt(ch.value)||800)); schedRender(); });

  // Size pills
  sc.querySelectorAll('.size-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const [w, h] = GS.SIZES[pill.dataset.size] || [800, 800];
      p.w = w; p.h = h;
      sc.querySelectorAll('.size-pill').forEach(pp => pp.classList.remove('active'));
      pill.classList.add('active');
      if (cw) cw.value = w;
      if (ch) ch.value = h;
      schedRender();
    });
  });

  // Image uploads
  bindUpload('ascii-file', 'ascii-zone');
  bindUpload('dither-file', 'dither-zone');
  bindUpload('ps-file', 'ps-zone');

  // ASCII clear
  document.getElementById('ascii-clear')?.addEventListener('click', () => {
    loadedImage = null; schedRender();
  });
}

function bindUpload(inputId, zoneId) {
  const inp = document.getElementById(inputId);
  const zone = document.getElementById(zoneId);
  if (!inp) return;
  const handle = file => {
    if (!file) return;
    const r = new FileReader();
    r.onload = e => {
      const img = new Image();
      img.onload = () => { loadedImage = img; schedRender(); };
      img.src = e.target.result;
    };
    r.readAsDataURL(file);
  };
  inp.addEventListener('change', () => handle(inp.files[0]));
  if (zone) {
    zone.addEventListener('click', () => inp.click());
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = 'var(--green)'; });
    zone.addEventListener('dragleave', () => zone.style.borderColor = '');
    zone.addEventListener('drop', e => {
      e.preventDefault(); zone.style.borderColor = '';
      handle(e.dataTransfer.files[0]);
    });
  }
}

// ── Render ────────────────────────────────────────────────────
function schedRender(delay=10) {
  if (renderTimer) cancelAnimationFrame(renderTimer);
  renderTimer = requestAnimationFrame(() => setTimeout(doRender, delay));
}

function doRender() {
  const tool = TOOLS[current];
  const p = params[current];
  if (!tool || !canvas) return;

  // Resize canvas if needed
  const w = p.w || 1200, h = p.h || 1200;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;

  try {

    // Update noise stops when colors change
    if (current === 'noise') {
        if (!p.stops) p.stops = [[0, '#050505'], [0.5, '#003a0f'], [1, '#00ff41']];
        p.stops[0][1] = p.c1 || p.stops[0][1];
        p.stops[2][1] = p.c2 || p.stops[2][1];
    }
    if (current === 'waves') {
        if (!p.stops) p.stops = [[0, '#0e4d68'], [0.5, '#1a9e8c'], [1, '#64dfb8']];
        p.stops[0][1] = p.c1 || p.stops[0][1];
        p.stops[2][1] = p.c2 || p.stops[2][1];
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    tool.render(canvas, ctx, p, loadedImage);
  } catch(e) {
    console.error('[GenStudio] Render error in', current, ':', e);
    // Show error on canvas
    ctx.fillStyle = '#050505'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#ff3333'; ctx.font = '12px IBM Plex Mono';
    ctx.fillText('RENDER ERROR: ' + e.message, 20, 40);
  }

  // Update status
  const stat = document.getElementById('status-text');
  if (stat) stat.textContent = `${current.toUpperCase()} · ${w}×${h}`;
}

// ── Randomize ─────────────────────────────────────────────────
function randomize() {
  const p = params[current];
  const rng = Math.random;
  if ('seed' in p) p.seed = Math.floor(rng() * 99999);
  if ('palette' in p) p.palette = GS.randPalette(rng);
  // Re-init sidebar to reflect new values
  switchTool(current);
  GS.toast('Randomized');
}

// ── Init ──────────────────────────────────────────────────────
function init() {
  canvas = document.getElementById('main-canvas');
  ctx = canvas.getContext('2d');

  // Bind global FX
  const fxIds = ['blur', 'vignette', 'smoothness', 'grain'];
  fxIds.forEach(id => {
    const el = document.getElementById('global-' + id);
    if (el) {
      el.addEventListener('input', () => {
        const val = parseFloat(el.value);
        window.globalFX[id] = val;
        const vEl = document.getElementById('v_global-' + id);
        if (vEl) vEl.textContent = val;
        schedRender();
      });
    }
  });

  // Build nav
  const nav = document.getElementById('tool-nav');
  TOOL_ORDER.forEach((id, i) => {
    if (!TOOLS[id]) return;
    if (i === 7 || i === 14) {
      const sep = document.createElement('div');
      sep.className = 'nav-sep'; nav.appendChild(sep);
    }
    const btn = document.createElement('button');
    btn.className = 'nav-item'; btn.dataset.tool = id;
    btn.innerHTML = `${TOOLS[id].icon}<span class="tip">${TOOLS[id].name}</span>`;
    btn.addEventListener('click', () => switchTool(id));
    nav.appendChild(btn);
  });


  // Tool search
  const searchInput = document.querySelector('.search-box input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.toLowerCase();
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => {
        const toolName = item.querySelector('.tip').textContent.toLowerCase();
        if (toolName.includes(val)) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
      // Handle separators based on visibility of items (optional, but cleaner)
      const navSeps = document.querySelectorAll('.nav-sep');
      navSeps.forEach(sep => sep.style.display = val ? 'none' : 'block');
    });
  }


  // Export Modal Logic
  function triggerExportModal() {
      document.getElementById('download-modal').style.display = 'flex';
  }

  document.getElementById('btn-export')?.addEventListener('click', triggerExportModal);

  // Close modal when clicking outside the panel
  document.getElementById('download-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'download-modal') {
          document.getElementById('download-modal').style.display = 'none';
      }
  });

  document.getElementById('confirm-download-btn')?.addEventListener('click', () => {
      document.getElementById('download-modal').style.display = 'none';
      const scale = parseInt(document.getElementById('export-quality').value || '1');
      const format = document.getElementById('export-format').value || 'png';

      const p = JSON.parse(JSON.stringify(params[current])); // Deep clone
      const baseW = p.w || 1200;
      const baseH = p.h || 1200;
      const exportW = baseW * scale;
      const exportH = baseH * scale;
      p.w = exportW;
      p.h = exportH;

      const realCanvas = document.createElement('canvas');
      realCanvas.width = exportW;
      realCanvas.height = exportH;
      const realCtx = realCanvas.getContext('2d');

      const proxyCanvas = {
          width: exportW,
          height: exportH,
          getContext: () => realCtx,
          toDataURL: (...args) => realCanvas.toDataURL(...args)
      };

      try {
          if (!TOOLS[current]) return;
          TOOLS[current].render(proxyCanvas, realCtx, p, loadedImage);

          if (format === 'png') GS.exportPNG(realCanvas, current);
          if (format === 'jpg') GS.exportJPG(realCanvas, current);
          if (format === 'webp') GS.exportWebP(realCanvas, current);
          if (format === 'svg') GS.exportSVG(realCanvas, current);
      } catch (e) {
          console.error(e);
          GS.toast('Export Failed');
      }
  });

  // Header buttons
  document.getElementById('btn-random')?.addEventListener('click', randomize);

  document.getElementById('btn-reset')?.addEventListener('click', () => {
    resetParams(current); switchTool(current); GS.toast('Reset');
  });

  // Copy CSS button
  document.getElementById('btn-css')?.addEventListener('click', () => {
    const p = params[current];
    const bg = p.bg || '#000000';
    let css = `background-color: ${bg};\n`;
    if (p.stops) {
      css += `background-image: linear-gradient(90deg, ${p.stops.map(s => `${s[1]} ${s[0]*100}%`).join(', ')});\n`;
    }
    navigator.clipboard.writeText(css).then(() => {
      GS.toast('CSS Copied to clipboard!');
    }).catch(() => {
      GS.toast('Failed to copy CSS');
    });
  });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if ((e.ctrlKey||e.metaKey) && e.key==='s') { e.preventDefault(); GS.exportPNG(canvas, current); }
    if ((e.ctrlKey||e.metaKey) && e.key==='r') { e.preventDefault(); randomize(); }
  });


  // Boot animation
  const fill = document.getElementById('boot-fill');
  const loading = document.getElementById('loading');
  let pct = 0;
  const interval = setInterval(() => {
    pct += 12 + Math.random() * 15;
    if (fill) fill.style.width = Math.min(100, pct) + '%';
    if (pct >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        if (loading) loading.classList.add('hide');
        switchTool('blocks');
      }, 250);
    }
  }, 80);
}

return { init };
})();

window.addEventListener('DOMContentLoaded', () => App.init());
