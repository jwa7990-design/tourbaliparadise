/* Price lookups shared by the pricing cards, area checker, form and WhatsApp. */
import { PRICING, AIRPORT_ZONES } from './config.js';

const valid = v => Number.isFinite(v) && v > 0;

export const findZone = key => AIRPORT_ZONES.find(z => z.key === key) || null;
export const zonePrice = key => { const z = findZone(key); return z && valid(z.price_idr) ? z.price_idr : null; };

/** Canonical IDR price for a pricing key. Airport transfers use the lowest area price. */
export function basePrice(key) {
  if (key === 'airport_transfer') {
    const set = AIRPORT_ZONES.map(z => z.price_idr).filter(valid);
    if (set.length) return Math.min(...set);
  }
  const p = PRICING[key];
  return p && valid(p.price_idr) ? p.price_idr : null;
}

/* The area the visitor picked (kept for this page view only). */
let selectedZone = '';
export const getZone = () => selectedZone;
export const setZone = key => { selectedZone = findZone(key) ? key : ''; };
