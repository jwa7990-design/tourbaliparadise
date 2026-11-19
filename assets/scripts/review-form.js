/* Review form for guests without a Google account.
   The site has no database, so a submitted review is sent to Aris on WhatsApp
   (phones open WhatsApp directly; computers get the QR handoff). Nothing is
   published automatically: approved reviews are added to REVIEWS in config.js
   by hand. The guest must tick consent before the form will send. */
import { t, getLang } from './i18n.js';
import { waUrl, waWebUrl } from './whatsapp.js';
import { opensWhatsAppDirectly, showHandoff } from './wa-handoff.js';
import { track } from './track.js';
import { icon } from './ui.js';

const SERVICES = ['local', 'solo', 'airport', 'driver', 'custom', 'other'];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const thisMonth = () => new Date().toISOString().slice(0, 7);

function field(id, key, control, { full = false, optional = false } = {}) {
  return `<div class="field${full ? ' field--full' : ''}">
    <label for="${id}"><span data-i18n="reviewForm.${key}">${esc(t(`reviewForm.${key}`))}</span>${optional ? ` <span class="optional" data-i18n="form.optional">${esc(t('form.optional'))}</span>` : ''}</label>
    ${control}
    <span class="field__error" id="${id}-err" aria-live="polite"></span>
  </div>`;
}

/** The message Aris receives, in English so it can be published as written. */
function reviewMessage(v) {
  const stars = '★'.repeat(v.rating) + '☆'.repeat(5 - v.rating);
  const lines = [
    'New review for tourbaliparadise.com',
    '',
    `Rating: ${stars} (${v.rating}/5)`,
    `Experience: ${t(`reviewForm.services.${v.service}`)}`,
    `Name: ${v.name}`,
  ];
  if (v.country) lines.push(`Country: ${v.country}`);
  if (v.month) lines.push(`Trip: ${v.month}`);
  lines.push('', 'Review:', v.text, '', `Consent: I agree this review can be published on the website with my first name${v.country ? ' and country' : ''}.`, `(Language on site: ${getLang()})`);
  return lines.join('\n');
}

export function renderReviewForms() {
  document.querySelectorAll('[data-review-form]').forEach((host, n) => {
    const id = k => `rf${n}-${k}`;
    host.innerHTML = `
      <form class="enquiry review-form" novalidate>
        <fieldset class="field field--full review-stars" aria-describedby="${id('rating')}-err">
          <legend data-i18n="reviewForm.rating">${esc(t('reviewForm.rating'))}</legend>
          <div class="review-stars__row">
            ${[5, 4, 3, 2, 1].map(r => `<input type="radio" id="${id('r' + r)}" name="rating" value="${r}"><label for="${id('r' + r)}" title="${r}/5"><span aria-hidden="true">★</span><span class="sr-only">${esc(t('reviews.stars', { n: r }))}</span></label>`).join('')}
          </div>
          <span class="field__error" id="${id('rating')}-err" aria-live="polite"></span>
        </fieldset>
        ${field(id('service'), 'service', `<select id="${id('service')}" name="service" required aria-describedby="${id('service')}-err">
            <option value="" data-i18n="form.choose">${esc(t('form.choose'))}</option>
            ${SERVICES.map(s => `<option value="${s}" data-i18n="reviewForm.services.${s}">${esc(t(`reviewForm.services.${s}`))}</option>`).join('')}
          </select>`, { full: true })}
        ${field(id('name'), 'name', `<input id="${id('name')}" name="name" type="text" autocomplete="given-name" maxlength="40" required aria-describedby="${id('name')}-err">`)}
        ${field(id('country'), 'country', `<input id="${id('country')}" name="country" type="text" autocomplete="country-name" maxlength="40">`, { optional: true })}
        ${field(id('month'), 'month', `<input id="${id('month')}" name="month" type="month" max="${thisMonth()}">`, { optional: true })}
        ${field(id('text'), 'text', `<textarea id="${id('text')}" name="text" minlength="20" maxlength="1500" required aria-describedby="${id('text')}-err" data-i18n-placeholder="reviewForm.textPh" placeholder="${esc(t('reviewForm.textPh'))}"></textarea>`, { full: true })}
        <div class="field field--full review-consent">
          <label class="review-consent__label"><input type="checkbox" name="consent" value="yes" aria-describedby="${id('consent')}-err"> <span data-i18n="reviewForm.consent">${esc(t('reviewForm.consent'))}</span></label>
          <span class="field__error" id="${id('consent')}-err" aria-live="polite"></span>
        </div>
        <div class="enquiry__foot">
          <p class="enquiry__summary" role="alert"></p>
          <button class="btn btn--green btn--icon" type="submit">${icon('whatsapp')}<span data-i18n="reviewForm.submit">${esc(t('reviewForm.submit'))}</span></button>
          <p class="enquiry__note" data-i18n="reviewForm.note">${esc(t('reviewForm.note'))}</p>
        </div>
      </form>`;

    const form = host.querySelector('form');
    const errEl = name => form.querySelector(`#${id(name)}-err`);
    const setError = (name, key) => {
      const el = errEl(name);
      const input = name === 'rating' ? null : form.elements[name];
      if (key) { el.dataset.i18n = key; el.textContent = t(key); input?.setAttribute('aria-invalid', 'true'); }
      else { delete el.dataset.i18n; el.textContent = ''; input?.removeAttribute('aria-invalid'); }
    };
    const validate = () => {
      const fd = new FormData(form);
      const v = {
        rating: Number(fd.get('rating')) || 0,
        service: fd.get('service') || '',
        name: String(fd.get('name') || '').trim(),
        country: String(fd.get('country') || '').trim(),
        month: fd.get('month') || '',
        text: String(fd.get('text') || '').trim(),
        consent: fd.get('consent') === 'yes',
      };
      const e = {};
      if (!v.rating) e.rating = 'reviewForm.errors.rating';
      if (!v.service) e.service = 'form.errors.service';
      if (v.name.length < 2) e.name = 'form.errors.nameShort';
      if (v.text.length < 20) e.text = 'reviewForm.errors.text';
      if (!v.consent) e.consent = 'reviewForm.errors.consent';
      ['rating', 'service', 'name', 'text', 'consent'].forEach(f => setError(f, e[f]));
      return { v, e };
    };
    form.addEventListener('input', () => { if (form.querySelector('.field__error:not(:empty)')) validate(); });
    form.addEventListener('change', () => { if (form.querySelector('.field__error:not(:empty)')) validate(); });

    form.addEventListener('submit', ev => {
      ev.preventDefault();
      const summary = form.querySelector('.enquiry__summary');
      const { v, e } = validate();
      const bad = Object.keys(e);
      if (bad.length) {
        summary.dataset.i18n = 'form.errors.summary';
        summary.textContent = t('form.errors.summary');
        (bad[0] === 'rating' ? form.querySelector('input[name=rating]') : form.elements[bad[0]])?.focus();
        track('review_form_error', { fields: bad.join(',') });
        return;
      }
      summary.textContent = ''; delete summary.dataset.i18n;
      if (v.month) {
        const [y, m] = v.month.split('-').map(Number);
        v.month = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));
      }
      const text = reviewMessage(v);
      const link = { text, url: waUrl(text), webUrl: waWebUrl(text) };
      const direct = opensWhatsAppDirectly();
      track('review_submit', { rating: v.rating, service: v.service, handoff: direct ? 'direct' : 'qr' });
      if (!direct) {
        showHandoff(form, link, 'review', { title: 'reviewForm.handoff.title', lead: 'reviewForm.handoff.lead', step3: 'reviewForm.handoff.step3', notSent: 'reviewForm.handoff.notSent' });
        return;
      }
      const w = window.open(link.url, '_blank');
      if (w) w.opener = null; else window.location.href = link.url;
    });
  });
}
