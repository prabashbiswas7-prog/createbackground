import re

with open('js/app.js', 'r') as f:
    content = f.read()

# Update defaults
default_search = "blocks:    { w:1200,h:1200,seed:42,type:'Mondrian',count:10,complexity:4,asymmetry:50,bg:'#ffffff',palette:'Mondrian',density:40,stroke:2,lineColor:'#111111',wobble:40,minSize:24,padding:0,rounding:0,opacity:100,splitBias:50 },"
default_replace = "blocks:    { w:1200,h:1200,seed:42,type:'Mondrian',count:10,complexity:4,asymmetry:50,bg:'#ffffff',palette:'Mondrian',density:40,stroke:2,lineColor:'#111111',wobble:40,minSize:24,padding:0,rounding:0,opacity:100,splitBias:50,rotation:0,rotationJitter:0,sparsity:0,innerShapes:0,gradientChance:0,patternChance:0,shadowBlur:0,shadowX:0,shadowY:0,shadowIntensity:50 },"
content = content.replace(default_search, default_replace)

# Update UI
ui_search = """    blocks: SEC('Color',
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
      ) ,"""

ui_replace = """    blocks: SEC('Color',
        C2('bg','Background',p.bg) +
        PAL(p) +
        R('density','Color Density',p.density,0,100,1) +
        C2('lineColor','Border Color',p.lineColor) +
        R('opacity','Opacity',p.opacity,0,100,1) +
        R('gradientChance','Gradient Chance',p.gradientChance,0,100,1)
      ) +
      SEC('Pattern',
        R('seed','Seed',p.seed,0,9999,1) +
        S('type','Type',['Mondrian','Columns','Rows','Grid'],p.type) +
        R('count','Depth',p.count,2,20,1) +
        R('complexity','Split Chance',p.complexity,1,10,0.1) +
        R('asymmetry','Asymmetry',p.asymmetry,0,100,1) +
        R('minSize','Min Size',p.minSize,10,200,1) +
        R('splitBias','Split Bias',p.splitBias,0,100,1) +
        R('patternChance','Pattern Chance',p.patternChance,0,100,1) +
        R('innerShapes','Inner Shapes',p.innerShapes,0,10,1) +
        R('sparsity','Sparsity',p.sparsity,0,100,1)
      ) +
      SEC('Flow',
        R('rotation','Layout Rotation',p.rotation,0,360,1,'°') +
        R('rotationJitter','Rotation Jitter',p.rotationJitter,0,45,1,'°') +
        R('padding','Padding',p.padding,0,50,1) +
        R('stroke','Line Weight',p.stroke,0,20,0.5) +
        R('wobble','Edge Wobble',p.wobble,0,100,1) +
        R('rounding','Corner Rounding',p.rounding,0,100,1)
      ) +
      SEC('Depth & Light',
        R('shadowBlur','Shadow Blur',p.shadowBlur,0,50,1) +
        R('shadowX','Shadow X',p.shadowX,-50,50,1) +
        R('shadowY','Shadow Y',p.shadowY,-50,50,1) +
        R('shadowIntensity','Shadow Intensity',p.shadowIntensity,0,100,1)
      ) ,"""

content = content.replace(ui_search, ui_replace)

with open('js/app.js', 'w') as f:
    f.write(content)
