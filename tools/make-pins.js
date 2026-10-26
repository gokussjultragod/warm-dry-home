// Renders Pinterest pin images (1000x1500) into static/pins/ and a bulk-upload CSV into tools/.
// Run locally: node tools/make-pins.js  (needs Playwright; not used by the site build)
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const root = path.join(__dirname, "..");
const pins = JSON.parse(fs.readFileSync(path.join(__dirname, "pins.json"), "utf8"));
const SITE = "https://warmdryhome.co.uk";
const COLORS = {
  dehumidifiers: ["#2f7fae", "#e5f0f7"], drying: ["#8a5cb8", "#f0e8f7"],
  heating: ["#c2502f", "#fbe9e3"], damp: ["#2e8a6a", "#e3f3ec"],
};
const BOARDS = {
  dehumidifiers: "Dehumidifier Tips UK", drying: "Drying Clothes Indoors UK",
  heating: "Cheap Ways to Heat Your Home UK", damp: "Damp, Condensation & Mould UK",
};
// Pull the icon paths straight from the site builder so pins match the site.
const buildSrc = fs.readFileSync(path.join(root, "build.js"), "utf8");
const icon = (k) => buildSrc.match(new RegExp(`${k}: \`(<svg[\\s\\S]*?</svg>)\``))[1]
  .replace(/width="24" height="24"/, 'width="220" height="220"').replace(/stroke-width="1.8"/, 'stroke-width="1.6"');

const html = (p) => {
  const [c, tint] = COLORS[p.cat];
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Inter:wght@500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{width:1000px;height:1500px;background:${tint};font-family:Inter,sans-serif;color:#22262b;display:flex;flex-direction:column;padding:80px 76px 64px;position:relative;overflow:hidden}
.art{flex:1;display:flex;align-items:center;justify-content:center;position:relative}
.blob{position:absolute;width:520px;height:520px;border-radius:50%;background:#f6c56b;opacity:.5;transform:translate(90px,-30px)}
.icon{width:380px;height:380px;border-radius:50%;box-shadow:0 20px 50px rgba(0,0,0,.08);background:#fff;color:${c};display:flex;align-items:center;justify-content:center;position:relative}
.kicker{font-weight:700;font-size:34px;letter-spacing:.06em;text-transform:uppercase;color:${c}}
h1{font-family:Fraunces,serif;font-size:96px;line-height:1.05;margin-top:22px;letter-spacing:-.015em}
.stat{background:#fff;border-radius:36px;padding:44px 48px;display:flex;align-items:center;gap:36px;border-left:16px solid ${c}}
.stat b{font-family:Fraunces,serif;font-size:120px;line-height:1;color:${c};white-space:nowrap}
.stat span{font-size:36px;line-height:1.3;font-weight:600}
.foot{margin-top:44px;display:flex;justify-content:space-between;align-items:center;font-size:34px;font-weight:700}
.btn{background:${c};color:#fff;padding:18px 34px;border-radius:999px;font-size:30px}
.brand{display:flex;align-items:center;gap:14px}
</style></head><body>
<p class="kicker">${p.kicker}</p>
<h1>${p.hook}</h1>
<div class="art"><div class="blob"></div><div class="icon">${icon(p.cat)}</div></div>
<div class="stat"><b>${p.stat}</b><span>${p.statLabel}</span></div>
<div class="foot"><span class="brand"><svg viewBox="0 0 32 32" width="52" height="52"><path d="M4 15 16 5l12 10v12H4z" fill="#c2502f"/><path d="M16 13c2.6 3.2 4 5.2 4 7a4 4 0 0 1-8 0c0-1.8 1.4-3.8 4-7z" fill="#fff"/></svg>warmdryhome.co.uk</span><span class="btn">Read the guide →</span></div>
</body></html>`;
};

(async () => {
  const outDir = path.join(root, "static", "pins");
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 1500 } });
  for (const p of pins) {
    await page.setContent(html(p), { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(outDir, `${p.slug}.png`) });
  }
  await browser.close();

  // Pinterest bulk upload format: Title, Media URL, Pinterest board, Thumbnail, Description, Link, Publish date, Keywords
  const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const rows = pins.map((p) => [p.title, `${SITE}/pins/${p.slug}.png`, BOARDS[p.cat], "", p.desc,
    `${SITE}/${p.slug}/?utm_source=pinterest`, "", ""].map(q).join(","));
  fs.writeFileSync(path.join(__dirname, "pinterest-bulk-upload.csv"),
    "Title,Media URL,Pinterest board,Thumbnail,Description,Link,Publish date,Keywords\n" + rows.join("\n") + "\n");
  console.log(`Made ${pins.length} pins`);
})();
