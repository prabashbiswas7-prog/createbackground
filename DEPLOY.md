# GenStudio — Deploy Guide
## GitHub → Cloudflare Pages (3 steps)

---

### Step 1 — Push to GitHub

```bash
cd genstudio/            # your project folder
git init
git add .
git commit -m "GenStudio v2 launch"

# Create repo on github.com named e.g. "genstudio"
git remote add origin https://github.com/YOUR_USER/genstudio.git
git branch -M main
git push -u origin main
```

---

### Step 2 — Cloudflare Pages

1. Go to **dash.cloudflare.com** → Workers & Pages → Create → Pages
2. Connect to Git → select your repo
3. Build settings:
   - **Framework preset:** `None`
   - **Build command:** *(leave blank)*
   - **Build output directory:** `/` *(or leave blank)*
4. **Save and Deploy**

Done. Live at `genstudio.pages.dev` in ~20s.

---

### Step 3 — Custom domain

**Use gen.51shades.in (recommended — free):**
1. Cloudflare Pages → your project → Custom Domains → Add custom domain
2. Type `gen.51shades.in`
3. Since 51shades.in is already on Cloudflare, it auto-adds the CNAME. Done.

**Or a standalone domain:**
1. Register on Cloudflare Registrar → add to CF account
2. Pages → Custom Domains → add it

SSL is automatic.

---

### AdSense Setup

Search `index.html` for `ca-pub-XXXXXXXXXXXXXXXX` and replace all 3 with your publisher ID.
Replace `data-ad-slot="0000000001"` and `data-ad-slot="0000000002"` with your actual slot IDs.

Commit → push → Cloudflare auto-redeploys.

---

### Future updates

```bash
# Any change:
git add . && git commit -m "update" && git push
# Cloudflare deploys automatically in ~20 seconds
```

---

### Adding a new tool

1. In `js/tools.js`, add:
```js
TOOLS.myTool = {
  name: 'My Tool', icon: '★',
  render(C, cx, p, img) { /* your code */ }
};
```

2. In `js/app.js`, add `'myTool'` to `TOOL_ORDER` array.

3. Add defaults to `DEFAULTS` object.

4. Add a `case 'myTool':` to `buildPanel()` with your controls HTML.

5. `git push` — live in 20s.

---

### File structure

```
genstudio/
├── index.html      ← App shell + AdSense slots
├── css/
│   └── main.css    ← Full design system (black/green terminal theme)
├── js/
│   ├── core.js     ← Noise, color utils, export helpers
│   ├── tools.js    ← 20 tool renderers
│   └── app.js      ← UI, controls, render loop
├── _headers        ← Cloudflare cache rules
├── _redirects      ← SPA routing
└── robots.txt
```

### Bugs fixed vs v1
- ✅ Seeded RNG is now deterministic (fixed Xorshift32 — not Math.random-based)
- ✅ Perlin noise uses a fixed permutation table (no randomness at load time)
- ✅ Canvas resize no longer triggers mid-render
- ✅ All tool renders wrapped in try/catch with visible error message
- ✅ Color inputs update correctly (no stale closures)
- ✅ Toggle buttons don't fire twice
- ✅ Upload zones work with both click and drag/drop
- ✅ Slider value displays update live (v_ prefix pattern)
- ✅ Voronoi edge detection uses consistent pixel comparison
- ✅ Flow field particles wrap correctly at canvas edges
- ✅ Spirograph R/r validation prevents divide-by-zero
- ✅ ASCII render works with and without image
- ✅ Dither handles missing src without crash
