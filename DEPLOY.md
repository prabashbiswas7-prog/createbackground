# GenStudio — Deployment Guide
## GitHub → Cloudflare Pages

---

## 1. Project Structure

```
genstudio/
├── index.html        ← main app
├── css/
│   └── main.css      ← all styles
├── js/
│   ├── core.js       ← noise, colors, helpers
│   ├── tools.js      ← all 20 tool renderers
│   └── app.js        ← UI, controls, init
├── _headers          ← Cloudflare cache headers
├── _redirects        ← SPA redirect rule
└── robots.txt
```

---

## 2. Create GitHub Repo

```bash
# In terminal, inside the genstudio/ folder:
git init
git add .
git commit -m "Initial GenStudio build"

# Create a repo on github.com (e.g. genstudio)
# Then connect:
git remote add origin https://github.com/YOUR_USERNAME/genstudio.git
git branch -M main
git push -u origin main
```

---

## 3. Deploy to Cloudflare Pages

1. Go to **dash.cloudflare.com** → Workers & Pages → Create → Pages
2. Click **Connect to Git** → authorize GitHub
3. Select your `genstudio` repo
4. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/` (or leave blank)
5. Click **Save and Deploy**

That's it. Cloudflare gives you:
`genstudio.pages.dev` live in ~30 seconds.

---

## 4. Connect Custom Domain

### Option A — Subdomain of 51shades.in (free, fastest)
1. In Cloudflare Pages → your project → Custom Domains → Add
2. Enter: `gen.51shades.in`
3. Cloudflare auto-adds a CNAME record since your domain is already on CF

### Option B — Standalone domain (e.g. genstudio.app)
1. Register domain on Cloudflare Registrar (cheapest) or Namecheap
2. Add to Cloudflare (change nameservers)
3. Pages → Custom Domains → add your domain
4. CF handles SSL automatically

---

## 5. Google AdSense Setup

1. Go to **adsense.google.com** → Add Site → enter your domain
2. Wait for approval (1–3 days for new sites)
3. Once approved, go to **Ads → By ad unit → Display ads**
4. Create 2 ad units:
   - **Sidebar unit** (250×90 or auto)
   - **Bottom banner** (responsive)
5. Copy each ad slot ID
6. In `index.html`, replace these 3 values:
   ```
   ca-pub-XXXXXXXXXXXXXXXX  →  your publisher ID (same in all 3 places)
   data-ad-slot="XXXXXXXXXX" → your sidebar slot ID
   data-ad-slot="XXXXXXXXXX" → your bottom banner slot ID
   ```
7. Commit and push → Cloudflare auto-redeploys

---

## 6. Future Deploys (always)

```bash
# After any change:
git add .
git commit -m "your message"
git push
# Cloudflare auto-detects the push and redeploys in ~20 seconds
```

---

## 7. Add New Tools Later

In `js/tools.js`, add:
```js
TOOLS.myNewTool = {
  name: 'My Tool', icon: '★',
  render(canvas, ctx, p) {
    // your rendering code
  }
};
```

In `js/app.js`, add `'myNewTool'` to the `toolOrder` array.
Add a case in `makeSidebarHTML()` for the controls panel.
Push. Done.

---

## 8. Monetisation Checklist

- [ ] AdSense approved & slots live
- [ ] PNG/JPG/SVG export working
- [ ] `gen.51shades.in` custom domain live
- [ ] Submit sitemap to Google Search Console
- [ ] Add Open Graph image for social sharing (`og:image`)
- [ ] Future: Export gating (free = watermark, Pro = 4K via Lemon Squeezy)

---

## 9. Tools Reference

| # | Tool | Key Options |
|---|------|------------|
| 1 | Blocks | Mondrian/Grid/Columns, seed, complexity, wobble, stroke |
| 2 | Gradients | Angle, noise, depth/light, grain, stops |
| 3 | Lines | 9 shapes, freq, amp, wobble, halftone, noise |
| 4 | Organic | Flow paths, harmonics, roughness, taper |
| 5 | Plotter | 7 shapes, grid/random/hex, size noise |
| 6 | Topo | Contour, octaves, gradient mode |
| 7 | Marble | FBM warp, wind, vein, 4-color |
| 8 | ASCII | Image load, 5 char sets, match colors |
| 9 | Dither | Bayer 4x4/8x8, 20 palettes, cell shape |
| 10 | Noise | FBM, domain warp, ridged, terraced |
| 11 | Circles | Concentric, bubble pack, grid |
| 12 | Typography | Scatter/stack/path, any font, glow |
| 13 | Waves | Layers, harmonics, interference, noise |
| 14 | Voronoi | Euclidean/Manhattan/Chebyshev, edges |
| 15 | Fractal | Mandelbrot, Julia, Burning Ship, zoom |
| 16 | Pixel Sort | H/V/Both, threshold, hue sort |
| 17 | Truchet | Classic/Diagonal/Triangle, two-color |
| 18 | Crystal | Low-poly triangulation, jitter |
| 19 | Spirograph | R/r/d, loops, gradient stroke |
| 20 | Flow Field | Particles, curl, FBM, opacity |
