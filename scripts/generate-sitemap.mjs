import { readFileSync, writeFileSync } from "node:fs";
const pages = JSON.parse(readFileSync(new URL("../src/lib/seo-routes.json", import.meta.url), "utf8"));
const escape = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
// No lastmod: there is no authoritative page-specific content-change timestamp.
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + pages.map(({path}) => `  <url><loc>${escape(`https://physicshq.in${path}`)}</loc></url>`).join("\n") + '\n</urlset>\n';
writeFileSync(new URL("../public/sitemap.xml", import.meta.url), xml);