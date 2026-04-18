// ── GenStudio App ─────────────────────────────────────────────
const App = (() => {
  let currentTool = 'blocks';
  let canvas, ctx;
  let renderTimeout = null;
  let isRendering = false;
  let loadedImage = null;

  const toolOrder = ['blocks','gradients','lines','organic','plotter','topo','marble',
    'ascii','dither','noise','circles','typography','waves','voronoi','fractal',
    'pixelSort','truchet','crystal','spirograph','flowField'];

  // ── Per-tool default params ──────────────────────────────────
  const DEFAULTS = {
    blocks: {
      w:800,h:800,seed:0,type:'Mondrian',count:10,complexity:4,asymmetry:50,
      rotation:0,bg:'#ffffff',palette:'Mondrian',density:40,stroke:2,
      lineColor:'#111111',wobble:40,texture:60,grain:30,
    },
    gradients: {
      w:800,h:800,angle:45,noiseScale:2,noiseIntensity:55,curveDist:70,detail:2,
      depth:60,highlights:50,shadows:55,grain:8,brightness:0,contrast:100,saturation:100,
      seed:0,
      stops:[[0,'#1a0533'],[0.25,'#4a1080'],[0.5,'#7c5cfc'],[0.75,'#c084fc'],[1,'#f5d0fe']],
    },
    lines: {
      w:800,h:800,seed:42,shape:'Sine Waves',frequency:0.026,amplitude:68,count:40,
      spacing:1,padding:50,thickness:1.5,bg:'#0a0a0f',bg2:'#1a0a3a',
      lineColor:'#7c5cfc',lineColor2:'#c084fc',
      colorGradient:true,bgGradient:false,
      weightVar:0,wobble:0,taper:0,spacingVar:0,rotationJitter:0,
      opacityVar:0,colorDrift:0,perlinFlow:0,freqVar:0,octaves:1,
      noise:0,watercolor:0,halftone:0,blur:0,
      colorStops:[[0,'#7c5cfc'],[1,'#c084fc']],
    },
    organic: {
      w:800,h:800,seed:35025,pathType:'Waves',pathCount:51,lineWeight:34,
      count:36,amplitude:55,frequency:0.056,harmonics:3,variation:67,
      wobble:12,roughness:12,taper:8,
      colorMode:'gradient',bg:'#0a0a0f',grain:0,texture:0,
      stops:[[0,'#7c5cfc'],[0.33,'#c084fc'],[0.67,'#f5d0fe'],[1,'#7c5cfc']],
    },
    plotter: {
      w:800,h:800,seed:12345,type:'Dot Grid',columns:20,rows:20,jitter:0,
      shape:'Circle',minSize:4,maxSize:24,strokeWeight:1,filled:true,rotation:0,
      wobble:0,roughness:0,taper:0,noiseScale:0.02,noiseIntensity:1,
      palette:'Purple Pink',bg:'#0a0a0f',amount:0,random:false,
    },
    topo: {
      w:800,h:800,seed:12345,levels:20,noiseScale:0.008,octaves:4,falloff:0.5,
      strokeWeight:1.5,wobble:0,roughness:0,smoothing:50,
      bg:'#0a0a0f',mode:'Single',lineColor:'#7c5cfc',opacity:100,grain:0,margin:20,
      stops:[[0,'#7c5cfc'],[1,'#f5d0fe']],
    },
    marble: {
      w:800,h:800,seed:0,noiseScale:1,wind:0,warp:0,fbmStrength:1,fbmDamping:1,
      watercolorDetail:18,watercolorWarp:0.02,watercolorBlur:1,veinIntensity:0,grain:0,
      main:'#f0ece0',low:'#c8bfab',mid:'#9b8e7a',high:'#fff9f0',strength:1,
    },
    ascii: {
      w:800,h:600,fontSize:8,letterSpacing:0,lineHeight:1,
      charSet:'Standard',matchColors:false,saturation:100,
      bg:'#000000',color:'#ffffff',overlayOpacity:30,asciiOpacity:100,
      contrast:100,brightness:0,invert:false,grain:0,sketch:false,seed:0,
    },
    dither: {
      w:800,h:800,palette:'Game Boy',source:'Gradient',type:'Noise',
      pattern:'Bayer 4x4',mode:'Image',style:'Threshold',shape:'Square',
      cellSize:2,
    },
    noise: {
      w:800,h:800,seed:0,scale:4,octaves:4,warp:0,grain:0,
      ridged:false,terraced:false,terraces:8,
      c1:'#0a0a0f',c2:'#7c5cfc',
      stops:[[0,'#0a0a0f'],[0.5,'#4a1080'],[1,'#7c5cfc']],
    },
    circles: {
      w:800,h:800,seed:0,type:'Concentric',count:20,
      cx:50,cy:50,minR:10,maxR:60,
      palette:'Purple Dream',bg:'#0a0a0f',lineColor:'rgba(255,255,255,0.3)',
      stroke:1,filled:false,pack:true,rows:8,cols:8,grain:0,
    },
    typography: {
      w:800,h:800,seed:0,text:'GENSTUDIO',type:'Scatter',
      font:'JetBrains Mono',weight:'bold',count:200,
      minSize:12,maxSize:80,rotation:360,spacing:2,lineHeight:1.2,
      glow:0,palette:'Purple Dream',bg:'#0a0a0f',grain:0,
    },
    waves: {
      w:800,h:800,seed:0,layers:12,amplitude:60,frequency:2,harmonics:3,
      phase:0,offset:0,noise:0,opacity:70,grain:0,
      bg:'#0f1c2e',stops:[[0,'#0e4d68'],[0.5,'#1a9e8c'],[1,'#64dfb8']],
    },
    voronoi: {
      w:800,h:800,seed:0,count:40,palette:'Purple Dream',
      metric:'Euclidean',relaxed:false,relaxation:50,
      drawEdges:true,edgeColor:'#0a0a0f',grain:0,
    },
    fractal: {
      w:800,h:800,type:'Mandelbrot',cx:-0.5,cy:0,zoom:1,iterations:80,
      juliaC:-0.7,juliaCi:0.27,colorCycles:1,
      palette:'Cyberpunk',grain:0,
    },
    pixelSort: {
      w:800,h:800,seed:0,direction:'Horizontal',threshold:50,sortBy:'Brightness',
      palette:'Purple Dream',
    },
    truchet: {
      w:800,h:800,seed:0,type:'Classic',tileSize:40,stroke:2,
      palette:'Mondrian',bg:'#ffffff',twoColor:true,grain:0,
    },
    crystal: {
      w:800,h:800,seed:0,cols:12,rows:12,jitter:60,
      palette:'Purple Dream',bg:'#0a0a0f',lineColor:'rgba(0,0,0,0.15)',stroke:0.5,grain:0,
    },
    spirograph: {
      w:800,h:800,bg:'#0a0a0f',R:300,r:113,d:80,loops:15,steps:5000,stroke:1,grain:0,
      c1:'#7c5cfc',c2:'#f5d0fe',stops:[[0,'#7c5cfc'],[0.5,'#c084fc'],[1,'#f5d0fe']],
    },
    flowField: {
      w:800,h:800,seed:0,count:500,life:80,steps:200,speed:2,
      scale:3,octaves:2,curl:1,weight:1,opacity:40,
      palette:'Purple Dream',bg:'#0a0a0f',grain:0,
    },
  };

  const params = {};
  Object.keys(DEFAULTS).forEach(k=>params[k]={...DEFAULTS[k]});

  // ── Sidebar panels HTML ───────────────────────────────────────
  function makeSidebarHTML(tool) {
    const p=params[tool];
    const palList=Object.keys(GS.PALETTES).map(k=>`<option ${k===p.palette?'selected':''}>${k}</option>`).join('');
    const sizeList=Object.keys(GS.SIZES).map(k=>`<option value="${k}" ${p.w===GS.SIZES[k][0]&&p.h===GS.SIZES[k][1]?'selected':''}>${k}</option>`).join('');

    const canvasSection=`
<div class="section">
  <div class="section-header"><span class="section-title">Canvas</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    <div class="ctrl"><div class="ctrl-label"><span class="ctrl-name">Size</span></div>
      <select id="size-select">${sizeList}<option value="Custom">Custom</option></select>
    </div>
    <div id="custom-size-row" class="custom-size-row" style="display:none">
      <input type="number" id="custom-w" value="${p.w}" min="200" max="4000" placeholder="W">
      <span>×</span>
      <input type="number" id="custom-h" value="${p.h}" min="200" max="4000" placeholder="H">
    </div>
  </div>
</div>`;

    const panels = {
      blocks: `
${canvasSection}
<div class="section">
  <div class="section-header"><span class="section-title">Pattern</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('seed','Seed',p.seed,0,9999,1)}
    ${selectCtrl('type','Pattern Type',['Mondrian','Halved','Columns','Rows','Grid'],p.type)}
    ${sliderCtrl('count','Block Count',p.count,3,30,1)}
    ${sliderCtrl('complexity','Complexity',p.complexity,1,10,0.1)}
    ${sliderCtrl('asymmetry','Asymmetry',p.asymmetry,0,100,1)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Color</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${colorCtrl('bg','Background',p.bg)}
    ${selectCtrl('palette','Palette',Object.keys(GS.PALETTES),p.palette)}
    ${sliderCtrl('density','Color Density',p.density,0,100,1)}
    ${colorCtrl('lineColor','Line Color',p.lineColor)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Stroke</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('stroke','Line Weight',p.stroke,0,20,0.5)}
    ${sliderCtrl('wobble','Edge Wobble',p.wobble,0,100,1)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Effects</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('texture','Texture',p.texture,0,100,1)}
    ${sliderCtrl('grain','Grain',p.grain,0,100,1)}
  </div>
</div>`,

      gradients: `
${canvasSection}
<div class="section">
  <div class="section-header"><span class="section-title">Colors</span><span class="section-toggle">▾</span></div>
  <div class="section-body" id="grad-stops-ui">
    ${p.stops.map((s,i)=>`<div class="ctrl toggle-row"><span class="ctrl-name">${Math.round(s[0]*100)}%</span>${colorCtrl('grad-c'+i,'',s[1])}</div>`).join('')}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Flow</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('angle','Angle',p.angle,0,360,1,'°')}
    ${sliderCtrl('noiseScale','Noise Scale',p.noiseScale,0.1,10,0.1)}
    ${sliderCtrl('noiseIntensity','Noise Intensity',p.noiseIntensity,0,100,1)}
    ${sliderCtrl('curveDist','Curve Distortion',p.curveDist,0,100,1)}
    ${sliderCtrl('detail','Detail',p.detail,1,8,1)}
    ${sliderCtrl('seed','Seed',p.seed,0,9999,1)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Depth & Light</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('depth','Depth',p.depth,0,100,1)}
    ${sliderCtrl('highlights','Highlights',p.highlights,0,100,1)}
    ${sliderCtrl('shadows','Shadows',p.shadows,0,100,1)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Grain & Adjustments</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('grain','Grain Amount',p.grain,0,40,1)}
    ${sliderCtrl('brightness','Brightness',p.brightness,-100,100,1)}
    ${sliderCtrl('contrast','Contrast',p.contrast,50,200,1)}
    ${sliderCtrl('saturation','Saturation',p.saturation,0,200,1)}
  </div>
</div>`,

      lines: `
${canvasSection}
<div class="section">
  <div class="section-header"><span class="section-title">Shape</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${selectCtrl('shape','Shape',['Horizontal Lines','Vertical Lines','Sine Waves','Zigzag','Diagonal','Concentric','Radial','Spiral','Grid'],p.shape)}
    ${sliderCtrl('frequency','Frequency',p.frequency,0.001,0.2,0.001)}
    ${sliderCtrl('amplitude','Amplitude',p.amplitude,0,200,1)}
    ${sliderCtrl('count','Line Count',p.count,1,200,1)}
    ${sliderCtrl('spacing','Spacing',p.spacing,0.1,5,0.1)}
    ${sliderCtrl('padding','Padding',p.padding,0,200,1)}
    ${sliderCtrl('thickness','Thickness',p.thickness,0.1,20,0.1)}
    ${sliderCtrl('seed','Seed',p.seed||0,0,9999,1)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Background</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${toggleCtrl('bgGradient','Gradient BG',p.bgGradient)}
    ${colorCtrl('bg','Background',p.bg)}
    ${colorCtrl('bg2','BG Color 2',p.bg2||p.bg)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Color</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${toggleCtrl('colorGradient','Gradient Lines',p.colorGradient)}
    ${colorCtrl('lineColor','Line Color',p.lineColor)}
    ${colorCtrl('lineColor2','Line Color 2',p.lineColor2||p.lineColor)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Organic Effects</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('wobble','Wobble',p.wobble,0,100,1)}
    ${sliderCtrl('weightVar','Weight Var',p.weightVar,0,100,1)}
    ${sliderCtrl('opacityVar','Opacity Var',p.opacityVar,0,100,1)}
    ${sliderCtrl('rotationJitter','Rotation Jitter',p.rotationJitter,0,45,0.5,'°')}
    ${sliderCtrl('spacingVar','Spacing Var',p.spacingVar,0,100,1)}
    ${sliderCtrl('freqVar','Freq Var',p.freqVar,0,100,1)}
    ${sliderCtrl('colorDrift','Color Drift',p.colorDrift,0,100,1)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Effects</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('noise','Noise',p.noise,0,100,1)}
    ${sliderCtrl('halftone','Halftone',p.halftone,0,40,1)}
  </div>
</div>`,

      organic: `
${canvasSection}
<div class="section">
  <div class="section-header"><span class="section-title">Background</span><span class="section-toggle">▾</span></div>
  <div class="section-body">${colorCtrl('bg','Background',p.bg)}</div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Paths</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('seed','Seed',p.seed,0,99999,1)}
    ${selectCtrl('pathType','Path Type',['Waves','Filled','Curl','Strand'],p.pathType)}
    ${sliderCtrl('pathCount','Path Count',p.pathCount,1,200,1)}
    ${sliderCtrl('lineWeight','Line Weight',p.lineWeight,0.1,80,0.5)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Algorithm</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('amplitude','Amplitude',p.amplitude,1,200,1)}
    ${sliderCtrl('frequency','Frequency',p.frequency,0.01,0.5,0.001)}
    ${sliderCtrl('harmonics','Harmonics',p.harmonics,1,8,1)}
    ${sliderCtrl('variation','Variation',p.variation,0,100,1)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Style</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('wobble','Wobble',p.wobble,0,100,1)}
    ${sliderCtrl('roughness','Roughness',p.roughness,0,100,1)}
    ${sliderCtrl('taper','Taper',p.taper,0,100,1)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Color</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${selectCtrl('colorMode','Mode',['gradient','random'],p.colorMode)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Effects</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('grain','Grain',p.grain,0,100,1)}
  </div>
</div>`,

      plotter: `
${canvasSection}
<div class="section">
  <div class="section-header"><span class="section-title">Background</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${colorCtrl('bg','Background',p.bg)}
    ${sliderCtrl('margin','Margin',p.margin||40,0,200,1)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Pattern</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('seed','Seed',p.seed,0,99999,1)}
    ${selectCtrl('type','Type',['Dot Grid','Random','Hexagonal','Diagonal'],p.type)}
    ${sliderCtrl('columns','Columns',p.columns,2,60,1)}
    ${sliderCtrl('rows','Rows',p.rows,2,60,1)}
    ${sliderCtrl('jitter','Jitter',p.jitter,0,1,0.01)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Shape</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${selectCtrl('shape','Shape',['Circle','Square','Triangle','Line','Cross','Diamond','Hexagon'],p.shape)}
    ${sliderCtrl('minSize','Min Size',p.minSize,1,50,1)}
    ${sliderCtrl('maxSize','Max Size',p.maxSize,1,100,1)}
    ${sliderCtrl('strokeWeight','Stroke Weight',p.strokeWeight,0.1,10,0.1)}
    ${toggleCtrl('filled','Filled',p.filled)}
    ${sliderCtrl('rotation','Rotation',p.rotation,0,360,1,'°')}
    ${sliderCtrl('wobble','Organic Wobble',p.wobble,0,100,1)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Noise</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('noiseScale','Scale',p.noiseScale,0.001,0.1,0.001)}
    ${sliderCtrl('noiseIntensity','Intensity',p.noiseIntensity,0,2,0.05)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Color</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${selectCtrl('palette','Palette',Object.keys(GS.PALETTES),p.palette)}
    ${sliderCtrl('amount','Grain',p.amount,0,100,1)}
  </div>
</div>`,

      topo: `
${canvasSection}
<div class="section">
  <div class="section-header"><span class="section-title">Terrain</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('seed','Seed',p.seed,0,99999,1)}
    ${sliderCtrl('levels','Contour Levels',p.levels,2,60,1)}
    ${sliderCtrl('noiseScale','Noise Scale',p.noiseScale,0.001,0.05,0.001)}
    ${sliderCtrl('octaves','Octaves',p.octaves,1,8,1)}
    ${sliderCtrl('falloff','Falloff',p.falloff,0.1,2,0.05)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Stroke</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('strokeWeight','Weight',p.strokeWeight,0.1,10,0.1)}
    ${sliderCtrl('wobble','Wobble',p.wobble,0,50,1)}
    ${sliderCtrl('smoothing','Smoothing',p.smoothing,0,100,1)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Color</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${colorCtrl('bg','Background',p.bg)}
    ${selectCtrl('mode','Mode',['Single','Gradient','Rainbow'],p.mode)}
    ${colorCtrl('lineColor','Line Color',p.lineColor)}
    ${sliderCtrl('opacity','Opacity',p.opacity,10,100,1,'%')}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Effects</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('grain','Grain',p.grain,0,100,1)}
    ${sliderCtrl('margin','Margin',p.margin,0,100,1)}
  </div>
</div>`,

      marble: `
${canvasSection}
<div class="section">
  <div class="section-header"><span class="section-title">Colors</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${colorCtrl('main','Main',p.main)} ${colorCtrl('low','Low',p.low)}
    ${colorCtrl('mid','Mid',p.mid)} ${colorCtrl('high','High',p.high)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Fluid</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('noiseScale','Noise Scale',p.noiseScale,0.1,10,0.1)}
    ${sliderCtrl('wind','Wind Speed',p.wind,0,5,0.1)}
    ${sliderCtrl('warp','Warp',p.warp,0,5,0.1)}
    ${sliderCtrl('strength','Strength',p.strength,0.1,5,0.1)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">FBM</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('fbmStrength','Strength',p.fbmStrength,0,3,0.05)}
    ${sliderCtrl('fbmDamping','Damping',p.fbmDamping,0,3,0.05)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Texture</span><span class="section-toggle">▾</span></div>
  <div class="section-body">${sliderCtrl('grain','Grain',p.grain,0,50,1)}</div>
</div>`,

      ascii: `
${canvasSection}
<div class="section">
  <div class="section-header"><span class="section-title">Source</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    <div class="upload-zone" id="ascii-upload-zone">
      <input type="file" id="ascii-file" accept="image/*">
      <div>📁 Load Image</div><div style="font-size:10px;margin-top:4px;color:var(--text3)">or drag &amp; drop</div>
    </div>
    <button class="btn btn-ghost btn-sm" id="ascii-clear">Clear Image</button>
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Characters</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${selectCtrl('charSet','Character Set',['Standard','Dense','Blocks','Binary','Braille'],p.charSet)}
    ${toggleCtrl('matchColors','Match Image Colors',p.matchColors)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Rendering</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('fontSize','Font Size',p.fontSize,4,24,1)}
    ${sliderCtrl('letterSpacing','Letter Spacing',p.letterSpacing,0,10,0.5)}
    ${sliderCtrl('lineHeight','Line Height',p.lineHeight,0.5,3,0.1)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Color</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${colorCtrl('bg','Background',p.bg)}
    ${colorCtrl('color','Text Color',p.color||'#ffffff')}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Adjustments</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('contrast','Contrast',p.contrast,50,200,1)}
    ${sliderCtrl('brightness','Brightness',p.brightness,-100,100,1)}
    ${toggleCtrl('invert','Invert',p.invert)}
  </div>
</div>`,

      dither: `
${canvasSection}
<div class="section">
  <div class="section-header"><span class="section-title">Source</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    <div class="upload-zone" id="dither-upload-zone">
      <input type="file" id="dither-file" accept="image/*">
      <div>📁 Load Image</div>
    </div>
    ${selectCtrl('source','Source',['Gradient','Noise','Image'],p.source)}
    ${selectCtrl('type','Type',['Noise','Gradient','Plasma'],p.type)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Pattern</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${selectCtrl('pattern','Pattern',['Bayer 4x4','Bayer 8x8','Floyd-Steinberg','Ordered'],p.pattern)}
    ${selectCtrl('style','Dither Style',['Threshold','Diffusion'],p.style)}
    ${selectCtrl('shape','Shape',['Square','Circle','Diamond'],p.shape)}
    ${sliderCtrl('cellSize','Cell Size',p.cellSize,1,20,1,'px')}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Palette</span><span class="section-toggle">▾</span></div>
  <div class="section-body">${selectCtrl('palette','Palette',Object.keys(GS.PALETTES),p.palette)}</div>
</div>`,

      noise: `
${canvasSection}
<div class="section">
  <div class="section-header"><span class="section-title">Noise</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('seed','Seed',p.seed,0,9999,1)}
    ${sliderCtrl('scale','Scale',p.scale,0.5,20,0.1)}
    ${sliderCtrl('octaves','Octaves',p.octaves,1,8,1)}
    ${sliderCtrl('warp','Domain Warp',p.warp,0,2,0.05)}
    ${sliderCtrl('terraces','Terraces',p.terraces,2,20,1)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Style</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${toggleCtrl('ridged','Ridged',p.ridged)}
    ${toggleCtrl('terraced','Terraced',p.terraced)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Colors</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${colorCtrl('c1','Color 1',p.c1)} ${colorCtrl('c2','Color 2',p.c2)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Effects</span><span class="section-toggle">▾</span></div>
  <div class="section-body">${sliderCtrl('grain','Grain',p.grain,0,100,1)}</div>
</div>`,

      circles: `
${canvasSection}
<div class="section">
  <div class="section-header"><span class="section-title">Type</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('seed','Seed',p.seed,0,9999,1)}
    ${selectCtrl('type','Type',['Concentric','Random Bubble','Grid'],p.type)}
    ${sliderCtrl('count','Count',p.count,3,500,1)}
    ${sliderCtrl('cx','Center X',p.cx,0,100,1,'%')}
    ${sliderCtrl('cy','Center Y',p.cy,0,100,1,'%')}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Size</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('minR','Min Radius',p.minR,1,200,1)}
    ${sliderCtrl('maxR','Max Radius',p.maxR,1,400,1)}
    ${sliderCtrl('stroke','Stroke',p.stroke,0,10,0.5)}
    ${toggleCtrl('filled','Filled',p.filled)}
    ${toggleCtrl('pack','Pack (no overlap)',p.pack)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Color</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${colorCtrl('bg','Background',p.bg)}
    ${selectCtrl('palette','Palette',Object.keys(GS.PALETTES),p.palette)}
    ${colorCtrl('lineColor','Line Color',p.lineColor)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Effects</span><span class="section-toggle">▾</span></div>
  <div class="section-body">${sliderCtrl('grain','Grain',p.grain,0,100,1)}</div>
</div>`,

      typography: `
${canvasSection}
<div class="section">
  <div class="section-header"><span class="section-title">Text</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    <div class="ctrl"><div class="ctrl-label"><span class="ctrl-name">Text</span></div>
      <input type="text" id="text" value="${p.text||'GENSTUDIO'}">
    </div>
    ${selectCtrl('type','Layout',['Scatter','Stack','Path'],p.type)}
    ${sliderCtrl('seed','Seed',p.seed,0,9999,1)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Font</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${selectCtrl('font','Font',['JetBrains Mono','Space Grotesk','Georgia','Arial Black','Courier New','Impact'],p.font)}
    ${selectCtrl('weight','Weight',['100','300','400','700','900','bold'],p.weight)}
    ${sliderCtrl('minSize','Min Size',p.minSize,4,200,1)}
    ${sliderCtrl('maxSize','Max Size',p.maxSize,4,400,1)}
    ${sliderCtrl('spacing','Spacing',p.spacing,0,20,0.5)}
    ${sliderCtrl('lineHeight','Line Height',p.lineHeight,0.5,3,0.1)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Transform</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('count','Count',p.count,10,1000,10)}
    ${sliderCtrl('rotation','Rotation Range',p.rotation,0,360,1,'°')}
    ${sliderCtrl('glow','Glow',p.glow,0,100,1)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Color</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${colorCtrl('bg','Background',p.bg)}
    ${selectCtrl('palette','Palette',Object.keys(GS.PALETTES),p.palette)}
    ${sliderCtrl('grain','Grain',p.grain,0,100,1)}
  </div>
</div>`,

      waves: `
${canvasSection}
<div class="section">
  <div class="section-header"><span class="section-title">Wave</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('seed','Seed',p.seed,0,9999,1)}
    ${sliderCtrl('layers','Layers',p.layers,1,40,1)}
    ${sliderCtrl('amplitude','Amplitude',p.amplitude,0,300,1)}
    ${sliderCtrl('frequency','Frequency',p.frequency,0.5,20,0.1)}
    ${sliderCtrl('harmonics','Harmonics',p.harmonics,1,10,0.5)}
    ${sliderCtrl('phase','Phase',p.phase,0,360,1,'°')}
    ${sliderCtrl('offset','Y Offset',p.offset,-50,100,1,'%')}
    ${sliderCtrl('noise','Noise',p.noise,0,1,0.01)}
    ${sliderCtrl('opacity','Opacity',p.opacity,10,100,1,'%')}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Color</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${colorCtrl('bg','Background',p.bg)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Effects</span><span class="section-toggle">▾</span></div>
  <div class="section-body">${sliderCtrl('grain','Grain',p.grain,0,100,1)}</div>
</div>`,

      voronoi: `
${canvasSection}
<div class="section">
  <div class="section-header"><span class="section-title">Points</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('seed','Seed',p.seed,0,9999,1)}
    ${sliderCtrl('count','Point Count',p.count,5,200,1)}
    ${selectCtrl('metric','Distance Metric',['Euclidean','Manhattan','Chebyshev'],p.metric)}
    ${toggleCtrl('relaxed','Relaxed (Lloyd)',p.relaxed)}
    ${sliderCtrl('relaxation','Relaxation',p.relaxation,0,100,1)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Color</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${selectCtrl('palette','Palette',Object.keys(GS.PALETTES),p.palette)}
    ${toggleCtrl('drawEdges','Draw Edges',p.drawEdges)}
    ${colorCtrl('edgeColor','Edge Color',p.edgeColor||'#0a0a0f')}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Effects</span><span class="section-toggle">▾</span></div>
  <div class="section-body">${sliderCtrl('grain','Grain',p.grain,0,100,1)}</div>
</div>`,

      fractal: `
${canvasSection}
<div class="section">
  <div class="section-header"><span class="section-title">Type</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${selectCtrl('type','Fractal Type',['Mandelbrot','Julia','Burning Ship'],p.type)}
    ${sliderCtrl('iterations','Iterations',p.iterations,20,500,10)}
    ${sliderCtrl('zoom','Zoom',p.zoom,0.1,100,0.1)}
    ${sliderCtrl('cx','Center X',p.cx,-3,3,0.01)}
    ${sliderCtrl('cy','Center Y',p.cy,-2,2,0.01)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Julia Parameters</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('juliaC','Julia C Real',p.juliaC,-2,2,0.01)}
    ${sliderCtrl('juliaCi','Julia C Imag',p.juliaCi,-2,2,0.01)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Color</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${selectCtrl('palette','Palette',Object.keys(GS.PALETTES),p.palette)}
    ${sliderCtrl('colorCycles','Color Cycles',p.colorCycles,0,10,0.5)}
  </div>
</div>`,

      pixelSort: `
${canvasSection}
<div class="section">
  <div class="section-header"><span class="section-title">Source</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    <div class="upload-zone" id="ps-upload-zone">
      <input type="file" id="ps-file" accept="image/*">
      <div>📁 Load Image</div>
    </div>
    ${selectCtrl('palette','Base Palette',Object.keys(GS.PALETTES),p.palette)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Sort</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${selectCtrl('direction','Direction',['Horizontal','Vertical','Both','Diagonal'],p.direction)}
    ${sliderCtrl('threshold','Threshold',p.threshold,0,100,1,'%')}
    ${selectCtrl('sortBy','Sort By',['Brightness','Hue','Saturation'],p.sortBy)}
  </div>
</div>`,

      truchet: `
${canvasSection}
<div class="section">
  <div class="section-header"><span class="section-title">Tile</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('seed','Seed',p.seed,0,9999,1)}
    ${selectCtrl('type','Tile Type',['Classic','Diagonal','SquareCurve','Triangle'],p.type)}
    ${sliderCtrl('tileSize','Tile Size',p.tileSize,10,120,5)}
    ${sliderCtrl('stroke','Stroke',p.stroke,0.5,10,0.5)}
    ${toggleCtrl('twoColor','Two Color',p.twoColor)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Color</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${colorCtrl('bg','Background',p.bg)}
    ${selectCtrl('palette','Palette',Object.keys(GS.PALETTES),p.palette)}
    ${sliderCtrl('grain','Grain',p.grain,0,100,1)}
  </div>
</div>`,

      crystal: `
${canvasSection}
<div class="section">
  <div class="section-header"><span class="section-title">Grid</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('seed','Seed',p.seed,0,9999,1)}
    ${sliderCtrl('cols','Columns',p.cols,4,40,1)}
    ${sliderCtrl('rows','Rows',p.rows,4,40,1)}
    ${sliderCtrl('jitter','Jitter',p.jitter,0,100,1,'%')}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Color</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${colorCtrl('bg','Background',p.bg)}
    ${selectCtrl('palette','Palette',Object.keys(GS.PALETTES),p.palette)}
    ${colorCtrl('lineColor','Edge Color',p.lineColor||'rgba(0,0,0,0.15)')}
    ${sliderCtrl('stroke','Edge Weight',p.stroke,0,5,0.5)}
    ${sliderCtrl('grain','Grain',p.grain,0,100,1)}
  </div>
</div>`,

      spirograph: `
${canvasSection}
<div class="section">
  <div class="section-header"><span class="section-title">Parameters</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('R','Outer Radius (R)',p.R,50,600,5)}
    ${sliderCtrl('r','Inner Radius (r)',p.r,5,400,5)}
    ${sliderCtrl('d','Pen Offset (d)',p.d,0,400,5)}
    ${sliderCtrl('loops','Loops',p.loops,1,50,1)}
    ${sliderCtrl('steps','Resolution',p.steps,500,10000,100)}
    ${sliderCtrl('stroke','Stroke Weight',p.stroke,0.1,10,0.1)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Color</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${colorCtrl('bg','Background',p.bg)}
    ${colorCtrl('c1','Color Start',p.c1||'#7c5cfc')}
    ${colorCtrl('c2','Color End',p.c2||'#f5d0fe')}
    ${sliderCtrl('grain','Grain',p.grain,0,100,1)}
  </div>
</div>`,

      flowField: `
${canvasSection}
<div class="section">
  <div class="section-header"><span class="section-title">Particles</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('seed','Seed',p.seed,0,9999,1)}
    ${sliderCtrl('count','Particle Count',p.count,50,5000,50)}
    ${sliderCtrl('life','Lifespan',p.life,10,300,5)}
    ${sliderCtrl('steps','Steps',p.steps,50,500,10)}
    ${sliderCtrl('speed','Speed',p.speed,0.5,10,0.5)}
    ${sliderCtrl('weight','Line Weight',p.weight,0.1,5,0.1)}
    ${sliderCtrl('opacity','Opacity',p.opacity,5,100,1,'%')}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Field</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${sliderCtrl('scale','Field Scale',p.scale,0.5,15,0.5)}
    ${sliderCtrl('octaves','Octaves',p.octaves,1,6,1)}
    ${sliderCtrl('curl','Curl',p.curl,0.1,5,0.1)}
  </div>
</div>
<div class="section">
  <div class="section-header"><span class="section-title">Color</span><span class="section-toggle">▾</span></div>
  <div class="section-body">
    ${colorCtrl('bg','Background',p.bg)}
    ${selectCtrl('palette','Palette',Object.keys(GS.PALETTES),p.palette)}
    ${sliderCtrl('grain','Grain',p.grain,0,100,1)}
  </div>
</div>`,
    };
    return panels[tool]||`<div class="section"><div class="section-body"><p style="color:var(--text3);font-size:11px">No controls for this tool.</p></div></div>`;
  }

  // ── HTML helpers ─────────────────────────────────────────────
  function sliderCtrl(id,name,val,min,max,step,suffix=''){
    return `<div class="ctrl"><div class="ctrl-label"><span class="ctrl-name">${name}</span><span class="ctrl-val" id="${id}-val">${val}${suffix}</span></div>
<input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
  }
  function selectCtrl(id,name,opts,val){
    return `<div class="ctrl"><div class="ctrl-label"><span class="ctrl-name">${name}</span></div>
<select id="${id}">${opts.map(o=>`<option value="${o}" ${o===val?'selected':''}>${o}</option>`).join('')}</select></div>`;
  }
  function colorCtrl(id,name,val){
    return `<div class="ctrl toggle-row"><span class="ctrl-name">${name}</span>
<div class="color-swatch" style="background:${val||'#000000'}"><input type="color" id="${id}" value="${val||'#000000'}"></div></div>`;
  }
  function toggleCtrl(id,name,val){
    return `<div class="toggle-row"><span class="toggle-label">${name}</span><button class="toggle${val?' on':''}" id="${id}"></button></div>`;
  }

  // ── Switch tool ──────────────────────────────────────────────
  function switchTool(toolId) {
    if(!TOOLS[toolId])return;
    currentTool=toolId;
    // update nav
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    const ni=document.querySelector(`.nav-item[data-tool="${toolId}"]`);
    if(ni)ni.classList.add('active');
    // update header title
    const tt=document.getElementById('tool-title');
    if(tt)tt.textContent=TOOLS[toolId].name;
    // rebuild sidebar
    const sidebar=document.getElementById('sidebar-controls');
    if(sidebar){
      sidebar.innerHTML=makeSidebarHTML(toolId);
      GS.initSections(sidebar);
      bindControls(toolId);
    }
    scheduleRender();
  }

  // ── Bind sidebar controls to params ──────────────────────────
  function bindControls(tool) {
    const p=params[tool];
    // Auto-bind all range inputs
    document.querySelectorAll('#sidebar-controls input[type=range]').forEach(el=>{
      const key=el.id;
      const valEl=document.getElementById(key+'-val');
      el.addEventListener('input',()=>{
        const v=parseFloat(el.value);
        p[key]=v;
        if(valEl)valEl.textContent=el.value+(el.dataset.suffix||'');
        scheduleRender();
      });
    });
    // Auto-bind selects
    document.querySelectorAll('#sidebar-controls select').forEach(el=>{
      el.addEventListener('change',()=>{ p[el.id]=el.value; scheduleRender(); });
    });
    // Auto-bind color inputs
    document.querySelectorAll('#sidebar-controls input[type=color]').forEach(el=>{
      el.addEventListener('input',()=>{
        p[el.id]=el.value;
        el.closest('.color-swatch').style.background=el.value;
        scheduleRender();
      });
    });
    // Auto-bind toggles
    document.querySelectorAll('#sidebar-controls .toggle').forEach(el=>{
      el.addEventListener('click',()=>{
        el.classList.toggle('on');
        p[el.id]=el.classList.contains('on');
        scheduleRender();
      });
    });
    // Auto-bind text
    document.querySelectorAll('#sidebar-controls input[type=text]').forEach(el=>{
      el.addEventListener('input',()=>{ p[el.id]=el.value; scheduleRender(); });
    });
    // Canvas size
    const sizeSel=document.getElementById('size-select');
    const customRow=document.getElementById('custom-size-row');
    if(sizeSel){
      sizeSel.addEventListener('change',()=>{
        if(sizeSel.value==='Custom'){customRow&&(customRow.style.display='flex');}
        else{
          customRow&&(customRow.style.display='none');
          const [w,h]=GS.SIZES[sizeSel.value]||[800,800];
          p.w=w; p.h=h; scheduleRender();
        }
      });
    }
    const cw=document.getElementById('custom-w'), ch2=document.getElementById('custom-h');
    if(cw)cw.addEventListener('change',()=>{p.w=parseInt(cw.value)||800;scheduleRender();});
    if(ch2)ch2.addEventListener('change',()=>{p.h=parseInt(ch2.value)||800;scheduleRender();});
    // Image uploads
    bindImageUpload('ascii-file','ascii-upload-zone');
    bindImageUpload('dither-file','dither-upload-zone');
    bindImageUpload('ps-file','ps-upload-zone');
    // ASCII clear
    const aclr=document.getElementById('ascii-clear');
    if(aclr)aclr.addEventListener('click',()=>{loadedImage=null;scheduleRender();});
  }

  function bindImageUpload(inputId, zoneId) {
    const inp=document.getElementById(inputId);
    const zone=document.getElementById(zoneId);
    if(!inp)return;
    inp.addEventListener('change',()=>{
      const file=inp.files[0]; if(!file)return;
      const reader=new FileReader();
      reader.onload=(e)=>{const img=new Image();img.onload=()=>{loadedImage=img;scheduleRender();};img.src=e.target.result;};
      reader.readAsDataURL(file);
    });
    if(zone){
      zone.addEventListener('click',()=>inp.click());
      zone.addEventListener('dragover',e=>{e.preventDefault();zone.style.borderColor='var(--accent)';});
      zone.addEventListener('dragleave',()=>zone.style.borderColor='');
      zone.addEventListener('drop',e=>{
        e.preventDefault(); zone.style.borderColor='';
        const file=e.dataTransfer.files[0]; if(!file)return;
        const reader=new FileReader();
        reader.onload=(ev)=>{const img=new Image();img.onload=()=>{loadedImage=img;scheduleRender();};img.src=ev.target.result;};
        reader.readAsDataURL(file);
      });
    }
  }

  // ── Render ────────────────────────────────────────────────────
  function scheduleRender() {
    if(renderTimeout)clearTimeout(renderTimeout);
    renderTimeout=setTimeout(()=>render(),60);
  }

  function render() {
    if(isRendering)return;
    isRendering=true;
    const p=params[currentTool];
    const tool=TOOLS[currentTool];
    if(!tool){isRendering=false;return;}
    // Resize canvas
    if(canvas.width!==p.w||canvas.height!==p.h){
      canvas.width=p.w||800; canvas.height=p.h||800;
    }
    try{
      tool.render(canvas,ctx,p,loadedImage);
    }catch(e){console.error('Render error:',currentTool,e);}
    isRendering=false;
  }

  // ── Init ─────────────────────────────────────────────────────
  function init() {
    canvas=document.getElementById('main-canvas');
    ctx=canvas.getContext('2d');
    // Build nav
    const nav=document.getElementById('tool-nav');
    if(nav){
      toolOrder.forEach(id=>{
        if(!TOOLS[id])return;
        const btn=document.createElement('button');
        btn.className='nav-item'; btn.dataset.tool=id;
        btn.innerHTML=`<span>${TOOLS[id].icon}</span><span class="tooltip">${TOOLS[id].name}</span>`;
        btn.addEventListener('click',()=>switchTool(id));
        nav.appendChild(btn);
      });
    }
    // Randomize button
    document.getElementById('btn-randomize')?.addEventListener('click',()=>{
      const p=params[currentTool];
      if(typeof p.seed!=='undefined') p.seed=Math.floor(Math.random()*99999);
      if(typeof p.palette!=='undefined') p.palette=GS.randomPalette();
      switchTool(currentTool);
    });
    // Export buttons
    document.getElementById('btn-png')?.addEventListener('click',()=>GS.exportPNG(canvas,currentTool));
    document.getElementById('btn-jpg')?.addEventListener('click',()=>GS.exportJPG(canvas,currentTool));
    document.getElementById('btn-svg')?.addEventListener('click',()=>{
      // fallback — wrap canvas as PNG in SVG
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('width',canvas.width); svg.setAttribute('height',canvas.height);
      const img=document.createElementNS('http://www.w3.org/2000/svg','image');
      img.setAttribute('href',canvas.toDataURL());
      img.setAttribute('width',canvas.width); img.setAttribute('height',canvas.height);
      svg.appendChild(img); GS.exportSVG(svg,currentTool);
    });
    // Keyboard shortcuts
    document.addEventListener('keydown',e=>{
      if(e.ctrlKey||e.metaKey){
        if(e.key==='s'){e.preventDefault();GS.exportPNG(canvas,currentTool);}
        if(e.key==='r'){e.preventDefault();document.getElementById('btn-randomize')?.click();}
      }
    });
    // Start with blocks
    switchTool('blocks');
    // Hide loading
    const lo=document.getElementById('loading-overlay');
    if(lo){lo.querySelector('.loading-fill').style.width='100%';setTimeout(()=>lo.classList.add('hidden'),400);}
  }

  return {init};
})();

window.addEventListener('DOMContentLoaded',()=>App.init());
