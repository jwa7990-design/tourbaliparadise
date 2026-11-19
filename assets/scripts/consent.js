/* Analytics consent (Google Consent Mode v2).
   - Before Tag Manager loads, consent defaults are set: analytics is off
     in countries where the law requires a yes first (EEA, UK, Switzerland),
     and on elsewhere. Advertising signals are always off; the site runs no ads.
   - A small banner asks every visitor once. Their choice is saved in this
     browser and sent to Google as a consent update.
   - "Cookie settings" in the footer reopens the banner. */
import { t } from './i18n.js';
import { store } from './storage.js';

const KEY = 'bp_analytics_consent'; // 'granted' | 'denied'
const CONSENT_REGIONS = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'CH'];

function gtag() { window.dataLayer.push(arguments); }

/** Call before Tag Manager loads. */
export function applyConsentDefaults() {
  window.dataLayer = window.dataLayer || [];
  const ads = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  gtag('consent', 'default', { ...ads, analytics_storage: 'denied', region: CONSENT_REGIONS, wait_for_update: 500 });
  gtag('consent', 'default', { ...ads, analytics_storage: 'granted' });
  const saved = store.get(KEY);
  if (saved === 'granted' || saved === 'denied') gtag('consent', 'update', { analytics_storage: saved });
}

function choose(value) {
  store.set(KEY, value);
  gtag('consent', 'update', { analytics_storage: value });
  window.dataLayer.push({ event: 'consent_choice', analytics_consent: value });
  document.querySelector('.consent')?.remove();
}

/** Show the banner if the visitor hasn't chosen yet (or when `force` is true). */
export function showConsentBanner(force = false) {
  if (!force && store.get(KEY)) return;
  document.querySelector('.consent')?.remove();
  const el = document.createElement('div');
  el.className = 'consent';
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', t('consent.label'));
  el.innerHTML = `
    <p class="consent__text">${t('consent.text')}</p>
    <div class="consent__actions">
      <button type="button" class="btn btn--green consent__btn" data-consent="granted">${t('consent.accept')}</button>
      <button type="button" class="btn btn--outline consent__btn" data-consent="denied">${t('consent.decline')}</button>
    </div>`;
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-consent]');
    if (b) choose(b.dataset.consent);
  });
  document.body.appendChild(el);
}

/** Footer "Cookie settings" link. */
export function bindConsentSettings() {
  document.addEventListener('click', e => {
    if (e.target.closest('[data-consent-settings]')) { e.preventDefault(); showConsentBanner(true); }
  });
}
