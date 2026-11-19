/* Click & conversion tracking.
   Every event goes to window.dataLayer (GTM/GA4 compatible) and to
   window.bpEvents (for testing). It is forwarded to GA4, Plausible or
   Cloudflare only if their IDs are set in config.js → ANALYTICS.

   Events:
     whatsapp_click     any link that opens WhatsApp (key conversion)
     generate_lead      enquiry form submitted → WhatsApp opened (key conversion)
     form_error         enquiry form failed validation
     wa_qr_shown        desktop: QR handoff shown (shown is not scanned)
     wa_web_click       desktop: "Open in WhatsApp Web" chosen
     wa_app_click       desktop: "Open WhatsApp on this computer" chosen
     wa_message_copy    desktop: "Copy message" used (success true/false)
     wa_handoff_edit    desktop: went back to edit the enquiry
     None of these prove a message was sent; WhatsApp gives no confirmation.
     cta_click          any other call-to-action (internal links/buttons)
     nav_click          header / footer / mobile-menu navigation
     phone_click        tel: link
     faq_open           an FAQ was expanded
     language_change    language switched
     currency_change    currency switched
     scroll_depth       25 / 50 / 75 / 100 % of page scrolled              */
import { applyConsentDefaults } from './consent.js';
import { ANALYTICS } from './config.js';

window.dataLayer = window.dataLayer || [];
window.bpEvents = window.bpEvents || [];

let context = () => ({});
export function setTrackingContext(fn) { context = fn; }

export function track(event, params = {}) {
  const payload = {
    page: document.body.dataset.page,
    page_path: location.pathname,
    ...context(),
    ...params,
  };
  window.dataLayer.push({ event, ...payload });
  window.bpEvents.push({ event, ...payload, ts: Date.now() });
  if (typeof window.gtag === 'function' && ANALYTICS.ga4MeasurementId) {
    // GA4 reserves page_path, language and currency, so send them under our own names.
    const { page_path, language, currency, ...rest } = payload;
    window.gtag('event', event, { ...rest, site_path: page_path, site_language: language, site_currency: currency });
  }
  if (typeof window.plausible === 'function') window.plausible(event, { props: payload });
  if (ANALYTICS.debug) console.info('[track]', event, payload);
}

function loadScript(src, attrs = {}) {
  const s = document.createElement('script');
  s.async = true; s.src = src;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
}

/** Load whichever analytics providers are configured. */
export function initAnalytics() {
  const a = ANALYTICS;
  if (a.gtmContainerId || a.ga4MeasurementId) applyConsentDefaults();
  if (a.gtmContainerId) {
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    loadScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(a.gtmContainerId)}`);
  }
  if (a.ga4MeasurementId) {
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(a.ga4MeasurementId)}`);
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', a.ga4MeasurementId, { anonymize_ip: true });
  }
  if (a.plausibleDomain) {
    loadScript('https://plausible.io/js/script.tagged-events.js', { 'data-domain': a.plausibleDomain, defer: '' });
    window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
  }
  if (a.cloudflareBeaconToken) {
    loadScript('https://static.cloudflareinsights.com/beacon.min.js', { defer: '', 'data-cf-beacon': JSON.stringify({ token: a.cloudflareBeaconToken }) });
  }
}

/** Find a readable label for a clicked element. */
function labelOf(el) {
  return el.dataset.trackLabel || el.getAttribute('aria-label') || (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
}
function sectionOf(el) {
  const s = el.closest('article[id], section[id], section[aria-labelledby], header, footer, nav, aside');
  if (!s) return 'unknown';
  return s.id || s.getAttribute('aria-labelledby') || s.tagName.toLowerCase();
}

/** One delegated listener tracks every CTA on every page. */
export function bindClickTracking() {
  document.addEventListener('click', e => {
    const el = e.target.closest('a, button');
    if (!el || el.type === 'submit') return;
    const href = el.getAttribute('href') || '';
    const base = { cta_label: labelOf(el), cta_text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80), section: sectionOf(el) };

    if (el.dataset.wa || href.includes('wa.me/')) {
      track('whatsapp_click', { ...base, wa_context: el.dataset.wa || 'general', link_url: href.split('?')[0] });
    } else if (href.startsWith('tel:')) {
      track('phone_click', base);
    } else if (el.closest('.nav, .mobile-menu, .site-footer')) {
      track('nav_click', { ...base, link_url: href });
    } else if (el.dataset.track || el.classList.contains('btn') || el.classList.contains('link-arrow')) {
      track('cta_click', { ...base, link_url: href });
    } else if (href && /^https?:/.test(href) && !href.startsWith(location.origin)) {
      track('outbound_click', { ...base, link_url: href });
    }
  }, { capture: true });

  document.querySelectorAll('details[data-track-faq]').forEach(d => {
    d.addEventListener('toggle', () => { if (d.open) track('faq_open', { faq: d.dataset.trackFaq }); });
  });

  // Scroll depth
  const marks = [25, 50, 75, 100];
  const seen = new Set();
  const onScroll = () => {
    const h = document.documentElement;
    const pct = ((h.scrollTop + innerHeight) / h.scrollHeight) * 100;
    for (const m of marks) if (pct >= m - 1 && !seen.has(m)) { seen.add(m); track('scroll_depth', { percent: m }); }
    if (seen.size === marks.length) removeEventListener('scroll', onScroll);
  };
  addEventListener('scroll', onScroll, { passive: true });
}
