/* Shared layout (header, menu, footer) and data-driven components. */
import { BUSINESS, LANGUAGES, CURRENCIES, PRICING, AIRPORT_ZONES, GIVING, INCLUSIONS, DRIVER, COMMITMENTS, REVIEWS, REVIEWS_PROFILE_URL, REVIEWS_WRITE_URL } from './config.js';
import { t, pick, getLang } from './i18n.js';
import { getCurrency, formatIDR, formatConverted, ratesInfo } from './currency.js';
import { waUrl, refreshWaLinks } from './whatsapp.js';
import { basePrice, getZone, setZone, findZone } from './pricing.js';
import { track } from './track.js';
import { loadGivingLog, givingTotals } from './giving.js';

/* ---------- Icons (simple line icons) ---------- */
const P = {
  whatsapp: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8.4 19L4 20z"/><path d="M9.2 8.6c.2-.4.5-.4.8-.4h.4c.2 0 .4.1.5.4l.6 1.4c.1.2 0 .4-.1.6l-.5.6c-.1.1-.1.3 0 .5.6 1 1.4 1.8 2.4 2.3.2.1.4.1.5-.1l.6-.7c.1-.2.4-.2.6-.1l1.4.7c.2.1.3.3.3.5v.4c0 .7-.6 1.3-1.4 1.4-1 .1-2.3-.3-3.8-1.6-1.5-1.3-2.3-2.7-2.5-3.7-.1-.8.2-1.5.6-2.2z"/>',
  plane: '<path d="M2.5 13.5l7-1.8L14 4.5c.6-1 2-1.3 2.6-.7.5.6.2 1.9-.7 2.6l-7.1 4.6"/><path d="M9.5 11.7l-.8 7.8 2.2-1 2.4-6.6"/><path d="M14.5 9.3l6.5 2.2-1.2 1.6-7.6-.9"/><path d="M3 21h18"/>',
  car: '<path d="M5 17h14v-4.5l-1.8-4.6A2 2 0 0 0 15.3 6.6H8.7a2 2 0 0 0-1.9 1.3L5 12.5V17z"/><path d="M5 12.5h14"/><circle cx="8" cy="15" r=".6"/><circle cx="16" cy="15" r=".6"/><path d="M6 17v2M18 17v2"/>',
  pin: '<path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  chat: '<path d="M4 18.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8l-4 2.5z"/><path d="M8 9h8M8 12h5"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="8" r="1.3"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16.5 9.5"/>',
  bag: '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M4 4l16 16"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 5.3a3 3 0 0 1 0 5.4M17 14.2a5.5 5.5 0 0 1 3.5 4.8"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z"/>',
  scooter: '<circle cx="6" cy="17" r="2.5"/><circle cx="18" cy="17" r="2.5"/><path d="M8.5 17h7M15 17l-2-7h3M13 10l-1.5-3H9"/><path d="M6 14.5l2-4.5h5"/>',
  road: '<path d="M8 3L4 21M16 3l4 18M12 4v3M12 11v3M12 18v2"/>',
  menu: '<path d="M3 7h18M3 12h18M3 17h18"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
};
export const icon = (name, cls = '') =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="icon ${cls}">${P[name] || ''}</svg>`;

export function fillIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => { if (!el.firstElementChild) el.innerHTML = icon(el.dataset.icon); });
}

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tx = (key, tag = 'span', attrs = '') => `<${tag} data-i18n="${key}"${attrs}>${esc(t(key))}</${tag}>`;

/* ---------- Header & mobile menu ---------- */
const PAGES = [
  { id: 'home', href: 'index.html', key: 'nav.home' },
  { id: 'explore', href: 'explore.html', key: 'nav.explore' },
  { id: 'services', href: 'services.html', key: 'nav.services' },
  { id: 'about', href: 'about.html', key: 'nav.about' },
];
const cur = id => (document.body.dataset.page === id ? ' aria-current="page"' : '');
const navLink = p => `<a class="nav__link" href="${p.href}"${cur(p.id)} data-track-label="header_${p.id}" data-i18n="${p.key}">${esc(t(p.key))}</a>`;

function selects(idSuffix) {
  const lang = Object.entries(LANGUAGES).map(([code, l]) =>
    `<option value="${code}" lang="${l.htmlLang}"${code === getLang() ? ' selected' : ''}>${l.label}</option>`).join('');
  const curr = Object.entries(CURRENCIES).map(([code, c]) =>
    `<option value="${code}"${code === getCurrency() ? ' selected' : ''}>${c.label}</option>`).join('');
  return {
    lang: `<select id="lang-${idSuffix}" class="pref-select" data-pref="lang">${lang}</select>`,
    currency: `<select id="cur-${idSuffix}" class="pref-select" data-pref="currency">${curr}</select>`,
  };
}

const wordmark = `<a class="wordmark" href="index.html" data-track-label="header_wordmark" aria-label="Bali Paradise"><b>Bali</b><span>Paradise</span></a>`;

export function renderHeader() {
  const host = document.getElementById('site-header');
  if (!host) return;
  const d = selects('desktop');
  const m = selects('mobile');
  host.innerHTML = `
    <nav class="nav" aria-label="Main" data-i18n-aria-label="nav.main">
      <div class="nav__group">
        <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" data-track-label="header_menu_open" aria-label="${esc(t('nav.menu'))}" data-i18n-aria-label="nav.menu">${icon('menu')}</button>
        ${navLink(PAGES[0])}${navLink(PAGES[1])}
      </div>
      ${wordmark}
      <div class="nav__group nav__group--right">
        ${navLink(PAGES[2])}${navLink(PAGES[3])}
        <div class="prefs">
          <label class="sr-only" for="lang-desktop" data-i18n="nav.language">${esc(t('nav.language'))}</label>${d.lang}
          <label class="sr-only" for="cur-desktop" data-i18n="nav.currency">${esc(t('nav.currency'))}</label>${d.currency}
        </div>
        <a class="nav__wa" href="${waUrl()}" data-wa="general" data-track-label="header_whatsapp" target="_blank" rel="noopener" aria-label="${esc(t('nav.whatsapp'))}" data-i18n-aria-label="nav.whatsapp">${icon('whatsapp')}</a>
      </div>
    </nav>
    <div class="mobile-menu" id="mobile-menu" hidden role="dialog" aria-modal="true" aria-label="${esc(t('nav.menu'))}" data-i18n-aria-label="nav.menu">
      <div class="mobile-menu__top">
        ${wordmark}
        <button class="nav__toggle" type="button" data-close-menu data-track-label="menu_close" aria-label="${esc(t('nav.close'))}" data-i18n-aria-label="nav.close" style="display:inline-flex">${icon('close')}</button>
      </div>
      <ul class="mobile-menu__links">
        ${PAGES.map(p => `<li><a href="${p.href}"${cur(p.id)} data-track-label="menu_${p.id}" data-i18n="${p.key}">${esc(t(p.key))}</a></li>`).join('')}
      </ul>
      <div class="mobile-menu__prefs">
        <label>${tx('nav.language')}${m.lang}</label>
        <label>${tx('nav.currency')}${m.currency}</label>
      </div>
      <a class="btn btn--green btn--icon btn--block" href="${waUrl()}" data-wa="general" data-track-label="menu_whatsapp" target="_blank" rel="noopener">${icon('whatsapp')}${tx('common.chatWithAris')}</a>
    </div>`;

  const menu = host.querySelector('#mobile-menu');
  const openBtn = host.querySelector('.nav .nav__toggle');
  const close = () => { menu.hidden = true; openBtn.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; openBtn.focus(); };
  openBtn.addEventListener('click', () => {
    menu.hidden = false; openBtn.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden';
    menu.querySelector('a').focus();
  });
  menu.querySelector('[data-close-menu]').addEventListener('click', close);
  menu.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  menu.querySelectorAll('.mobile-menu__links a').forEach(a => a.addEventListener('click', () => { document.body.style.overflow = ''; }));

  // Header gains a solid, full-width state once the page is scrolled.
  const onScroll = () => document.body.classList.toggle('is-scrolled', scrollY > 40);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  // Floating WhatsApp (mobile)
  if (!document.querySelector('.wa-float')) {
    document.body.insertAdjacentHTML('beforeend',
      `<a class="wa-float" href="${waUrl()}" data-wa="general" data-track-label="floating_whatsapp" target="_blank" rel="noopener" aria-label="${esc(t('nav.whatsapp'))}" data-i18n-aria-label="nav.whatsapp">${icon('whatsapp')}</a>`);
  }
}

export function syncSelects() {
  document.querySelectorAll('[data-pref="lang"]').forEach(s => { s.value = getLang(); });
  document.querySelectorAll('[data-pref="currency"]').forEach(s => { s.value = getCurrency(); });
}

/* ---------- Footer ---------- */
export function renderFooter() {
  const host = document.getElementById('site-footer');
  if (!host) return;
  host.innerHTML = `
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          ${wordmark.replace('header_wordmark', 'footer_wordmark')}
          ${tx('brand.tagline', 'p', ' class="footer__tagline"')}
          ${tx('footer.promise', 'p', ' class="footer__promise"')}
          ${tx('footer.about', 'p')}
        </div>
        <div>
          ${tx('footer.pages', 'h2')}
          <ul class="footer__links">
            ${PAGES.map(p => `<li><a href="${p.href}" data-track-label="footer_${p.id}" data-i18n="${p.key}">${esc(t(p.key))}</a></li>`).join('')}
          </ul>
        </div>
        <div>
          ${tx('footer.contact', 'h2')}
          <ul class="footer__links">
            <li><a href="${waUrl()}" data-wa="general" data-track-label="footer_whatsapp" target="_blank" rel="noopener">WhatsApp: ${esc(BUSINESS.phoneDisplay)}</a></li>
            ${BUSINESS.email ? `<li><a href="mailto:${esc(BUSINESS.email)}" data-track-label="footer_email">${esc(BUSINESS.email)}</a></li>` : ''}
            <li>${tx('contact.areaValue')}</li>
            <li><a href="services.html#enquire" data-track-label="footer_enquiry_form" data-i18n="footer.enquire">${esc(t('footer.enquire'))}</a></li>
          </ul>
        </div>
      </div>
      <div class="footer__legal">
        ${tx('footer.disclaimer', 'p')}
        ${tx('footer.photos', 'p')}
        <p>© ${new Date().getFullYear()} Bali Paradise.</p>
      </div>
      <div class="footer__giant" aria-hidden="true">Bali Paradise</div>
    </div>`;
}

/* ---------- Language suggestion (never automatic) ---------- */
export function showLangSuggestion(lang, text, switchLabel, dismissLabel, onSwitch, onDismiss) {
  const box = document.createElement('div');
  box.className = 'lang-suggest';
  box.setAttribute('role', 'region');
  box.setAttribute('aria-label', 'Language');
  box.lang = LANGUAGES[lang].htmlLang;
  box.innerHTML = `<p>${esc(text)}</p><div class="lang-suggest__actions">
    <button class="btn btn--green" type="button" data-track-label="lang_suggest_accept">${esc(switchLabel)}</button>
    <button class="btn btn--outline" type="button" data-track-label="lang_suggest_dismiss">${esc(dismissLabel)}</button></div>`;
  const [yes, no] = box.querySelectorAll('button');
  yes.addEventListener('click', () => { box.remove(); onSwitch(); });
  no.addEventListener('click', () => { box.remove(); onDismiss(); });
  document.body.appendChild(box);
}

/* ---------- Pricing ---------- */
export function renderPrices() {
  document.querySelectorAll('[data-price]').forEach(card => {
    const p = PRICING[card.dataset.price];
    if (!p) return;
    const idrEl = card.querySelector('[data-price-idr]');
    const preEl = card.querySelector('[data-price-prefix]');
    const convEl = card.querySelector('[data-price-conv]');
    const amount = basePrice(card.dataset.price);
    const idr = formatIDR(amount);
    if (idr) {
      delete idrEl.dataset.i18n;
      idrEl.textContent = idr;
      idrEl.classList.remove('is-placeholder');
      preEl.dataset.i18n = 'pricing.from';
      preEl.textContent = p.from ? t('pricing.from') : '';
      if (!p.from) delete preEl.dataset.i18n;
      const conv = formatConverted(amount);
      if (conv) { delete convEl.dataset.i18n; convEl.textContent = `≈ ${conv}`; }
      else if (getCurrency() !== 'IDR') { convEl.dataset.i18n = 'currency.unavailableShort'; convEl.textContent = t('currency.unavailableShort'); }
      else { delete convEl.dataset.i18n; convEl.textContent = ''; }
    } else {
      const key = p.quoteOnRequest ? 'pricing.quoteOnRequest' : 'pricing.tbc';
      idrEl.dataset.i18n = key;
      idrEl.textContent = t(key);
      idrEl.classList.toggle('is-placeholder', !p.quoteOnRequest);
      preEl.textContent = '';
      delete preEl.dataset.i18n;
      convEl.textContent = '';
      delete convEl.dataset.i18n;
    }
  });

  const status = document.querySelector('[data-rates-status]');
  if (status) {
    const r = ratesInfo();
    if (r) {
      const date = new Intl.DateTimeFormat(getLang() === 'zh-CN' ? 'zh-CN' : getLang(), { dateStyle: 'medium' }).format(new Date(r.updatedAt));
      status.innerHTML = `${esc(t('currency.ratesUpdated', { date }))} <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener" data-track-label="rates_attribution">${esc(t('currency.ratesBy'))}</a>`;
    } else {
      status.textContent = t('currency.ratesUnavailable');
    }
  }
  renderZoneCheck();
  renderInlinePrices();
  renderRateCard();
  renderGiving();
}

/* ---------- Inline "From" prices (home service cards) ---------- */
function priceHtml(amount, quote) {
  const idr = formatIDR(amount);
  if (!idr) return `<b>${esc(t(quote ? 'pricing.quoteOnRequest' : 'pricing.tbc'))}</b>`;
  const conv = formatConverted(amount);
  return `<span class="from">${esc(t('pricing.from'))}</span> <b>${esc(idr)}</b>${conv ? ` <span class="conv">≈ ${esc(conv)}</span>` : ''}`;
}
export function renderInlinePrices() {
  document.querySelectorAll('[data-inline-price]').forEach(el => {
    const key = el.dataset.inlinePrice;
    el.innerHTML = priceHtml(basePrice(key), PRICING[key]?.quoteOnRequest);
  });
}

/* ---------- Rate card (services): every price, one list ---------- */
const HIRE_ROWS = [
  ['half_day_driver', 'ratecard.notes.half', 'driver'],
  ['full_day_driver', 'ratecard.notes.full', 'driver'],
  ['scooter_tour', 'ratecard.notes.scooter', 'scooter'],
  ['custom_day_trip', 'ratecard.notes.custom', 'custom'],
];
function rateRow({ name, note, amount, quote, waAttrs, label }) {
  const idr = formatIDR(amount);
  const conv = idr ? formatConverted(amount) : null;
  const price = idr
    ? `<b>${esc(idr)}</b>${conv ? `<small>≈ ${esc(conv)}</small>` : ''}`
    : `<b class="rc__quote">${esc(t(quote ? 'pricing.quoteOnRequest' : 'pricing.tbc'))}</b>`;
  return `<li class="rc">
    <span class="rc__name">${esc(name)}${note ? `<small>${esc(note)}</small>` : ''}</span>
    <span class="rc__dots" aria-hidden="true"></span>
    <span class="rc__price">${price}</span>
    <a class="rc__ask" href="${waUrl()}" ${waAttrs} data-track-label="${label}" target="_blank" rel="noopener" aria-label="${esc(t('ratecard.ask'))}: ${esc(name)}">${icon('whatsapp')}</a>
  </li>`;
}
export function renderRateCard() {
  const hire = document.querySelector('[data-ratecard="hire"]');
  if (hire) {
    hire.innerHTML = HIRE_ROWS.map(([key, noteKey, ctx]) => rateRow({
      name: t(`pricing.items.${key}`), note: t(noteKey), amount: basePrice(key), quote: PRICING[key]?.quoteOnRequest,
      waAttrs: `data-wa="${ctx}" data-wa-price="${key}"`, label: `ratecard_${key}`,
    })).join('');
  }
  const air = document.querySelector('[data-ratecard="airport"]');
  if (air) {
    air.innerHTML = AIRPORT_ZONES.map(z => rateRow({
      name: t(`zones.${z.key}`), amount: z.price_idr, quote: z.quoteOnRequest,
      waAttrs: `data-wa="airport" data-wa-zone="${z.key}"`, label: `ratecard_airport_${z.key}`,
    })).join('');
  }
}

/* ---------- Editorial section numbers (decorative) ---------- */
export function numberSections() {
  const sections = document.querySelectorAll('main > section.section, main > nav.section');
  let n = 0;
  sections.forEach(sec => {
    if (sec.querySelector(':scope > .ed-num')) return;
    n += 1;
    sec.insertAdjacentHTML('afterbegin', `<span class="ed-num" aria-hidden="true">${String(n).padStart(2, '0')}</span>`);
  });
}

/* ---------- Airport transfer: price by area ---------- */
export function renderZoneCheck() {
  const host = document.querySelector('[data-zone-check]');
  if (!host) return;
  const sel = host.querySelector('[data-zone-select]');
  if (!sel.dataset.bound) {
    sel.dataset.bound = '1';
    sel.addEventListener('change', () => {
      setZone(sel.value);
      // Pre-fill the area in any enquiry form on the page.
      document.querySelectorAll('select[name="zone"]').forEach(s => { s.value = sel.value; });
      track('airport_zone_select', { zone: sel.value || 'none' });
      renderZoneCheck();
      refreshWaLinks();
    });
  }
  const current = getZone();
  sel.innerHTML = `<option value="">${esc(t('airportZones.choose'))}</option>` +
    AIRPORT_ZONES.map(z => `<option value="${z.key}"${z.key === current ? ' selected' : ''}>${esc(t(`zones.${z.key}`))}</option>`).join('');

  const idrEl = host.querySelector('[data-zone-idr]');
  const convEl = host.querySelector('[data-zone-conv]');
  const wa = host.querySelector('[data-zone-wa]');
  host.classList.toggle('has-zone', !!current);
  if (!current) { idrEl.textContent = ''; convEl.textContent = ''; delete wa.dataset.waZone; return; }
  wa.dataset.waZone = current;
  const z = findZone(current);
  const idr = formatIDR(z.price_idr);
  if (idr) {
    idrEl.textContent = idr;
    idrEl.classList.remove('is-placeholder');
    const conv = formatConverted(z.price_idr);
    convEl.textContent = conv ? `≈ ${conv}` : (getCurrency() !== 'IDR' ? t('currency.unavailableShort') : '');
  } else {
    idrEl.textContent = t(z.quoteOnRequest ? 'pricing.quoteOnRequest' : 'pricing.tbc');
    idrEl.classList.toggle('is-placeholder', !z.quoteOnRequest);
    convEl.textContent = '';
  }
}

export function renderInclusions() {
  const host = document.querySelector('[data-inclusions]');
  if (!host) return;
  host.innerHTML = Object.entries(INCLUSIONS).map(([key, v]) => {
    let val; let cls = '';
    if (v === 'included') val = t('pricing.status.included');
    else if (v === 'not_included') val = t('pricing.status.not_included');
    else if (v && pick(v)) val = pick(v);
    else { val = t('pricing.status.tbc'); cls = ' class="placeholder-text"'; }
    return `<div><dt>${esc(t(`pricing.inc.${key}`))}</dt><dd${cls}>${esc(val)}</dd></div>`;
  }).join('');
}

/* ---------- Driver ---------- */
const DRIVER_FIELDS = [
  ['drivingExperience', 'road'],
  ['languages', 'chat'],
  ['vehicle', 'car'],
  ['passengerCapacity', 'users'],
  ['serviceAreas', 'pin'],
  ['enjoysShowing', 'heart'],
];

export function renderDriver() {
  if (DRIVER.photo) {
    document.querySelectorAll('[data-driver-photo]').forEach(el => {
      el.innerHTML = `<img src="${esc(DRIVER.photo)}" alt="${esc(DRIVER.photoAlt)}" loading="lazy" width="800" height="1000">`;
    });
  }
  const intro = document.querySelector('[data-driver-intro]');
  if (intro) {
    const v = pick(DRIVER.introduction);
    intro.innerHTML = v ? v.split(/\n{2,}/).map(p => `<p>${esc(p)}</p>`).join('')
      : `<p class="placeholder-text">${esc(t('driver.introPlaceholder'))}</p>`;
  }
  const list = document.querySelector('[data-driver-details]');
  if (list) {
    list.innerHTML = DRIVER_FIELDS.map(([key, ic]) => {
      const v = pick(DRIVER[key]);
      return `<div><span data-icon="${ic}">${icon(ic)}</span><dt>${esc(t(`driver.fields.${key}`))}</dt>
        <dd${v ? '' : ' class="placeholder-text"'}>${esc(v || t('driver.tbc'))}</dd></div>`;
    }).join('');
  }
}

export function renderCommitments() {
  const host = document.querySelector('[data-commitments]');
  if (!host) return;
  host.innerHTML = COMMITMENTS.filter(c => c.confirmed).map(c => `
    <li><span data-icon="${c.icon}">${icon(c.icon)}</span>
      <h3>${esc(t(`commitments.${c.key}.title`))}</h3>
      <p>${esc(t(`commitments.${c.key}.text`))}</p></li>`).join('');
}

/* ---------- Reviews ----------
   Real reviews come from REVIEWS in config.js. For a design preview on a
   local machine only, add ?reviews=sample to the URL: sample cards load from
   assets/data/reviews.sample.json, which is never published (.assetsignore). */
const SERVICE_LINK = {
  airport: ['services.html#airport-transfers', 'svc.airport.title'],
  driver:  ['services.html#private-driver',    'svc.driver.title'],
  custom:  ['services.html#custom-day-trips',  'svc.custom.title'],
  scooter: ['services.html#scooter-tours',     'svc.scooter.title'],
};
let reviewList = REVIEWS;
let samplePending = false;
const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
if (!REVIEWS.length && isLocal && new URLSearchParams(location.search).get('reviews') === 'sample') {
  samplePending = true;
  fetch('assets/data/reviews.sample.json', { cache: 'no-cache' }).then(r => r.json()).then(list => {
    reviewList = list; samplePending = false; renderReviews(); refreshWaLinks();
  }).catch(() => { samplePending = false; });
}

const monthFmt = ym => {
  const [y, m] = String(ym || '').split('-').map(Number);
  if (!y || !m) return '';
  return new Intl.DateTimeFormat(getLang() === 'zh-CN' ? 'zh-CN' : getLang(), { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));
};
const stars = n => {
  const r = Math.max(0, Math.min(5, Math.round(n || 0)));
  return r ? `<span class="rv-stars" role="img" aria-label="${esc(t('reviews.stars', { n: r }))}">${'★'.repeat(r)}<span class="rv-stars__off">${'★'.repeat(5 - r)}</span></span>` : '';
};
function reviewCard(r, { withService = true, place = 'reviews' } = {}) {
  const svc = SERVICE_LINK[r.service];
  const meta = [r.country, monthFmt(r.date)].filter(Boolean).map(esc).join(' · ');
  return `<figure class="rv-card${r.sample ? ' rv-card--sample' : ''}">
    ${r.sample ? `<span class="rv-sample">${esc(t('reviews.sampleLabel'))}</span>` : ''}
    <div class="rv-card__top">${stars(r.rating)}${r.source ? `<span class="rv-source">${esc(r.source)}</span>` : ''}</div>
    <blockquote class="rv-card__text"><p>${esc(pick(r.text))}</p></blockquote>
    <figcaption class="rv-card__who"><strong>${esc(r.name)}</strong>${meta ? `<span>${meta}</span>` : ''}</figcaption>
    ${withService && svc ? `<a class="rv-card__svc" href="${svc[0]}" data-track="cta" data-track-label="${place}_review_service_${esc(r.service)}"><span>${esc(t(svc[1]))}</span> <span aria-hidden="true">→</span></a>` : ''}
  </figure>`;
}
function reviewLinks(place) {
  const links = [];
  if (REVIEWS_PROFILE_URL) links.push(`<a class="link-arrow" href="${esc(REVIEWS_PROFILE_URL)}" target="_blank" rel="noopener" data-track-label="${place}_reviews_profile">${esc(t('reviews.profile'))} <span aria-hidden="true">→</span></a>`);
  if (REVIEWS_WRITE_URL) links.push(`<a class="link-arrow" href="${esc(REVIEWS_WRITE_URL)}" target="_blank" rel="noopener" data-track-label="${place}_reviews_write">${esc(t('reviews.write'))} <span aria-hidden="true">→</span></a>`);
  return links.length ? `<p class="rv-links">${links.join('')}</p>` : '';
}

export function renderReviews() {
  const list = reviewList || [];
  // About page: every review
  const host = document.querySelector('[data-reviews]');
  if (host && !samplePending) {
    host.innerHTML = list.length
      ? `<div class="rv-grid">${list.map(r => reviewCard(r, { place: 'about' })).join('')}</div>${reviewLinks('about')}`
      : `<div class="reviews-empty"><p>${esc(t('reviews.empty'))}</p>
      <a class="link-arrow" href="${waUrl()}" data-wa="feedback" data-track-label="reviews_feedback_whatsapp" target="_blank" rel="noopener">${esc(t('reviews.cta'))}</a></div>${reviewLinks('about')}`;
  }
  // Homepage strip: featured reviews (or the newest), hidden when there are none
  document.querySelectorAll('[data-reviews-strip]').forEach(strip => {
    const section = strip.closest('section');
    const picks = (list.filter(r => r.featured).length ? list.filter(r => r.featured) : list).slice(0, 3);
    if (section) section.hidden = !picks.length;
    strip.innerHTML = picks.map(r => reviewCard(r, { place: 'home' })).join('');
    const more = section && section.querySelector('[data-reviews-links]');
    if (more) more.innerHTML = reviewLinks('home');
  });
  // Services page: reviews for each service, inside that service's section
  document.querySelectorAll('[data-service-reviews]').forEach(slot => {
    const mine = list.filter(r => r.service === slot.dataset.serviceReviews).slice(0, 2);
    slot.hidden = !mine.length;
    slot.innerHTML = mine.length
      ? `<p class="rv-slot__label">${esc(t('reviews.fromGuests'))}</p>${mine.map(r => reviewCard(r, { withService: false, place: 'services' })).join('')}`
      : '';
  });
}

export function renderContact() {
  const host = document.querySelector('[data-contact-details]');
  if (!host) return;
  host.innerHTML = `
    <div><dt>WhatsApp</dt><dd><a href="${waUrl()}" data-wa="general" data-track-label="about_contact_number" target="_blank" rel="noopener">${esc(BUSINESS.phoneDisplay)}</a></dd></div>
    ${BUSINESS.email ? `<div><dt>Email</dt><dd><a href="mailto:${esc(BUSINESS.email)}" data-track-label="about_contact_email">${esc(BUSINESS.email)}</a></dd></div>` : ''}
    <div><dt>${esc(t('contact.area'))}</dt><dd>${esc(t('contact.areaValue'))}</dd></div>
    <div><dt>${esc(t('contact.howTitle'))}</dt><dd>${esc(t('contact.howText'))}</dd></div>`;
}

/* ---------- Giving back (About section + Giving Back page) ---------- */
const dateFmt = iso => new Intl.DateTimeFormat(getLang() === 'zh-CN' ? 'zh-CN' : getLang(), { dateStyle: 'medium' })
  .format(new Date(`${iso}T00:00:00`));

export async function renderGiving() {
  const hosts = document.querySelectorAll('[data-giving]');
  const logHost = document.querySelector('[data-giving-log]');
  if (!hosts.length && !logHost) return;
  const list = await loadGivingLog();
  const { total, lastDate } = givingTotals(list);

  hosts.forEach(host => {
    const rules = host.querySelector('[data-giving-rules]');
    if (rules) {
      rules.innerHTML = [
        ['giving.ruleTransfer', GIVING.perTransferIdr],
        ['giving.ruleTrip', GIVING.perTripIdr],
      ].filter(([, v]) => formatIDR(v)).map(([k, v]) => `<li>${esc(t(k, { amount: formatIDR(v) }))}</li>`).join('');
    }
    const totalEl = host.querySelector('[data-giving-total]');
    const noteEl = host.querySelector('[data-giving-total-note]');
    if (totalEl) {
      if (total > 0) {
        totalEl.textContent = formatIDR(total);
        const conv = formatConverted(total);
        noteEl.textContent = [conv ? `≈ ${conv}` : '', lastDate ? t('giving.updated', { date: dateFmt(lastDate) }) : ''].filter(Boolean).join(' · ');
      } else {
        totalEl.textContent = 'Rp 0';
        noteEl.textContent = t('giving.totalStart');
      }
    }
    const cause = host.querySelector('[data-giving-cause]');
    if (cause) {
      cause.innerHTML = GIVING.cause && GIVING.cause.name
        ? (GIVING.cause.url ? `<a href="${esc(GIVING.cause.url)}" target="_blank" rel="noopener" data-track-label="giving_cause_link">${esc(GIVING.cause.name)}</a>` : esc(GIVING.cause.name))
        : `<span class="placeholder-text">${esc(t('giving.causeTbc'))}</span>`;
    }
  });

  if (logHost) {
    if (!list.length) {
      logHost.innerHTML = `<p class="giving-log__empty">${esc(t('giving.logEmpty'))}</p>`;
    } else {
      const cols = ['date', 'amount', 'to', 'note', 'proof'];
      logHost.innerHTML = `<table class="giving-log"><thead><tr>${cols.map(c => `<th scope="col">${esc(t(`giving.col.${c}`))}</th>`).join('')}</tr></thead><tbody>${
        list.map(d => {
          const conv = formatConverted(d.amountIdr);
          return `<tr>
            <td data-label="${esc(t('giving.col.date'))}">${esc(dateFmt(d.date))}</td>
            <td data-label="${esc(t('giving.col.amount'))}"><strong>${esc(formatIDR(d.amountIdr))}</strong>${conv ? `<span class="giving-log__conv">≈ ${esc(conv)}</span>` : ''}</td>
            <td data-label="${esc(t('giving.col.to'))}">${esc(pick(d.to) || '')}</td>
            <td data-label="${esc(t('giving.col.note'))}">${esc(pick(d.note) || '')}</td>
            <td data-label="${esc(t('giving.col.proof'))}">${d.proofUrl ? `<a href="${esc(d.proofUrl)}" target="_blank" rel="noopener" data-track-label="giving_receipt">${esc(t('giving.viewProof'))}</a>` : '—'}</td>
          </tr>`;
        }).join('')}</tbody></table>`;
    }
  }
}

/* ---------- Gentle reveal on scroll (disabled for reduced motion) ---------- */
const REVEAL = '.ed-card, .statements__list li, .contents__list li, .ratecard__col, .promise__list li, .giving, .price-promise, .section-head, .editorial-item, .service-trio__item, .experience__grid, .service-row, .price-grid, .zone-check, .meet, .tile-grid li, .steps li, .expect, .faq, .contact, .trust__list li, .green-band__inner, .cta-band__inner, .intro__text, .included';
export function initReveal() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('reveal-on');
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll(REVEAL).forEach(el => {
    const i = Array.prototype.indexOf.call(el.parentNode.children, el);
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 4) * 90}ms`;
    io.observe(el);
  });
}
