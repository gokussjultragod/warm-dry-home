// Zero-dependency static site builder. Run: node build.js  -> outputs ./dist
// Each file in content/ starts with a JSON header between <!--- and ---> then HTML body.
const fs = require("fs");
const path = require("path");

const SITE = {
  name: "Warm Dry Home",
  url: "https://warmdryhome.co.uk",
  tagline: "Honest guides to keeping a UK home warm, dry and cheap to run",
};

const root = __dirname;
const out = path.join(root, "dist");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function parse(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^<!---([\s\S]*?)--->\s*([\s\S]*)$/);
  if (!m) throw new Error(`Missing header in ${file}`);
  return { ...JSON.parse(m[1]), body: m[2] };
}

const disclosure = `<p class="disclosure">This page contains affiliate links. If you buy through them we may earn a commission at no extra cost to you. <a href="/affiliate-disclosure/">How we make money</a>.</p>`;

function layout({ title, description, slug, body, isArticle, updated }) {
  const canonical = `${SITE.url}/${slug ? slug + "/" : ""}`;
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}${slug ? " | " + SITE.name : ""}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header class="site"><a class="brand" href="/">${SITE.name}</a>
<nav><a href="/guides/">Guides</a><a href="/about/">About</a></nav></header>
<main>
${isArticle ? `<article><h1>${esc(title)}</h1><p class="meta">Updated ${updated}</p>${disclosure}${body}</article>` : body}
</main>
<footer class="site"><p>&copy; ${new Date().getFullYear()} ${SITE.name}. ${SITE.tagline}.</p>
<p><a href="/affiliate-disclosure/">Affiliate disclosure</a> · <a href="/privacy/">Privacy</a> · <a href="/about/">About</a></p>
<p class="small">As an Amazon Associate we earn from qualifying purchases.</p></footer>
</body>
</html>`;
}

function write(slug, html) {
  const dir = path.join(out, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

const pages = fs.readdirSync(path.join(root, "content"))
  .filter((f) => f.endsWith(".html"))
  .map((f) => parse(path.join(root, "content", f)));

const articles = pages.filter((p) => p.type === "article")
  .sort((a, b) => b.updated.localeCompare(a.updated));

for (const p of pages) {
  write(p.slug, layout({ ...p, isArticle: p.type === "article" }));
}

const cards = articles.map((a) =>
  `<li><a href="/${a.slug}/"><strong>${esc(a.title)}</strong></a><br><span>${esc(a.description)}</span></li>`).join("\n");

write("", layout({
  title: `${SITE.name}: ${SITE.tagline}`,
  description: "Practical, numbers-first guides to dehumidifiers, heated airers, electric blankets and cheap ways to heat a UK home.",
  slug: "",
  body: `<section class="hero"><h1>Keep your home warm and dry without a huge energy bill</h1>
<p>We work out what things actually cost to run on UK electricity prices, explain the trade-offs in plain English and only then point you to products worth buying.</p></section>
<h2>Latest guides</h2><ul class="cards">${cards}</ul>`,
}));

write("guides", layout({
  title: "All guides",
  description: "Every Warm Dry Home guide in one place.",
  slug: "guides",
  body: `<h1>All guides</h1><ul class="cards">${cards}</ul>`,
}));

for (const f of fs.readdirSync(path.join(root, "static"))) {
  fs.copyFileSync(path.join(root, "static", f), path.join(out, f));
}

const urls = ["", "guides", ...pages.map((p) => p.slug)];
fs.writeFileSync(path.join(out, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `<url><loc>${SITE.url}/${u ? u + "/" : ""}</loc></url>`).join("\n") + `\n</urlset>\n`);
fs.writeFileSync(path.join(out, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);

console.log(`Built ${pages.length + 2} pages into dist/`);
