# Warm Dry Home (warmdryhome.co.uk)

UK affiliate site: warm, dry, cheap-to-run homes (dehumidifiers, heated airers, electric blankets).

- Articles live in `content/*.html` (JSON header between `<!---` and `--->`, then HTML).
- Build: `node build.js` → `dist/` (no dependencies).
- Hosting plan: GitHub repo → Cloudflare Pages (build command `node build.js`, output `dist`).
- Affiliate link spots are marked `<!-- AFF: ... -->` until Amazon Associates UK / Awin accounts are approved.
- Prices in sums use 25p/kWh; review when the Ofgem cap changes.
