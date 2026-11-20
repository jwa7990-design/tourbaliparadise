/* Price lookups shared by the pricing cards, area checker, form and WhatsApp. */
import { PRICING, AIRPORT_ZONES, VEHICLES } from './config.js';

const valid = v => Number.isFinite(v) && v > 0;

export const findZone = key => AIRPORT_ZONES.find(z => z.key === key) || null;
/** Price for an area and vehicle ('innova' by default, or 'commuter' / 'premio'). */
export const zonePrice = (key, vehicle = 'innova') => {
  const z = findZone(key); const v = VEHICLES.find(x => x.key === vehicle) || VEHICLES[0];
  return z && valid(z[v.field]) ? z[v.field] : null;
};

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
