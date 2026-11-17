/* Language handling: loads locales/*.json, translates [data-i18n*]
   elements, remembers the choice, never redirects. */
import { LANGUAGES, DEFAULT_LANGUAGE } from './config.js';
import { store } from './storage.js';

const KEY = 'bp_lang';
const cache = {};
let current = DEFAULT_LANGUAGE;
let dict = {};
let fallback = {};

const OG_LOCALE = { en: 'en_AU', 'zh-CN': 'zh_CN', ru: 'ru_RU', id: 'id_ID' };

export const getLang = () => current;

/** Language precedence: ?lang= in URL → saved choice → English. */
export function resolveInitialLang() {
  const param = new URLSearchParams(location.search).get('lang');
  if (param && LANGUAGES[param]) { store.set(KEY, param); return param; }
  const saved = store.get(KEY);
  if (saved && LANGUAGES[saved]) return saved;
  return DEFAULT_LANGUAGE;
}

/** A browser-language suggestion (never applied automatically). */
export function suggestedLang() {
  if (store.get(KEY) || store.get('bp_lang_suggest_dismissed')) return null;
  for (const l of navigator.languages || [navigator.language || '']) {
    const low = String(l).toLowerCase();
    if (low.startsWith('zh')) return 'zh-CN';
    if (low.startsWith('ru')) return 'ru';
    if (low.startsWith('id') || low.startsWith('in')) return 'id';
    if (low.startsWith('en')) return null;
  }
  return null;
}

async function load(lang) {
  if (cache[lang]) return cache[lang];
  const res = await fetch(`locales/${LANGUAGES[lang].file}`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Locale ${lang} failed: ${res.status}`);
  cache[lang] = await res.json();
  return cache[lang];
}

function lookup(obj, key) {
  return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

/** Translate a key. {name} placeholders are replaced from vars. */
export function t(key, vars = {}) {
  let s = lookup(dict, key);
  if (s === undefined) s = lookup(fallback, key);
  if (s === undefined) return key;
  if (typeof s !== 'string') return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
}

/** Translate a key in a specific (possibly not active) language. */
export async function translateIn(lang, key) {
  try { const d = await load(lang); return lookup(d, key) ?? null; } catch { return null; }
}

/** Pick the right language from a config value (string or {en, zh-CN, ru}). */
export function pick(value) {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  return value[current] || value.en || null;
}

export function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const v = t(el.dataset.i18n);
    if (v !== el.dataset.i18n) el.textContent = v;
  });
  root.querySelectorAll('[data-i18n-html]').forEach(el => {
    const v = t(el.dataset.i18nHtml);
    if (v !== el.dataset.i18nHtml) el.innerHTML = v; // locale files are trusted, first-party content
  });
  const attrs = { i18nAlt: 'alt', i18nContent: 'content', i18nAriaLabel: 'aria-label', i18nPlaceholder: 'placeholder' };
  for (const [data, attr] of Object.entries(attrs)) {
    const sel = '[data-' + data.replace(/[A-Z]/g, m => '-' + m.toLowerCase()) + ']';
    root.querySelectorAll(sel).forEach(el => {
      const key = el.dataset[data];
      const v = t(key);
      if (v !== key) el.setAttribute(attr, v);
    });
  }
}

function updateHead() {
  document.documentElement.lang = LANGUAGES[current].htmlLang;
  const og = document.querySelector('meta[property="og:locale"]');
  if (og) og.content = OG_LOCALE[current];
  // Self-referencing canonical for translated views (when a domain is set).
  const canon = document.querySelector('link[rel="canonical"]');
  if (canon) {
    const u = new URL(canon.dataset.base || canon.href);
    canon.dataset.base = canon.dataset.base || canon.href;
    if (current === DEFAULT_LANGUAGE) u.searchParams.delete('lang'); else u.searchParams.set('lang', current);
    canon.href = u.toString();
  }
}

/** Keep ?lang= in the address bar in sync, so a shared link opens in the same language. */
function updateUrl() {
  const u = new URL(location.href);
  if (current === DEFAULT_LANGUAGE) u.searchParams.delete('lang'); else u.searchParams.set('lang', current);
  history.replaceState(history.state, '', u);
}

export async function setLang(lang, { persist = true } = {}) {
  if (!LANGUAGES[lang]) lang = DEFAULT_LANGUAGE;
  fallback = await load(DEFAULT_LANGUAGE);
  try { dict = await load(lang); current = lang; }
  catch (e) { console.warn(e); dict = fallback; current = DEFAULT_LANGUAGE; }
  if (persist) store.set(KEY, current);
  updateHead();
  updateUrl();
  applyTranslations();
  document.dispatchEvent(new CustomEvent('bp:langchange', { detail: { lang: current } }));
  return current;
}
