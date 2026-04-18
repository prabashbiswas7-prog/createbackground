// ── GenStudio Tool Renderers ─────────────────────────────────
// Each tool: { name, icon, render(canvas, ctx, params) }

const TOOLS = {};

// ──────────────────────────────────────────────────────────────
// 1. BLOCKS (Mondrian / Geometric grid)
// ──────────────────────────────────────────────────────────────
TOOLS.blocks = {
  name: 'Blocks', icon: '⊞',
  render(canvas, ctx, p) {
    const {w,h}=[canvas.width,canvas.height];
    const rng = GS.seededRandom(p.seed);
    const palette = GS.getPalette(p.palette);
    ctx.fillStyle = p.bg; ctx.fillRect(0,0,w,h);
    const splits = [];
    function splitRect(x,y,rw,rh,depth) {
      if(depth<=0||rw<30||rh<30){splits.push({x,y,w:rw,h:rh});return;}
      const horiz = p.type==='horizontal'?true:p.type==='vertical'?false:rng()<0.5;
      const ratio = 0.25+rng()*0.5+(rng()-0.5)*p.asymmetry/200;
      if(horiz) {
        const cut=rh*ratio;
        if(rng()<p.complexity/10){splitRect(x,y,rw,cut,depth-1);splitRect(x,y+cut,rw,rh-cut,depth-1);}
        else splits.push({x,y,w:rw,h:rh});
      } else {
        const cut=rw*ratio;
        if(rng()<p.complexity/10){splitRect(x,y,cut,rh,depth-1);splitRect(x+cut,y,rw-cut,rh,depth-1);}
        else splits.push({x,y,w:rw,h:rh});
      }
    }
    splitRect(0,0,w,h,Math.floor(p.count/2)+2);
    splits.forEach(r=>{
      const ci=Math.floor(rng()*palette.length);
      const useColor=rng()*100<p.density;
      ctx.fillStyle=useColor?palette[ci]:p.bg;
      // wobble edges
      if(p.wobble>0) {
        ctx.beginPath();
        const wob=p.wobble*0.3;
        ctx.moveTo(r.x+wob*(rng()-0.5),r.y+wob*(rng()-0.5));
        ctx.lineTo(r.x+r.w+wob*(rng()-0.5),r.y+wob*(rng()-0.5));
        ctx.lineTo(r.x+r.w+wob*(rng()-0.5),r.y+r.h+wob*(rng()-0.5));
        ctx.lineTo(r.x+wob*(rng()-0.5),r.y+r.h+wob*(rng()-0.5));
        ctx.closePath(); ctx.fill();
      } else {
        ctx.fillRect(r.x,r.y,r.w,r.h);
      }
      if(p.stroke>0){
        ctx.strokeStyle=p.lineColor; ctx.lineWidth=p.stroke;
        ctx.strokeRect(r.x+p.stroke/2,r.y+p.stroke/2,r.w-p.stroke,r.h-p.stroke);
      }
    });
    // texture
    if(p.texture>0) GS.applyGrain(ctx,w,h,p.texture*0.5);
  }
};

// ──────────────────────────────────────────────────────────────
// 2. GRADIENTS (Mesh / Noise gradient)
// ──────────────────────────────────────────────────────────────
TOOLS.gradients = {
  name: 'Gradients', icon: '◑',
  render(canvas, ctx, p) {
    const {width:w,height:h}=[canvas][0]; const W=canvas.width,H=canvas.height;
    const id=ctx.createImageData(W,H);
    const d=id.data;
    const stops=p.stops||[[0,'#1a0533'],[0.5,'#7c5cfc'],[1,'#f5d0fe']];
    const ns=p.noiseScale||2, ni=p.noiseIntensity/100||0.5;
    const cd=p.curveDist/100||0.7, ang=(p.angle||45)*Math.PI/180;
    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        let t=(x*Math.cos(ang)+y*Math.sin(ang))/(W*Math.cos(ang)+H*Math.sin(ang));
        const n=GS.fbm(x/W*ns+p.seed/100,y/H*ns+p.seed/100,p.detail||2)*ni;
        t=t+n*cd; t=Math.max(0,Math.min(1,t));
        const hex=GS.colorAtGradient(stops,t);
        const [r,g,b]=GS.hexToRgb(hex);
        const i=(y*W+x)*4;
        d[i]=r;d[i+1]=g;d[i+2]=b;d[i+3]=255;
      }
    }
    ctx.putImageData(id,0,0);
    if(p.depth>0){
      const gr=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.7);
      gr.addColorStop(0,'rgba(255,255,255,'+p.highlights/300+')');
      gr.addColorStop(1,'rgba(0,0,0,'+p.shadows/200+')');
      ctx.fillStyle=gr; ctx.fillRect(0,0,W,H);
    }
    if(p.grain>0) GS.applyGrain(ctx,W,H,p.grain);
    // brightness/contrast/sat
    if(p.brightness!==0||p.contrast!==100){
      ctx.filter=`brightness(${(100+p.brightness)/100}) contrast(${p.contrast}%) saturate(${p.saturation}%)`;
      const tmp=document.createElement('canvas'); tmp.width=W; tmp.height=H;
      tmp.getContext('2d').drawImage(canvas,0,0);
      ctx.drawImage(tmp,0,0);
      ctx.filter='none';
    }
  }
};

// ──────────────────────────────────────────────────────────────
// 3. LINES
// ──────────────────────────────────────────────────────────────
TOOLS.lines = {
  name: 'Lines', icon: '≡',
  render(canvas, ctx, p) {
    const W=canvas.width,H=canvas.height;
    // background
    if(p.bgGradient) {
      const gr=ctx.createLinearGradient(0,0,W,H);
      gr.addColorStop(0,p.bg); gr.addColorStop(1,p.bg2||p.bg);
      ctx.fillStyle=gr;
    } else { ctx.fillStyle=p.bg; }
    ctx.fillRect(0,0,W,H);
    const rng=GS.seededRandom(p.seed||42);
    const pad=p.padding; const count=p.count; const shape=p.shape;
    const isH=shape==='Horizontal Lines'||shape==='Sine Waves'||shape==='Zigzag';
    const isV=shape==='Vertical Lines';
    const isCon=shape==='Concentric';
    const isS=shape==='Spiral';
    for(let i=0;i<count;i++){
      const t=i/(count-1);
      const freq=p.frequency*(1+(rng()-0.5)*p.freqVar);
      const amp=p.amplitude*(1+(rng()-0.5)*0.3);
      const opacity=1-(rng()*p.opacityVar/100);
      const lw=p.thickness*(0.5+(1-(rng()*p.weightVar/100))*0.5);
      ctx.globalAlpha=opacity;
      // color
      if(p.colorGradient) {
        const stops=p.colorStops||[[0,p.lineColor],[1,p.lineColor2||p.lineColor]];
        ctx.strokeStyle=GS.colorAtGradient(stops,t);
      } else { ctx.strokeStyle=p.lineColor; }
      ctx.lineWidth=lw;
      ctx.beginPath();
      if(isH||shape==='Sine Waves'||shape==='Zigzag') {
        const y=pad+(H-pad*2)*t+(rng()-0.5)*p.spacingVar;
        const rotJit=(rng()-0.5)*p.rotationJitter*Math.PI/180;
        ctx.save(); ctx.translate(W/2,y); ctx.rotate(rotJit);
        if(shape==='Horizontal Lines') { ctx.moveTo(-W/2,0); ctx.lineTo(W/2,0); }
        else if(shape==='Sine Waves') {
          ctx.moveTo(-W/2,0);
          for(let x=-W/2;x<=W/2;x+=2){
            const wobN=p.wobble>0?GS.noise2d(x*0.01,y*0.01)*p.wobble:0;
            ctx.lineTo(x,Math.sin(x*freq+t*p.colorDrift)*amp+wobN);
          }
        } else if(shape==='Zigzag') {
          ctx.moveTo(-W/2,0);
          for(let x=-W/2;x<=W/2;x+=1/(freq*5)||10){
            ctx.lineTo(x,((Math.round(x*freq)%2===0)?1:-1)*amp);
          }
        }
        ctx.restore();
      } else if(isV) {
        const x=pad+(W-pad*2)*t;
        ctx.moveTo(x,pad); ctx.lineTo(x,H-pad);
      } else if(isCon) {
        const cx=W/2,cy=H/2;
        const rx=(Math.min(W,H)/2-pad)*t;
        ctx.ellipse(cx,cy,rx,rx*(H/W),0,0,Math.PI*2);
      } else if(shape==='Diagonal') {
        const x=pad+(W+H)*t-H;
        ctx.moveTo(x,0); ctx.lineTo(x+H,H);
      } else if(isS) {
        const cx=W/2,cy=H/2,turns=8;
        for(let a=0;a<turns*Math.PI*2*t+0.01;a+=0.05){
          const r=a/(turns*Math.PI*2)*Math.min(W,H)/2;
          const xp=cx+Math.cos(a)*r, yp=cy+Math.sin(a)*r;
          a===0?ctx.moveTo(xp,yp):ctx.lineTo(xp,yp);
        }
      } else if(shape==='Grid') {
        if(i<count/2){const x=pad+(W-pad*2)*t*2;ctx.moveTo(x,pad);ctx.lineTo(x,H-pad);}
        else{const y=pad+(H-pad*2)*(t*2-1);ctx.moveTo(pad,y);ctx.lineTo(W-pad,y);}
      } else if(shape==='Radial') {
        const cx=W/2,cy=H/2,angle=t*Math.PI*2;
        ctx.moveTo(cx,cy);
        ctx.lineTo(cx+Math.cos(angle)*Math.max(W,H),cy+Math.sin(angle)*Math.max(W,H));
      }
      ctx.stroke();
    }
    ctx.globalAlpha=1;
    if(p.noise>0) GS.applyGrain(ctx,W,H,p.noise);
    if(p.halftone>0) GS.applyHalftone(ctx,W,H,p.halftone,p.lineColor);
  }
};

// ──────────────────────────────────────────────────────────────
// 4. ORGANIC (Flow paths)
// ──────────────────────────────────────────────────────────────
TOOLS.organic = {
  name: 'Organic', icon: '〜',
  render(canvas, ctx, p) {
    const W=canvas.width,H=canvas.height;
    ctx.fillStyle=p.bg; ctx.fillRect(0,0,W,H);
    const rng=GS.seededRandom(p.seed);
    const stops=p.stops||[[0,'#7c5cfc'],[0.5,'#c084fc'],[1,'#f5d0fe']];
    const pad=p.padding;
    for(let pi=0;pi<p.pathCount;pi++){
      const t=pi/p.pathCount;
      const col=p.colorMode==='gradient'?GS.colorAtGradient(stops,t):stops[Math.floor(rng()*stops.length)][1];
      ctx.strokeStyle=col;
      ctx.lineWidth=p.lineWeight*(0.5+rng()*0.5);
      ctx.globalAlpha=0.7+rng()*0.3;
      ctx.beginPath();
      const sx=pad+rng()*(W-pad*2), sy=pad+rng()*(H-pad*2);
      ctx.moveTo(sx,sy);
      let cx=sx,cy=sy;
      const steps=80+Math.floor(rng()*40);
      for(let s=0;s<steps;s++){
        const angle=GS.noise2d(cx/W*p.frequency+p.seed/100,cy/H*p.frequency+p.seed/100)*Math.PI*2*p.harmonics;
        const wobble=(rng()-0.5)*p.wobble;
        const step=p.amplitude/steps*3;
        cx=Math.max(pad,Math.min(W-pad,cx+Math.cos(angle+wobble)*step));
        cy=Math.max(pad,Math.min(H-pad,cy+Math.sin(angle+wobble)*step));
        if(p.roughness>0&&s%3===0){
          const rx=(rng()-0.5)*p.roughness,ry=(rng()-0.5)*p.roughness;
          ctx.bezierCurveTo(cx+rx,cy+ry,cx-rx,cy-ry,cx,cy);
        } else { ctx.lineTo(cx,cy); }
      }
      if(p.pathType==='Filled'){ctx.closePath();ctx.fillStyle=col;ctx.fill();}
      else ctx.stroke();
    }
    ctx.globalAlpha=1;
    if(p.grain>0) GS.applyGrain(ctx,W,H,p.grain);
  }
};

// ──────────────────────────────────────────────────────────────
// 5. PLOTTER (Dot/Shape grids)
// ──────────────────────────────────────────────────────────────
TOOLS.plotter = {
  name: 'Plotter', icon: '⁙',
  render(canvas, ctx, p) {
    const W=canvas.width,H=canvas.height;
    ctx.fillStyle=p.bg; ctx.fillRect(0,0,W,H);
    const rng=GS.seededRandom(p.seed);
    const palette=GS.getPalette(p.palette);
    const mx=p.margin,cols=p.columns,rows=p.rows;
    const cw=(W-mx*2)/cols, ch=(H-mx*2)/rows;
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const t=(r*cols+c)/(rows*cols);
        const n=GS.noise2d(c*p.noiseScale+p.seed,r*p.noiseScale+p.seed)*p.noiseIntensity;
        const jx=(rng()-0.5)*cw*p.jitter, jy=(rng()-0.5)*ch*p.jitter;
        const cx=mx+c*cw+cw/2+jx, cy=mx+r*ch+ch/2+jy;
        const size=p.minSize+(p.maxSize-p.minSize)*((n+1)/2);
        const col=palette[Math.floor(rng()*palette.length)];
        ctx.strokeStyle=col; ctx.fillStyle=col;
        ctx.lineWidth=p.strokeWeight;
        const rot=(p.rotation+rng()*p.wobble)*Math.PI/180;
        ctx.save(); ctx.translate(cx,cy); ctx.rotate(rot);
        ctx.beginPath();
        switch(p.shape){
          case 'Circle':ctx.arc(0,0,size/2,0,Math.PI*2);break;
          case 'Square':ctx.rect(-size/2,-size/2,size,size);break;
          case 'Triangle':
            ctx.moveTo(0,-size/2);ctx.lineTo(size/2,size/2);ctx.lineTo(-size/2,size/2);ctx.closePath();break;
          case 'Line':ctx.moveTo(-size/2,0);ctx.lineTo(size/2,0);break;
          case 'Cross':
            ctx.moveTo(-size/2,0);ctx.lineTo(size/2,0);
            ctx.moveTo(0,-size/2);ctx.lineTo(0,size/2);break;
          case 'Diamond':
            ctx.moveTo(0,-size/2);ctx.lineTo(size/2,0);ctx.lineTo(0,size/2);ctx.lineTo(-size/2,0);ctx.closePath();break;
          case 'Hexagon':
            for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.lineTo(Math.cos(a)*size/2,Math.sin(a)*size/2);}ctx.closePath();break;
          default:ctx.arc(0,0,size/2,0,Math.PI*2);
        }
        p.filled?ctx.fill():ctx.stroke();
        ctx.restore();
      }
    }
    if(p.amount>0) GS.applyGrain(ctx,W,H,p.amount);
  }
};

// ──────────────────────────────────────────────────────────────
// 6. TOPO (Topographic / contour)
// ──────────────────────────────────────────────────────────────
TOOLS.topo = {
  name: 'Topo', icon: '◎',
  render(canvas, ctx, p) {
    const W=canvas.width,H=canvas.height;
    ctx.fillStyle=p.bg; ctx.fillRect(0,0,W,H);
    const mx=p.margin;
    const palette=p.mode==='Gradient'?null:null;
    const stops=p.stops||[[0,p.lineColor]];
    for(let level=0;level<p.levels;level++){
      const t=level/p.levels;
      const iso=t*2-1;
      ctx.strokeStyle=p.mode==='Gradient'?GS.colorAtGradient([[0,p.bg],[1,p.lineColor]],t):p.lineColor;
      ctx.lineWidth=p.strokeWeight;
      ctx.globalAlpha=p.opacity/100;
      ctx.beginPath();
      let first=true;
      const samples=200;
      for(let xi=0;xi<=samples;xi++){
        const x=mx+(W-mx*2)*xi/samples;
        const fx=xi/samples*p.noiseScale*W/100;
        for(let yi=0;yi<=samples;yi++){
          const y=mx+(H-mx*2)*yi/samples;
          const fy=yi/samples*p.noiseScale*H/100;
          const v=GS.fbm(fx+p.seed/100,fy+p.seed/100,p.octaves)*p.falloff*2;
          // March adjacent squares — simplified: just draw where noise ≈ iso
          const nx=GS.fbm(fx+0.01+p.seed/100,fy+p.seed/100,p.octaves)*p.falloff*2;
          if((v-iso)*(nx-iso)<0){
            first?ctx.moveTo(x,y):ctx.lineTo(x,y);
            first=false;
          }
        }
      }
      ctx.stroke();
    }
    ctx.globalAlpha=1;
    if(p.grain>0) GS.applyGrain(ctx,W,H,p.grain);
  }
};

// ──────────────────────────────────────────────────────────────
// 7. MARBLE
// ──────────────────────────────────────────────────────────────
TOOLS.marble = {
  name: 'Marble', icon: '◉',
  render(canvas, ctx, p) {
    const W=canvas.width,H=canvas.height;
    const id=ctx.createImageData(W,H);
    const d=id.data;
    const cols={main:GS.hexToRgb(p.main||'#f0ece0'),low:GS.hexToRgb(p.low||'#c8bfab'),
      mid:GS.hexToRgb(p.mid||'#9b8e7a'),high:GS.hexToRgb(p.high||'#fff9f0')};
    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        const fx=x/W*p.noiseScale, fy=y/H*p.noiseScale;
        let warp=0;
        for(let oct=0;oct<4;oct++){
          warp+=GS.noise2d(fx*(oct+1)+p.seed/100+p.wind,fy*(oct+1)+p.seed/100)*p.warp/(oct+1);
        }
        const v=(Math.sin((x/W+warp)*Math.PI*p.strength)+1)/2;
        const fbv=GS.fbm(fx+warp*p.fbmStrength+p.seed/100,fy+warp*p.fbmDamping+p.seed/100,4);
        const t=Math.max(0,Math.min(1,(v+fbv)*0.5));
        const c=t<0.33?
          [cols.low[0]+t*3*(cols.mid[0]-cols.low[0]),cols.low[1]+t*3*(cols.mid[1]-cols.low[1]),cols.low[2]+t*3*(cols.mid[2]-cols.low[2])]:
          t<0.66?
          [cols.mid[0]+(t-0.33)*3*(cols.main[0]-cols.mid[0]),cols.mid[1]+(t-0.33)*3*(cols.main[1]-cols.mid[1]),cols.mid[2]+(t-0.33)*3*(cols.main[2]-cols.mid[2])]:
          [cols.main[0]+(t-0.66)*3*(cols.high[0]-cols.main[0]),cols.main[1]+(t-0.66)*3*(cols.high[1]-cols.main[1]),cols.main[2]+(t-0.66)*3*(cols.high[2]-cols.main[2])];
        const i=(y*W+x)*4;
        d[i]=Math.max(0,Math.min(255,c[0])); d[i+1]=Math.max(0,Math.min(255,c[1])); d[i+2]=Math.max(0,Math.min(255,c[2])); d[i+3]=255;
      }
    }
    ctx.putImageData(id,0,0);
    if(p.grain>0) GS.applyGrain(ctx,W,H,p.grain);
  }
};

// ──────────────────────────────────────────────────────────────
// 8. ASCII
// ──────────────────────────────────────────────────────────────
TOOLS.ascii = {
  name: 'ASCII', icon: 'Aa',
  render(canvas, ctx, p, imageData) {
    const W=canvas.width,H=canvas.height;
    ctx.fillStyle=p.bg||'#000000'; ctx.fillRect(0,0,W,H);
    ctx.font=`${p.fontSize}px ${p.font||'JetBrains Mono, monospace'}`;
    ctx.textBaseline='top';
    const charSets={
      Standard:' .:-=+*#%@',
      Dense:' .\':;lIi!,|)(}{][?JjrftFnuvXUYCQO0Zmwqpdbkhao*#MW&8%B@$',
      Blocks:' ░▒▓█',
      Binary:' 01',
      Braille:' ⠂⠃⠆⠇⠸⠹⠺⠻⠼⠽⠾⠿',
      Emoji:' .oO0@#',
    };
    const chars=charSets[p.charSet]||charSets.Standard;
    if(!imageData){
      // pattern-based ASCII
      for(let y=0;y<H;y+=p.fontSize*p.lineHeight){
        for(let x=0;x<W;x+=p.fontSize*p.letterSpacing||p.fontSize){
          const n=(GS.noise2d(x/W*5+p.seed/100,y/H*5+p.seed/100)+1)/2;
          const ci=Math.floor(n*chars.length);
          ctx.fillStyle=p.color||'#ffffff';
          ctx.fillText(chars[ci]||' ',x,y);
        }
      }
    } else {
      // image-based
      const tmp=document.createElement('canvas');
      tmp.width=W; tmp.height=H;
      const tc=tmp.getContext('2d');
      tc.drawImage(imageData,0,0,W,H);
      const id=tc.getImageData(0,0,W,H);
      for(let y=0;y<H;y+=p.fontSize*p.lineHeight){
        for(let x=0;x<W;x+=p.fontSize){
          const i=((Math.floor(y)*W)+Math.floor(x))*4;
          const r=id.data[i],g=id.data[i+1],b=id.data[i+2];
          const bright=(r*0.299+g*0.587+b*0.114)/255;
          const adjusted=Math.max(0,Math.min(1,(bright-0.5)*p.contrast/100+0.5+p.brightness/200));
          const ci=Math.floor(adjusted*(chars.length-1));
          if(p.matchColors){ctx.fillStyle=`rgb(${r},${g},${b})`;}
          else{ctx.fillStyle=p.color||'#ffffff';}
          if(p.invert){ctx.fillStyle=ctx.fillStyle==='#ffffff'?'#000000':ctx.fillStyle;}
          ctx.fillText(chars[ci]||' ',x,y);
        }
      }
    }
  }
};

// ──────────────────────────────────────────────────────────────
// 9. DITHER
// ──────────────────────────────────────────────────────────────
TOOLS.dither = {
  name: 'Dither', icon: '⣿',
  render(canvas, ctx, p, src) {
    const W=canvas.width,H=canvas.height;
    const palette=GS.getPalette(p.palette);
    if(!src){
      // gradient source
      const tmpC=document.createElement('canvas'); tmpC.width=W; tmpC.height=H;
      const tc=tmpC.getContext('2d');
      const gr=tc.createLinearGradient(0,0,W,H);
      gr.addColorStop(0,palette[0]); gr.addColorStop(1,palette[palette.length-1]);
      tc.fillStyle=gr; tc.fillRect(0,0,W,H);
      // add noise
      if(p.type==='Noise'){
        const id2=tc.getImageData(0,0,W,H);
        for(let y=0;y<H;y++) for(let x=0;x<W;x++){
          const n=(GS.noise2d(x/W*4,y/H*4)+1)/2;
          const i=(y*W+x)*4;
          id2.data[i]=id2.data[i]*n; id2.data[i+1]=id2.data[i+1]*n; id2.data[i+2]=id2.data[i+2]*n;
        }
        tc.putImageData(id2,0,0);
      }
      src=tmpC;
    }
    const tmpC2=document.createElement('canvas'); tmpC2.width=W; tmpC2.height=H;
    const tc2=tmpC2.getContext('2d'); tc2.drawImage(src,0,0,W,H);
    const id=tc2.getImageData(0,0,W,H); const data=[...id.data];
    // Bayer matrices
    const bayer4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]].map(r=>r.map(v=>v/16));
    const bayer8=Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>{
      const b=bayer4[r%4][c%4];return r<4?b/2:(b+0.5)/2;
    }));
    const matrix=p.pattern==='Bayer 8x8'?bayer8:bayer4;
    const msize=matrix.length;
    function nearest(r,g,b){
      let best=palette[0],bd=Infinity;
      for(const col of palette){const [pr,pg,pb]=GS.hexToRgb(col);const d=(r-pr)**2+(g-pg)**2+(b-pb)**2;if(d<bd){bd=d;best=col;}}
      return GS.hexToRgb(best);
    }
    const cs=Math.max(1,p.cellSize||2);
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle=palette[0]; ctx.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=cs){
      for(let x=0;x<W;x+=cs){
        const i=(y*W+x)*4;
        const r=id.data[i]/255, g=id.data[i+1]/255, b=id.data[i+2]/255;
        const th=matrix[Math.floor(y/cs)%msize][Math.floor(x/cs)%msize];
        const [nr,ng,nb]=nearest(
          Math.min(255,(r+th*0.5)*255),
          Math.min(255,(g+th*0.5)*255),
          Math.min(255,(b+th*0.5)*255)
        );
        ctx.fillStyle=`rgb(${nr},${ng},${nb})`;
        if(p.shape==='Circle'){ctx.beginPath();ctx.arc(x+cs/2,y+cs/2,cs/2,0,Math.PI*2);ctx.fill();}
        else ctx.fillRect(x,y,cs,cs);
      }
    }
  }
};

// ──────────────────────────────────────────────────────────────
// 10. NOISE TEXTURE
// ──────────────────────────────────────────────────────────────
TOOLS.noise = {
  name: 'Noise', icon: '▓',
  render(canvas, ctx, p) {
    const W=canvas.width,H=canvas.height;
    const id=ctx.createImageData(W,H); const d=id.data;
    const stops=p.stops||[[0,p.c1||'#0a0a0f'],[1,p.c2||'#7c5cfc']];
    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        let n=GS.fbm(x/W*p.scale+p.seed/100,y/H*p.scale+p.seed/100,p.octaves);
        n=(n+1)/2;
        // domain warp
        if(p.warp>0){
          const wx=GS.fbm(x/W*p.scale+p.seed/100+3.2,y/H*p.scale+p.seed/100+1.7,2)*p.warp;
          const wy=GS.fbm(x/W*p.scale+p.seed/100+1.9,y/H*p.scale+p.seed/100+4.1,2)*p.warp;
          n=GS.fbm((x/W+wx)*p.scale+p.seed/100,(y/H+wy)*p.scale+p.seed/100,p.octaves);
          n=(n+1)/2;
        }
        n=Math.max(0,Math.min(1,n));
        if(p.ridged) n=1-Math.abs(n*2-1);
        if(p.terraced) n=Math.round(n*p.terraces)/p.terraces;
        const hex=GS.colorAtGradient(stops,n);
        const [r,g,b]=GS.hexToRgb(hex);
        const i=(y*W+x)*4;
        d[i]=r;d[i+1]=g;d[i+2]=b;d[i+3]=255;
      }
    }
    ctx.putImageData(id,0,0);
    if(p.grain>0) GS.applyGrain(ctx,W,H,p.grain);
  }
};

// ──────────────────────────────────────────────────────────────
// 11. CIRCLES (Concentric / bubble layouts)
// ──────────────────────────────────────────────────────────────
TOOLS.circles = {
  name: 'Circles', icon: '○',
  render(canvas, ctx, p) {
    const W=canvas.width,H=canvas.height;
    ctx.fillStyle=p.bg; ctx.fillRect(0,0,W,H);
    const rng=GS.seededRandom(p.seed);
    const palette=GS.getPalette(p.palette);
    if(p.type==='Concentric'){
      const cx=W*p.cx/100, cy=H*p.cy/100;
      for(let i=p.count;i>0;i--){
        const t=i/p.count;
        const r=t*Math.min(W,H)*0.5;
        ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
        ctx.strokeStyle=palette[i%palette.length];
        ctx.lineWidth=p.stroke; ctx.globalAlpha=0.5+t*0.5;
        p.filled?ctx.fill():ctx.stroke();
      }
    } else if(p.type==='Random Bubble') {
      const circles=[];
      for(let i=0;i<p.count*5;i++){
        const r=p.minR+rng()*(p.maxR-p.minR);
        const x=r+rng()*(W-r*2), y=r+rng()*(H-r*2);
        if(p.pack){
          if(circles.some(c=>Math.hypot(c.x-x,c.y-y)<c.r+r+2))continue;
        }
        circles.push({x,y,r,col:palette[Math.floor(rng()*palette.length)]});
        if(circles.length>=p.count)break;
      }
      circles.forEach(c=>{
        ctx.beginPath(); ctx.arc(c.x,c.y,c.r,0,Math.PI*2);
        ctx.fillStyle=c.col; ctx.strokeStyle=p.lineColor; ctx.lineWidth=p.stroke;
        if(p.filled)ctx.fill(); ctx.stroke();
      });
    } else if(p.type==='Grid') {
      const cols=p.cols||8, rows=p.rows||8;
      const cw=W/cols, ch=H/rows;
      for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
        const t=(r*cols+c)/(rows*cols);
        const n=GS.noise2d(c*0.3+p.seed,r*0.3+p.seed);
        const radius=(p.minR+(p.maxR-p.minR)*((n+1)/2));
        ctx.beginPath(); ctx.arc(c*cw+cw/2,r*ch+ch/2,radius,0,Math.PI*2);
        ctx.fillStyle=palette[Math.floor(t*palette.length)%palette.length];
        ctx.strokeStyle=p.lineColor; ctx.lineWidth=p.stroke;
        if(p.filled)ctx.fill(); ctx.stroke();
      }
    }
    ctx.globalAlpha=1;
    if(p.grain>0) GS.applyGrain(ctx,W,H,p.grain);
  }
};

// ──────────────────────────────────────────────────────────────
// 12. TYPOGRAPHY (Generative text/type)
// ──────────────────────────────────────────────────────────────
TOOLS.typography = {
  name: 'Type', icon: 'T',
  render(canvas, ctx, p) {
    const W=canvas.width,H=canvas.height;
    ctx.fillStyle=p.bg; ctx.fillRect(0,0,W,H);
    const rng=GS.seededRandom(p.seed);
    const palette=GS.getPalette(p.palette);
    const text=p.text||'GENSTUDIO';
    const chars=text.split('');
    if(p.type==='Scatter'){
      for(let i=0;i<p.count;i++){
        const ch=chars[Math.floor(rng()*chars.length)];
        const sz=p.minSize+rng()*(p.maxSize-p.minSize);
        const x=rng()*W, y=rng()*H;
        const rot=(rng()-0.5)*p.rotation*Math.PI/180;
        const col=palette[Math.floor(rng()*palette.length)];
        ctx.save(); ctx.translate(x,y); ctx.rotate(rot);
        ctx.font=`${p.weight} ${sz}px ${p.font}`;
        ctx.fillStyle=col; ctx.globalAlpha=0.3+rng()*0.7;
        ctx.fillText(ch,0,0); ctx.restore();
      }
    } else if(p.type==='Stack'){
      const lineH=p.maxSize*p.lineHeight;
      let y=lineH;
      while(y<H+lineH){
        let x=0; const sz=p.minSize+rng()*(p.maxSize-p.minSize);
        ctx.font=`${p.weight} ${sz}px ${p.font}`;
        const col=palette[Math.floor(rng()*palette.length)];
        ctx.fillStyle=col; ctx.globalAlpha=0.5+rng()*0.5;
        while(x<W){
          const ch=chars[Math.floor(rng()*chars.length)];
          ctx.fillText(ch,x,y);
          x+=ctx.measureText(ch).width+p.spacing;
        }
        y+=lineH;
      }
    } else if(p.type==='Path'){
      const sz=Math.min(W,H)*0.15;
      ctx.font=`bold ${sz}px ${p.font}`;
      ctx.textBaseline='middle'; ctx.textAlign='center';
      ctx.fillStyle=palette[0];
      ctx.globalAlpha=1;
      ctx.fillText(text,W/2,H/2);
      // glow
      if(p.glow>0){
        ctx.shadowBlur=p.glow; ctx.shadowColor=palette[1]||palette[0];
        ctx.fillText(text,W/2,H/2);
        ctx.shadowBlur=0;
      }
    }
    ctx.globalAlpha=1;
    if(p.grain>0) GS.applyGrain(ctx,W,H,p.grain);
  }
};

// ──────────────────────────────────────────────────────────────
// 13. WAVES (Interference / ocean)
// ──────────────────────────────────────────────────────────────
TOOLS.waves = {
  name: 'Waves', icon: '≈',
  render(canvas, ctx, p) {
    const W=canvas.width,H=canvas.height;
    ctx.fillStyle=p.bg; ctx.fillRect(0,0,W,H);
    const stops=p.stops||[[0,p.c1||'#0e4d68'],[1,p.c2||'#64dfb8']];
    for(let i=0;i<p.layers;i++){
      const t=i/p.layers;
      const y=H*(t+p.offset/100);
      const amp=p.amplitude*(1-t*0.3);
      const freq=p.frequency*(1+t*p.harmonics*0.2);
      const phase=t*Math.PI*2+p.phase;
      const col=GS.colorAtGradient(stops,t);
      ctx.beginPath(); ctx.moveTo(0,H);
      for(let x=0;x<=W;x+=2){
        const n=p.noise>0?GS.noise2d(x/W*4+p.seed/100,t*2)*p.noise*amp:0;
        const wy=y+Math.sin(x/W*Math.PI*2*freq+phase)*amp+
                   Math.sin(x/W*Math.PI*2*freq*p.harmonics+phase*2)*amp*0.3+n;
        x===0?ctx.moveTo(x,wy):ctx.lineTo(x,wy);
      }
      ctx.lineTo(W,H); ctx.closePath();
      ctx.fillStyle=col; ctx.globalAlpha=p.opacity/100*(0.4+t*0.6);
      ctx.fill();
    }
    ctx.globalAlpha=1;
    if(p.grain>0) GS.applyGrain(ctx,W,H,p.grain);
  }
};

// ──────────────────────────────────────────────────────────────
// 14. VORONOI
// ──────────────────────────────────────────────────────────────
TOOLS.voronoi = {
  name: 'Voronoi', icon: '⬡',
  render(canvas, ctx, p) {
    const W=canvas.width,H=canvas.height;
    const rng=GS.seededRandom(p.seed);
    const palette=GS.getPalette(p.palette);
    const pts=[];
    for(let i=0;i<p.count;i++){
      const n=p.relaxed?GS.noise2d(i*0.3+p.seed,i*0.17)*p.relaxation/100:0;
      pts.push({x:rng()*W+n*W,y:rng()*H+n*H,col:palette[Math.floor(rng()*palette.length)]});
    }
    const id=ctx.createImageData(W,H); const d=id.data;
    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        let best=Infinity,bestPt=pts[0];
        for(const pt of pts){
          const dist=p.metric==='Manhattan'?
            Math.abs(x-pt.x)+Math.abs(y-pt.y):
            p.metric==='Chebyshev'?
            Math.max(Math.abs(x-pt.x),Math.abs(y-pt.y)):
            (x-pt.x)**2+(y-pt.y)**2;
          if(dist<best){best=dist;bestPt=pt;}
        }
        const [r,g,b]=GS.hexToRgb(bestPt.col);
        const i2=(y*W+x)*4; d[i2]=r;d[i2+1]=g;d[i2+2]=b;d[i2+3]=255;
      }
    }
    ctx.putImageData(id,0,0);
    if(p.drawEdges){
      ctx.fillStyle=p.edgeColor||'#000000';
      for(let y=1;y<H-1;y++){
        for(let x=1;x<W-1;x++){
          const i=(y*W+x)*4;
          const neighbors=[(y-1)*W+x,(y+1)*W+x,y*W+x-1,y*W+x+1];
          if(neighbors.some(n=>id.data[n*4]!==id.data[i]||id.data[n*4+1]!==id.data[i+1])){
            ctx.fillRect(x,y,1,1);
          }
        }
      }
    }
    if(p.grain>0) GS.applyGrain(ctx,W,H,p.grain);
  }
};

// ──────────────────────────────────────────────────────────────
// 15. FRACTAL
// ──────────────────────────────────────────────────────────────
TOOLS.fractal = {
  name: 'Fractal', icon: '✦',
  render(canvas, ctx, p) {
    const W=canvas.width,H=canvas.height;
    const id=ctx.createImageData(W,H); const d=id.data;
    const palette=GS.getPalette(p.palette);
    const maxIter=p.iterations||80;
    const cx=p.cx||-0.5, cy=p.cy||0;
    const zoom=p.zoom||1;
    for(let py=0;py<H;py++){
      for(let px=0;px<W;px++){
        let x=(px-W/2)/(W/4/zoom)+cx;
        let y=(py-H/2)/(H/4/zoom)+cy;
        const c0x=x,c0y=y;
        let iter=0, mag=0;
        while(iter<maxIter){
          if(p.type==='Julia'){
            const nx=x*x-y*y+p.juliaC||(-0.7);
            const ny=2*x*y+(p.juliaCi||0.27);
            x=nx; y=ny;
          } else if(p.type==='Burning Ship'){
            const nx=x*x-y*y+c0x;
            const ny=2*Math.abs(x*y)+c0y;
            x=nx; y=ny;
          } else {
            // Mandelbrot
            const nx=x*x-y*y+c0x;
            const ny=2*x*y+c0y;
            x=nx; y=ny;
          }
          mag=x*x+y*y;
          if(mag>4)break;
          iter++;
        }
        const t=iter===maxIter?0:iter/maxIter;
        const col=GS.hexToRgb(GS.colorAtGradient(
          palette.map((c,i)=>[i/(palette.length-1),c]),
          p.colorCycles>0?((t*p.colorCycles)%1):t
        ));
        const i=(py*W+px)*4; d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255;
      }
    }
    ctx.putImageData(id,0,0);
  }
};

// ──────────────────────────────────────────────────────────────
// 16. PIXEL SORT
// ──────────────────────────────────────────────────────────────
TOOLS.pixelSort = {
  name: 'Pixel Sort', icon: '▦',
  render(canvas, ctx, p, src) {
    const W=canvas.width,H=canvas.height;
    if(!src){
      // generate base gradient
      const gr=ctx.createLinearGradient(0,0,W,H);
      GS.getPalette(p.palette).forEach((c,i,a)=>gr.addColorStop(i/(a.length-1),c));
      ctx.fillStyle=gr; ctx.fillRect(0,0,W,H);
      GS.applyGrain(ctx,W,H,20);
    } else { ctx.drawImage(src,0,0,W,H); }
    const id=ctx.getImageData(0,0,W,H); const d=id.data;
    const threshold=p.threshold/100;
    function brightness(i){return(d[i]+d[i+1]+d[i+2])/(3*255);}
    if(p.direction==='Horizontal'||p.direction==='Both'){
      for(let y=0;y<H;y++){
        const row=[];
        for(let x=0;x<W;x++) row.push({x,b:brightness((y*W+x)*4),r:d[(y*W+x)*4],g:d[(y*W+x)*4+1],b2:d[(y*W+x)*4+2]});
        let start=-1;
        for(let x=0;x<=W;x++){
          const b=x<W?row[x].b:1;
          if(start===-1&&b>threshold) start=x;
          else if(start>-1&&(b<=threshold||x===W)){
            const seg=row.slice(start,x).sort((a,b)=>p.sortBy==='Hue'?
              GS.rgbToHsl(a.r,a.g,a.b2)[0]-GS.rgbToHsl(b.r,b.g,b.b2)[0]:a.b-b.b);
            seg.forEach((px,i2)=>{const idx=(y*W+start+i2)*4;d[idx]=px.r;d[idx+1]=px.g;d[idx+2]=px.b2;});
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
          if(start===-1&&b>threshold) start=y;
          else if(start>-1&&(b<=threshold||y===H)){
            const seg=[];
            for(let r=start;r<y;r++) seg.push({y:r,b:brightness((r*W+x)*4),r:d[(r*W+x)*4],g:d[(r*W+x)*4+1],b2:d[(r*W+x)*4+2]});
            seg.sort((a,b2)=>a.b-b2.b);
            seg.forEach((px,i2)=>{const idx=((start+i2)*W+x)*4;d[idx]=px.r;d[idx+1]=px.g;d[idx+2]=px.b2;});
            start=-1;
          }
        }
      }
    }
    ctx.putImageData(id,0,0);
  }
};

// ──────────────────────────────────────────────────────────────
// 17. TRUCHET (Tiling patterns)
// ──────────────────────────────────────────────────────────────
TOOLS.truchet = {
  name: 'Truchet', icon: '⊕',
  render(canvas, ctx, p) {
    const W=canvas.width,H=canvas.height;
    ctx.fillStyle=p.bg; ctx.fillRect(0,0,W,H);
    const rng=GS.seededRandom(p.seed);
    const palette=GS.getPalette(p.palette);
    const ts=p.tileSize;
    const cols=Math.ceil(W/ts)+1, rows=Math.ceil(H/ts)+1;
    ctx.lineWidth=p.stroke; ctx.strokeStyle=palette[0];
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const x=c*ts-(W%ts)/2, y=r*ts-(H%ts)/2;
        const flip=rng()<0.5;
        const col=palette[Math.floor(rng()*palette.length)];
        ctx.fillStyle=col; ctx.strokeStyle=p.twoColor?palette[(Math.floor(rng()*palette.length)+1)%palette.length]:palette[0];
        ctx.save(); ctx.rect(x,y,ts,ts); ctx.clip();
        if(p.type==='Classic'){
          ctx.beginPath();
          if(flip){ctx.arc(x,y,ts/2,0,Math.PI/2);ctx.arc(x+ts,y+ts,ts/2,Math.PI,Math.PI*3/2);}
          else{ctx.arc(x+ts,y,ts/2,Math.PI/2,Math.PI);ctx.arc(x,y+ts,ts/2,Math.PI*3/2,Math.PI*2);}
          ctx.stroke();
        } else if(p.type==='Diagonal'){
          ctx.beginPath();
          if(flip){ctx.moveTo(x,y);ctx.lineTo(x+ts,y+ts);}
          else{ctx.moveTo(x+ts,y);ctx.lineTo(x,y+ts);}
          ctx.stroke();
        } else if(p.type==='SquareCurve'){
          ctx.fillRect(flip?x:x+ts/2,flip?y:y+ts/2,ts/2,ts/2);
        } else if(p.type==='Triangle'){
          ctx.beginPath();
          if(flip){ctx.moveTo(x,y);ctx.lineTo(x+ts,y);ctx.lineTo(x,y+ts);}
          else{ctx.moveTo(x+ts,y);ctx.lineTo(x+ts,y+ts);ctx.lineTo(x,y+ts);}
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
    }
    if(p.grain>0) GS.applyGrain(ctx,W,H,p.grain);
  }
};

// ──────────────────────────────────────────────────────────────
// 18. CRYSTAL (Geometric low-poly)
// ──────────────────────────────────────────────────────────────
TOOLS.crystal = {
  name: 'Crystal', icon: '◈',
  render(canvas, ctx, p) {
    const W=canvas.width,H=canvas.height;
    ctx.fillStyle=p.bg; ctx.fillRect(0,0,W,H);
    const rng=GS.seededRandom(p.seed);
    const palette=GS.getPalette(p.palette);
    const pts=[];
    // grid with jitter
    const cols=p.cols||12, rows=p.rows||12;
    const cw=W/cols, ch=H/rows;
    for(let r=-1;r<=rows+1;r++) for(let c=-1;c<=cols+1;c++){
      pts.push({
        x:c*cw+cw/2+(rng()-0.5)*cw*p.jitter/100,
        y:r*ch+ch/2+(rng()-0.5)*ch*p.jitter/100
      });
    }
    // simple delaunay-like triangulation
    const triangles=[];
    for(let r=0;r<rows+1;r++) for(let c=0;c<cols+1;c++){
      const i=r*(cols+2)+c;
      triangles.push([pts[i],pts[i+1],pts[i+cols+2]]);
      triangles.push([pts[i+1],pts[i+cols+2],pts[i+cols+3]]);
    }
    triangles.forEach(([a,b,c])=>{
      const cx=(a.x+b.x+c.x)/3, cy=(a.y+b.y+c.y)/3;
      const t=(cx/W+cy/H)/2;
      const n=GS.noise2d(cx/W*3+p.seed,cy/H*3+p.seed);
      const col=palette[Math.floor(((n+1)/2)*palette.length)%palette.length];
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.lineTo(c.x,c.y); ctx.closePath();
      ctx.fillStyle=col; ctx.fill();
      if(p.stroke>0){ ctx.strokeStyle=p.lineColor||'rgba(0,0,0,0.2)'; ctx.lineWidth=p.stroke; ctx.stroke(); }
    });
    if(p.grain>0) GS.applyGrain(ctx,W,H,p.grain);
  }
};

// ──────────────────────────────────────────────────────────────
// 19. SPIROGRAPH
// ──────────────────────────────────────────────────────────────
TOOLS.spirograph = {
  name: 'Spirograph', icon: '❋',
  render(canvas, ctx, p) {
    const W=canvas.width,H=canvas.height;
    ctx.fillStyle=p.bg; ctx.fillRect(0,0,W,H);
    const stops=p.stops||[[0,p.c1||'#7c5cfc'],[1,p.c2||'#f5d0fe']];
    const cx=W/2, cy=H/2;
    const R=p.R||Math.min(W,H)*0.35;
    const r=p.r||Math.min(W,H)*0.15;
    const d=p.d||r*0.7;
    const steps=p.steps||3000;
    ctx.lineWidth=p.stroke||1;
    ctx.beginPath();
    for(let i=0;i<=steps;i++){
      const t=i/steps*Math.PI*2*p.loops;
      const x=cx+(R-r)*Math.cos(t)+d*Math.cos((R-r)/r*t);
      const y=cy+(R-r)*Math.sin(t)-d*Math.sin((R-r)/r*t);
      const col=GS.colorAtGradient(stops,i/steps);
      if(i>0){ctx.strokeStyle=col;ctx.stroke();ctx.beginPath();}
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.stroke();
    if(p.grain>0) GS.applyGrain(ctx,W,H,p.grain);
  }
};

// ──────────────────────────────────────────────────────────────
// 20. FLOW FIELD
// ──────────────────────────────────────────────────────────────
TOOLS.flowField = {
  name: 'Flow Field', icon: '⟳',
  render(canvas, ctx, p) {
    const W=canvas.width,H=canvas.height;
    ctx.fillStyle=p.bg; ctx.fillRect(0,0,W,H);
    const rng=GS.seededRandom(p.seed);
    const palette=GS.getPalette(p.palette);
    const particles=[];
    for(let i=0;i<p.count;i++){
      particles.push({x:rng()*W,y:rng()*H,age:0,maxAge:p.life+rng()*p.life,col:palette[Math.floor(rng()*palette.length)]});
    }
    ctx.lineWidth=p.weight;
    for(let step=0;step<p.steps;step++){
      particles.forEach(pt=>{
        if(pt.age>=pt.maxAge){pt.x=rng()*W;pt.y=rng()*H;pt.age=0;return;}
        const angle=GS.fbm(pt.x/W*p.scale+p.seed/100,pt.y/H*p.scale+p.seed/100,p.octaves)*Math.PI*2*p.curl;
        const nx=pt.x+Math.cos(angle)*p.speed;
        const ny=pt.y+Math.sin(angle)*p.speed;
        ctx.globalAlpha=(1-pt.age/pt.maxAge)*p.opacity/100;
        ctx.strokeStyle=pt.col;
        ctx.beginPath(); ctx.moveTo(pt.x,pt.y); ctx.lineTo(nx,ny); ctx.stroke();
        pt.x=((nx%W)+W)%W; pt.y=((ny%H)+H)%H; pt.age++;
      });
    }
    ctx.globalAlpha=1;
    if(p.grain>0) GS.applyGrain(ctx,W,H,p.grain);
  }
};
