#!/usr/bin/env node
/* Run once the live domain is known (and again if it changes):

     node scripts/set-domain.mjs https://www.yourdomain.com

   It writes, for all four pages:
     • <link rel="canonical">, og:url
     • hreflang alternates (en, zh-Hans, ru, id, x-default) using ?lang=
     • absolute URLs inside the JSON-LD structured data
   and generates sitemap.xml (with hreflang) and robots.txt,
   and stores the domain in assets/scripts/config.js (BUSINESS.siteUrl).

   URLs are "clean" (/explore, not /explore.html), matching how
   Cloudflare Pages serves .html files.                              */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv[2];
if (!arg || !/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(arg.replace(/\/$/, ''))) {
  console.error('Usage: node scripts/set-domain.mjs https://www.yourdomain.com');
  process.exit(1);
}
const site = arg.replace(/\/$/, '');
const PAGES = [
  { file: 'index.html', path: '/', priority: '1.0' },
  { file: 'explore.html', path: '/explore', priority: '0.9' },
  { file: 'services.html', path: '/services', priority: '0.9' },
  { file: 'about.html', path: '/about', priority: '0.8' },
  { file: 'experience-local.html', path: '/experience-local', priority: '0.9' },
  { file: 'experience-solo.html', path: '/experience-solo', priority: '0.9' },
];
const LANGS = [['en', null], ['zh-Hans', 'zh-CN'], ['ru', 'ru'], ['id', 'id']];
const urlFor = (path, lang) => site + path + (lang ? `?lang=${lang}` : '');
const fileToPath = Object.fromEntries(PAGES.map(p => [p.file, p.path]));

for (const p of PAGES) {
  const fp = join(root, p.file);
  let html = readFileSync(fp, 'utf8');
  const block = [
    `<!-- seo:urls -->`,
    `  <link rel="canonical" href="${urlFor(p.path)}">`,
    ...LANGS.map(([hl, q]) => `  <link rel="alternate" hreflang="${hl}" href="${urlFor(p.path, q)}">`),
    `  <link rel="alternate" hreflang="x-default" href="${urlFor(p.path)}">`,
    `  <meta property="og:url" content="${urlFor(p.path)}">`,
    `  <!-- /seo:urls -->`,
  ].join('\n');
  html = html.replace(/<!-- seo:urls -->[\s\S]*?<!-- \/seo:urls -->/, block);

  // JSON-LD: make page links absolute and add the site URL to the business/website.
  html = html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (_, a, json, b) => {
    let j = json
      .replace(/"(item|url)": "(?:https?:\/\/[^/"]+)?\/?([a-z]+\.html)?(#[^"]*)?"/g, (m, key, file, hash) => {
        if (key === 'url' && m.includes('wa.me')) return m;
        if (!file && !hash) return m;
        const path = file ? fileToPath[file] ?? `/${file}` : p.path;
        return `"${key}": "${site}${path}${hash || ''}"`;
      })
      .replace(/"@id": "(?:https?:\/\/[^"#]+)?#(website|business)"/g, `"@id": "${site}/#$1"`);
    if (p.file === 'index.html') {
      j = j.replace(/("@id": "[^"]+#website",)(\s*\n\s*"url": "[^"]*",)?/, `$1\n        "url": "${site}/",`)
           .replace(/("@id": "[^"]+#business",)(\s*\n\s*"url": "[^"]*",)?/, `$1\n        "url": "${site}/",`);
    }
    return a + j + b;
  });
  writeFileSync(fp, html);
}

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${PAGES.flatMap(p => LANGS.map(([, q]) => `  <url>
    <loc>${urlFor(p.path, q).replace(/&/g, '&amp;')}</loc>
    <lastmod>${today}</lastmod>
    <priority>${q ? (Number(p.priority) - 0.1).toFixed(1) : p.priority}</priority>
${LANGS.map(([hl, q2]) => `    <xhtml:link rel="alternate" hreflang="${hl}" href="${urlFor(p.path, q2)}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(p.path)}"/>
  </url>`)).join('\n')}
</urlset>
`;
writeFileSync(join(root, 'sitemap.xml'), sitemap);
writeFileSync(join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);

const cfg = join(root, 'assets/scripts/config.js');
writeFileSync(cfg, readFileSync(cfg, 'utf8').replace(/siteUrl: '[^']*'/, `siteUrl: '${site}'`));

console.log(`Done. Canonical, hreflang, og:url and JSON-LD now use ${site}.\nGenerated sitemap.xml (${PAGES.length * LANGS.length} URLs) and robots.txt.`);
