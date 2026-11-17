/* Bali Paradise: page bootstrap. */
import { resolveInitialLang, setLang, getLang, applyTranslations, suggestedLang, translateIn } from './i18n.js';
import { initCurrency, setCurrency, getCurrency, loadRates } from './currency.js';
import { refreshWaLinks } from './whatsapp.js';
import { track, initAnalytics, bindClickTracking, setTrackingContext } from './track.js';
import { store } from './storage.js';
import {
  renderHeader, renderFooter, syncSelects, fillIcons, showLangSuggestion,
  initReveal, numberSections, renderPrices, renderInclusions, renderDriver, renderCommitments, renderReviews, renderContact,
} from './ui.js';
import { renderForms } from './form.js';

function renderDynamic() {
  renderPrices();
  renderInclusions();
  renderDriver();
  renderCommitments();
  renderReviews();
  renderContact();
  fillIcons();
  refreshWaLinks();
}

async function init() {
  initAnalytics();
  setTrackingContext(() => ({ language: getLang(), currency: getCurrency() }));
  initCurrency();
  await setLang(resolveInitialLang(), { persist: false });

  renderHeader();
  renderFooter();
  numberSections();
  renderForms();
  renderDynamic();
  applyTranslations();
  bindClickTracking();
  initReveal();

  // Preference selectors (header + mobile menu)
  document.addEventListener('change', async e => {
    const sel = e.target.closest('[data-pref]');
    if (!sel) return;
    if (sel.dataset.pref === 'lang') {
      const from = getLang();
      await setLang(sel.value);
      track('language_change', { from, to: getLang(), via: sel.id });
    } else {
      const from = getCurrency();
      setCurrency(sel.value);
      track('currency_change', { from, to: sel.value, via: sel.id });
    }
  });

  document.addEventListener('bp:langchange', () => { renderDynamic(); syncSelects(); });
  document.addEventListener('bp:currencychange', () => { renderPrices(); refreshWaLinks(); syncSelects(); });
  document.addEventListener('bp:rateschange', () => { renderPrices(); refreshWaLinks(); });

  // Exchange rates: only needed on pages that show prices or price-bearing WhatsApp links.
  if (document.querySelector('[data-price], [data-wa-price], [data-inline-price], [data-ratecard], [data-giving], [data-giving-log]')) loadRates();

  // Gentle language suggestion based on the browser language (no redirect).
  const s = suggestedLang();
  if (s && s !== getLang()) {
    const [text, yes, no] = await Promise.all([
      translateIn(s, 'langSuggest.text'), translateIn(s, 'langSuggest.switch'), translateIn(s, 'langSuggest.dismiss'),
    ]);
    if (text) {
      showLangSuggestion(s, text, yes, no,
        async () => { await setLang(s); track('language_change', { from: 'en', to: s, via: 'suggestion' }); },
        () => { store.set('bp_lang_suggest_dismissed', '1'); track('language_suggestion_dismissed', { suggested: s }); });
    }
  }
}

init().catch(err => console.error('Bali Paradise init failed', err));
