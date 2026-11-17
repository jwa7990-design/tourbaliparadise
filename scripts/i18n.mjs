#!/usr/bin/env node
/* Translation helper (no dependencies).

   node scripts/i18n.mjs extract   Copy English page text from the HTML
                                   (data-i18n* attributes) into locales/en.json.
   node scripts/i18n.mjs check     Report keys missing from zh-CN.json / ru.json / id.json
                                   (exits with code 1 if any are missing).       */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pages = readdirSync(root).filter(f => f.endsWith('.html'));
const readJSON = f => JSON.parse(readFileSync(join(root, 'locales', f), 'utf8'));

const decode = s => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
const clean = s => decode(s.replace(/\s+/g, ' ').trim());

function setPath(obj, key, value) {
  const parts = key.split('.');
  let o = obj;
  for (const p of parts.slice(0, -1)) o = (o[p] ??= {});
  o[parts.at(-1)] = value;
}
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, key, out); else out[key] = v;
  }
  return out;
}

function extract() {
  const en = readJSON('en.json');
  const found = {};
  for (const page of pages) {
    const html = readFileSync(join(root, page), 'utf8');
    // Text content: <tag ... data-i18n="key" ...>text</tag>  (leaf elements only)
    for (const m of html.matchAll(/<(\w+)\b([^>]*?)\sdata-i18n="([^"]+)"([^>]*)>([\s\S]*?)<\/\1>/g)) found[m[3]] = clean(m[5]);
    for (const m of html.matchAll(/<(\w+)\b([^>]*?)\sdata-i18n-html="([^"]+)"([^>]*)>([\s\S]*?)<\/\1>/g)) found[m[3]] = m[5].replace(/\s+/g, ' ').trim();
    // Attributes
    for (const [attr, target] of [['alt', 'alt'], ['content', 'content'], ['aria-label', 'aria-label']]) {
      const re = new RegExp(`<[^>]*\\sdata-i18n-${attr}="([^"]+)"[^>]*>`, 'g');
      for (const m of html.matchAll(re)) {
        const v = m[0].match(new RegExp(`\\s${target}="([^"]*)"`));
        if (v) found[m[1]] = clean(v[1]);
      }
    }
  }
  const flatEn = flatten(en);
  let added = 0; let changed = 0;
  for (const [k, v] of Object.entries(found)) {
    if (!(k in flatEn)) added++; else if (flatEn[k] !== v) changed++;
    setPath(en, k, v);
  }
  writeFileSync(join(root, 'locales', 'en.json'), JSON.stringify(en, null, 2) + '\n');
  console.log(`en.json: ${Object.keys(found).length} page keys (${added} new, ${changed} updated).`);
}

function check() {
  const en = flatten(readJSON('en.json'));
  let missing = 0;
  for (const f of ['zh-CN.json', 'ru.json', 'id.json']) {
    const other = flatten(readJSON(f));
    const miss = Object.keys(en).filter(k => !(k in other) || other[k] === '');
    const extra = Object.keys(other).filter(k => !(k in en));
    console.log(`${f}: ${Object.keys(en).length - miss.length}/${Object.keys(en).length} keys translated` +
      (miss.length ? `\n  missing: ${miss.join(', ')}` : '') + (extra.length ? `\n  unused: ${extra.join(', ')}` : ''));
    missing += miss.length;
  }
  process.exit(missing ? 1 : 0);
}

const cmd = { extract, check }[process.argv[2]];
if (cmd) cmd(); else console.log('Usage: node scripts/i18n.mjs extract|check');
