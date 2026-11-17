/* Currency: IDR is canonical. Rates are fetched at most every
   EXCHANGE.cacheHours per browser, cached in localStorage, and
   conversions are hidden (never zero/invalid) if no valid rate. */
import { CURRENCIES, DEFAULT_CURRENCY, EXCHANGE, LANGUAGES } from './config.js';
import { store } from './storage.js';
import { getLang } from './i18n.js';

const KEY = 'bp_currency';
const RATES_KEY = 'bp_rates_v1';
let current = null;
let rates = null; // { fetchedAt, updatedAt, rates: {AUD: 0.0000x, ...} }

const REGION_TO_CURRENCY = {
  AU: 'AUD', US: 'USD', GB: 'GBP', CN: 'CNY', RU: 'RUB', ID: 'IDR',
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', IE: 'EUR',
  PT: 'EUR', FI: 'EUR', GR: 'EUR', SK: 'EUR', SI: 'EUR', LU: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR', HR: 'EUR', MT: 'EUR', CY: 'EUR',
};
const LANG_TO_CURRENCY = { zh: 'CNY', ru: 'RUB', id: 'IDR', de: 'EUR', fr: 'EUR', it: 'EUR', es: 'EUR', nl: 'EUR' };

/** Suggest a currency from the browser locale (no geolocation). */
export function detectCurrency() {
  for (const l of navigator.languages || [navigator.language || '']) {
    const [lang, region] = String(l).split('-');
    if (region && REGION_TO_CURRENCY[region.toUpperCase()]) return REGION_TO_CURRENCY[region.toUpperCase()];
    if (LANG_TO_CURRENCY[lang?.toLowerCase()]) return LANG_TO_CURRENCY[lang.toLowerCase()];
  }
  return DEFAULT_CURRENCY;
}

export function initCurrency() {
  const saved = store.get(KEY);
  current = saved && CURRENCIES[saved] ? saved : detectCurrency();
  return current;
}
export const getCurrency = () => current;

export function setCurrency(code) {
  if (!CURRENCIES[code]) return;
  current = code;
  store.set(KEY, code);
  document.dispatchEvent(new CustomEvent('bp:currencychange', { detail: { currency: code } }));
}

function validRates(r) {
  if (!r || !r.rates) return false;
  return Object.keys(CURRENCIES).every(c => c === 'IDR' || (Number.isFinite(r.rates[c]) && r.rates[c] > 0));
}

/** Load cached rates, refreshing from the API when stale. */
export async function loadRates() {
  const cached = store.getJSON(RATES_KEY);
  const fresh = cached && validRates(cached) && (Date.now() - cached.fetchedAt) < EXCHANGE.cacheHours * 3600e3;
  if (fresh) {
    rates = cached;
    document.dispatchEvent(new CustomEvent('bp:rateschange'));
    return rates;
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(EXCHANGE.url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.result !== 'success' || json.base_code !== 'IDR') throw new Error('Unexpected response');
    const next = {
      fetchedAt: Date.now(),
      updatedAt: (json.time_last_update_unix || 0) * 1000 || Date.now(),
      rates: Object.fromEntries(Object.keys(CURRENCIES).filter(c => c !== 'IDR').map(c => [c, json.rates?.[c]])),
    };
    if (!validRates(next)) throw new Error('Invalid rates');
    rates = next;
    store.setJSON(RATES_KEY, rates);
  } catch (e) {
    // Fall back to the last good cache if it is not too old.
    const ok = cached && validRates(cached) && (Date.now() - cached.updatedAt) < EXCHANGE.maxStaleDays * 864e5;
    rates = ok ? cached : null;
  }
  document.dispatchEvent(new CustomEvent('bp:rateschange'));
  return rates;
}

export const ratesInfo = () => rates;

const numLocale = () => (LANGUAGES[getLang()]?.htmlLang === 'zh-Hans' ? 'zh-CN' : getLang());

/** "Rp 1,000,000" (formatted for the current language). */
export function formatIDR(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return 'Rp ' + new Intl.NumberFormat(numLocale(), { maximumFractionDigits: 0 }).format(amount);
}

/** Converted amount, e.g. "A$58 AUD", or null if unavailable/invalid. */
export function formatConverted(amountIdr, code = current) {
  if (!code || code === 'IDR' || !rates || !Number.isFinite(amountIdr) || amountIdr <= 0) return null;
  const rate = rates.rates[code];
  const value = amountIdr * rate;
  if (!Number.isFinite(value) || value <= 0) return null;
  const decimals = value < 10 ? 2 : CURRENCIES[code].decimals;
  const formatted = new Intl.NumberFormat(numLocale(), {
    style: 'currency', currency: code, currencyDisplay: code === 'AUD' ? 'symbol' : 'narrowSymbol',
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(value);
  return `${formatted} ${code}`;
}
