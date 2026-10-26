// Zero-dependency static site builder. Run: node build.js  -> outputs ./dist
// Each file in content/ starts with a JSON header between <!--- and ---> then HTML body.
const fs = require("fs");
const path = require("path");

// BASE_PATH lets the site live under a subfolder (e.g. /warm-dry-home on github.io) until a custom domain is set.
const BASE = (process.env.BASE_PATH || "").replace(/\/$/, "");
const SITE = {
  name: "Warm Dry Home",
  url: (process.env.SITE_URL || "https://warmdryhome.co.uk").replace(/\/$/, ""),
  tagline: "Honest guides to keeping a UK home warm, dry and cheap to run",
  amazonTag: "warmdryhome-21",
};

// Simple line icons, drawn with currentColor so they follow each category's colour.
const ICONS = {
  dehumidifiers: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="3" width="12" height="18" rx="2.5"/><path d="M9 7h6M9 10h6"/><path d="M12 13.5c1.3 1.6 2 2.6 2 3.5a2 2 0 0 1-4 0c0-.9.7-1.9 2-3.5z"/></svg>`,
  drying: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M4 6v14M20 6v14"/><path d="M7 6v6l2 2 2-2V6M13 6v8h4V6"/><path d="M4 20h16"/></svg>`,
  heating: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="9" width="18" height="10" rx="2"/><path d="M7 9v10M11 9v10M15 9v10"/><path d="M8 3c-.8 1 .8 2 0 3M12 3c-.8 1 .8 2 0 3M16 3c-.8 1 .8 2 0 3"/></svg>`,
  damp: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M12 3v18M4 12h16"/><path d="M7.5 6.5v1.5M16 15v2M8 15.5v1"/></svg>`,
  calculator: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="2.5" width="14" height="19" rx="2"/><rect x="8" y="5.5" width="8" height="4" rx="1"/><path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01"/></svg>`,
};

const CATEGORIES = {
  dehumidifiers: { name: "Dehumidifiers", blurb: "Which type to buy, where to put it and what it really costs to run." },
  drying: { name: "Drying washing indoors", blurb: "Heated airers, dehumidifiers and tumble dryers compared, pence per load." },
  heating: { name: "Heating for less", blurb: "Electric blankets, plug-in heaters and smarter heating habits." },
  damp: { name: "Damp, condensation & mould", blurb: "Stop wet windows and black mould, and keep humidity healthy." },
};

// <a data-amazon="search words">Label</a> becomes a tagged Amazon UK search link.
const amazonLinks = (html) => html.replace(/<a data-amazon="([^"]+)">/g, (_, q) =>
  `<a href="https://www.amazon.co.uk/s?k=${encodeURIComponent(q)}&amp;tag=${SITE.amazonTag}" rel="sponsored nofollow noopener" target="_blank">`);

const root = __dirname;
const cssVersion = require("crypto").createHash("md5").update(fs.readFileSync(path.join(root, "static", "style.css"))).digest("hex").slice(0, 8);
const out = path.join(root, "dist");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const prettyDate = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

function parse(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^<!---([\s\S]*?)--->\s*([\s\S]*)$/);
  if (!m) throw new Error(`Missing header in ${file}`);
  return { ...JSON.parse(m[1]), body: m[2] };
}

const disclosure = `<p class="disclosure">This page contains affiliate links. If you buy through them we may earn a commission at no extra cost to you. <a href="/affiliate-disclosure/">How we make money</a>.</p>`;

const logo = `<svg class="logo" viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path d="M4 15 16 5l12 10v12H4z" fill="var(--accent)"/><path d="M16 13c2.6 3.2 4 5.2 4 7a4 4 0 0 1-8 0c0-1.8 1.4-3.8 4-7z" fill="var(--bg)"/></svg>`;

function layout({ title, description, slug, body }) {
  const canonical = `${SITE.url}/${slug ? slug + "/" : ""}`;
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}${slug ? " | " + SITE.name : ""}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css?v=${cssVersion}">
</head>
<body>
<header class="site"><div class="wrap">
<a class="brand" href="/">${logo}<span>${SITE.name}</span></a>
<nav><a href="/guides/">Guides</a><a href="/running-cost-calculator/">Calculator</a><a href="/about/">About</a></nav>
</div></header>
<main>
${body}
</main>
<footer class="site"><div class="wrap">
<p class="brand-foot">${logo}<strong>${SITE.name}</strong></p>
<p>${SITE.tagline}.</p>
<p class="topics">${Object.entries(CATEGORIES).map(([k, c]) => `<a href="/topics/${k}/">${c.name}</a>`).join(" · ")}</p>
<p><a href="/affiliate-disclosure/">Affiliate disclosure</a> · <a href="/privacy/">Privacy</a> · <a href="/about/">About</a></p>
<p class="small">&copy; ${new Date().getFullYear()} ${SITE.name}. As an Amazon Associate we earn from qualifying purchases.</p>
</div></footer>
</body>
</html>`;
}

function write(slug, html) {
  const dir = path.join(out, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), amazonLinks(html).replace(/(href|src)="\/(?!\/)/g, `$1="${BASE}/`));
}

const pages = fs.readdirSync(path.join(root, "content"))
  .filter((f) => f.endsWith(".html"))
  .map((f) => parse(path.join(root, "content", f)));

const articles = pages.filter((p) => p.type === "article")
  .sort((a, b) => b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title));

const chip = (k) => `<a class="chip c-${k}" href="/topics/${k}/">${ICONS[k]}${CATEGORIES[k].name}</a>`;

const card = (a) => `<li class="card c-${a.category}"><a href="/${a.slug}/">
<span class="card-icon">${ICONS[a.category]}</span>
<span class="card-cat">${CATEGORIES[a.category].name}</span>
<strong>${esc(a.title)}</strong>
<span class="card-desc">${esc(a.description)}</span></a></li>`;
const cardList = (list) => `<ul class="cards">${list.map(card).join("\n")}</ul>`;

for (const p of pages) {
  if (p.type !== "article") {
    write(p.slug, layout({ ...p, body: `<div class="wrap narrow page">${p.body}</div>` }));
    continue;
  }
  const related = articles.filter((a) => a.category === p.category && a.slug !== p.slug);
  write(p.slug, layout({ ...p, body: `<div class="wrap narrow"><article>
<div class="article-head c-${p.category}">${chip(p.category)}<h1>${esc(p.title)}</h1>
<p class="meta">Updated ${prettyDate(p.updated)} · Prices worked out at UK electricity rates</p></div>
${disclosure}${p.body}
<aside class="calc-cta"><span class="card-icon">${ICONS.calculator}</span><div><strong>Work out your own costs</strong><br>Use our free <a href="/running-cost-calculator/">running cost calculator</a> for any appliance.</div></aside>
</article>
${related.length ? `<section class="related"><h2>More on ${CATEGORIES[p.category].name.toLowerCase()}</h2>${cardList(related)}</section>` : ""}
</div>` }));
}

const hero = `<section class="hero"><div class="wrap hero-grid">
<div><p class="eyebrow">Practical guides for UK homes</p>
<h1>Keep your home warm and dry without a huge energy bill</h1>
<p class="lead">We work out what things actually cost to run on UK electricity prices, explain the trade-offs in plain English and only then point you to products worth buying.</p>
<p class="hero-actions"><a class="btn" href="/running-cost-calculator/">Try the cost calculator</a><a class="btn ghost" href="/guides/">Browse all guides</a></p></div>
<svg class="hero-art" viewBox="0 0 240 200" aria-hidden="true">
<circle cx="170" cy="62" r="46" fill="var(--glow)"/>
<path d="M30 100 120 30l90 70v86H30z" fill="var(--card)" stroke="var(--text)" stroke-width="4" stroke-linejoin="round"/>
<rect x="56" y="112" width="44" height="40" rx="4" fill="var(--glow)" stroke="var(--text)" stroke-width="4"/>
<path d="M78 112v40M56 132h44" stroke="var(--text)" stroke-width="4"/>
<rect x="134" y="120" width="40" height="66" rx="4" fill="var(--accent)" stroke="var(--text)" stroke-width="4"/>
<circle cx="164" cy="155" r="3.5" fill="var(--text)"/>
<path d="M120 62c7 9 11 14 11 19a11 11 0 0 1-22 0c0-5 4-10 11-19z" fill="var(--blue)" stroke="var(--text)" stroke-width="3.5"/>
<path d="M10 186h220" stroke="var(--text)" stroke-width="4" stroke-linecap="round"/>
</svg></div></section>`;

const topicGrid = `<ul class="topics-grid">${Object.entries(CATEGORIES).map(([k, c]) =>
  `<li class="topic c-${k}"><a href="/topics/${k}/"><span class="card-icon">${ICONS[k]}</span><strong>${c.name}</strong><span>${c.blurb}</span></a></li>`).join("")}</ul>`;

const promises = `<ul class="promises">
<li><strong>Numbers first</strong><span>Every guide shows the running cost in pence, using UK prices.</span></li>
<li><strong>Plain English</strong><span>No jargon, no 3,000-word waffle before the answer.</span></li>
<li><strong>Honest picks</strong><span>If you don't need to buy anything, we say so.</span></li></ul>`;

write("", layout({
  title: `${SITE.name}: ${SITE.tagline}`,
  description: "Practical, numbers-first guides to dehumidifiers, heated airers, electric blankets and cheap ways to heat a UK home.",
  slug: "",
  body: `${hero}<div class="wrap">${promises}<h2>Browse by topic</h2>${topicGrid}<h2>Latest guides</h2>${cardList(articles.slice(0, 6))}
<p class="more"><a class="btn ghost" href="/guides/">See all ${articles.length} guides</a></p></div>`,
}));

write("guides", layout({
  title: "All guides",
  description: "Every Warm Dry Home guide in one place.",
  slug: "guides",
  body: `<div class="wrap"><h1>All guides</h1>${Object.entries(CATEGORIES).map(([k, c]) =>
    `<section class="group"><h2>${chip(k)}</h2>${cardList(articles.filter((a) => a.category === k))}</section>`).join("")}</div>`,
}));

for (const [k, c] of Object.entries(CATEGORIES)) {
  write(`topics/${k}`, layout({
    title: c.name,
    description: c.blurb,
    slug: `topics/${k}`,
    body: `<div class="wrap"><div class="article-head c-${k}"><span class="card-icon big">${ICONS[k]}</span><h1>${c.name}</h1><p class="lead">${c.blurb}</p></div>${cardList(articles.filter((a) => a.category === k))}</div>`,
  }));
}

for (const f of fs.readdirSync(path.join(root, "static"))) {
  fs.copyFileSync(path.join(root, "static", f), path.join(out, f));
}

const urls = ["", "guides", ...Object.keys(CATEGORIES).map((k) => `topics/${k}`), ...pages.map((p) => p.slug)];
fs.writeFileSync(path.join(out, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `<url><loc>${SITE.url}/${u ? u + "/" : ""}</loc></url>`).join("\n") + `\n</urlset>\n`);
fs.writeFileSync(path.join(out, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);

console.log(`Built ${urls.length} pages into dist/`);
