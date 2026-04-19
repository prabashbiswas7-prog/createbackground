import re

with open('js/app.js', 'r') as f:
    app_content = f.read()

# Add to TOOL_ORDER
app_content = app_content.replace("'flowField'", "'flowField','webImage'")

# Add defaults
defaults_patch = """  flowField: { w:1200,h:1200,seed:0,count:500,life:80,steps:150,speed:2,scale:3,octaves:2,curl:1,weight:1,opacity:40,palette:'Terminal',bg:'#050505',grain:0 },
  webImage:  { w:1200,h:1200,seed:100,grayscale:false,blur:0,tint:'#000000',tintOpacity:0 },"""
app_content = app_content.replace("  flowField: { w:1200,h:1200,seed:0,count:500,life:80,steps:150,speed:2,scale:3,octaves:2,curl:1,weight:1,opacity:40,palette:'Terminal',bg:'#050505',grain:0 },", defaults_patch)

# Add to panels
panels_patch = """
    webImage: CANVAS_SEC(p) +
      SEC('Image Source',
        R('seed','Image ID (Seed)',p.seed,1,1000,1)
      ) +
      SEC('Filters',
        T('grayscale','Grayscale',p.grayscale) +
        R('blur','Blur',p.blur,0,20,1)
      ) +
      SEC('Tint',
        C2('tint','Tint Color',p.tint) +
        R('tintOpacity','Tint Opacity',p.tintOpacity,0,100,1)
      ),
"""
app_content = app_content.replace("    flowField: CANVAS_SEC(p) +", panels_patch + "\n    flowField: CANVAS_SEC(p) +")

with open('js/app.js', 'w') as f:
    f.write(app_content)

with open('js/tools.js', 'r') as f:
    tools_content = f.read()

# Add WebImage tool
webimage_tool = """
// ── 21. WEB IMAGE ──────────────────────────────────────────────
TOOLS.webImage = {
  name: 'Web Image', icon: '🌐',
  render(C, cx, p) {
    const W = C.width, H = C.height;
    cx.fillStyle = p.bg || '#000'; cx.fillRect(0, 0, W, H);

    const imgUrl = `https://picsum.photos/id/${p.seed}/${W}/${H}${p.grayscale ? '?grayscale' : ''}${p.blur > 0 ? (p.grayscale ? '&' : '?') + 'blur=' + p.blur : ''}`;

    // We use a global cache to avoid infinite re-renders on slider drag
    window.__webImageCache = window.__webImageCache || {};

    if (window.__webImageCache.url !== imgUrl) {
       // Draw loading state
       cx.fillStyle = '#111'; cx.fillRect(0,0,W,H);
       cx.fillStyle = '#fff'; cx.font = '20px Arial'; cx.fillText('Loading from internet...', W/2 - 100, H/2);

       const img = new Image();
       img.crossOrigin = 'Anonymous';
       img.onload = () => {
           window.__webImageCache = { url: imgUrl, img: img };
           // force re-render once loaded
           if (window.params && window.params.current === 'webImage') {
               // A bit hacky, but will trigger schedRender since we don't have access to it directly here
               document.getElementById('tool-name')?.click(); // trigger dummy event if possible, or just draw
           }
           // We'll draw immediately anyway
           drawWebImage(C, cx, p, img);
       };
       img.src = imgUrl;
    } else {
       drawWebImage(C, cx, p, window.__webImageCache.img);
    }

    function drawWebImage(C, cx, p, img) {
        cx.drawImage(img, 0, 0, C.width, C.height);
        if (p.tintOpacity > 0) {
            cx.fillStyle = p.tint;
            cx.globalAlpha = p.tintOpacity / 100;
            cx.fillRect(0, 0, C.width, C.height);
            cx.globalAlpha = 1;
        }
    }
  }
};
"""
tools_content = tools_content + webimage_tool

with open('js/tools.js', 'w') as f:
    f.write(tools_content)
