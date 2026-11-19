/* Desktop WhatsApp handoff.
   Phones and tablets open WhatsApp straight away. On a computer the visitor
   may not have WhatsApp, so the same wa.me link is shown as a QR code to scan
   with their phone. The QR code is made here in the browser: the enquiry is
   never sent to another service. Nothing here can tell whether the message
   was actually sent, so the wording never says it was. */
import qrcode from './vendor/qrcode-generator.js';
import { t } from './i18n.js';
import { waUrl } from './whatsapp.js';
import { track } from './track.js';

/** Touch-first devices (phones, most tablets) open WhatsApp directly.
    Based on how the device is used, not on the browser's name. */
export const opensWhatsAppDirectly = () =>
  window.matchMedia('(hover: none) and (pointer: coarse)').matches;

/* Bigger QR codes get too dense to scan from a screen, so stop at version 30
   (137×137 modules). Longer messages fall back to copy and paste. */
const MAX_MODULES = 137;

/** An SVG QR code for `text`, with a 4-module white quiet zone, or null if too long. */
export function qrSvg(text, label) {
  let qr = null;
  // Level L keeps the code as sparse as possible; a code on a screen isn't
  // scuffed or torn, so the extra error correction of M/Q/H isn't needed.
  for (const level of ['L']) {
    try {
      const q = qrcode(0, level);
      q.addData(text, 'Byte');
      q.make();
      if (q.getModuleCount() <= MAX_MODULES) { qr = q; break; }
    } catch { /* too long for a QR code */ }
  }
  if (!qr) return null;
  const n = qr.getModuleCount();
  const quiet = 4;
  const size = n + quiet * 2;
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) d += `M${c + quiet} ${r + quiet}h1v1h-1z`;
    }
  }
  return `<svg class="wa-handoff__svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="${label.replace(/"/g, '&quot;')}"><rect width="${size}" height="${size}" fill="#fff"/><path d="${d}" fill="#111"/></svg>`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Replace the form with the QR handoff panel. The form keeps its values for editing. */
export function showHandoff(form, link, formLocation, copy = {}) {
  // `copy` swaps the wording for other uses (e.g. reviews): { title, lead, step3, notSent } translation keys.
  const k = name => copy[name] || `handoff.${name}`;
  form.parentElement.querySelector('.wa-handoff')?.remove();
  const fullQr = qrSvg(link.url, t('handoff.qrLabel'));
  const qr = fullQr || qrSvg(waUrl(), t('handoff.qrChatLabel'));
  const hid = `${form.querySelector('input')?.id || 'f'}-handoff`;

  const panel = document.createElement('div');
  panel.className = 'wa-handoff';
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-labelledby', `${hid}-title`);
  panel.innerHTML = `
    <div class="wa-handoff__qr">${qr || ''}</div>
    <div class="wa-handoff__body">
      <h3 id="${hid}-title" class="wa-handoff__title" tabindex="-1">${esc(t(k('title')))}</h3>
      <p class="wa-handoff__lead">${esc(t(fullQr ? k('lead') : 'handoff.leadLong'))}</p>
      <ol class="wa-handoff__steps">
        <li>${esc(t('handoff.step1'))}</li>
        <li>${esc(t('handoff.step2'))}</li>
        <li>${esc(t(fullQr ? k('step3') : 'handoff.step3Long'))}</li>
      </ol>
      <p class="wa-handoff__notice">${esc(t(k('notSent')))}</p>
      <div class="wa-handoff__actions">
        <button type="button" class="btn btn--outline" data-handoff="copy">${esc(t('handoff.copy'))}</button>
        <a class="btn btn--outline" href="${esc(link.webUrl)}" target="_blank" rel="noopener" data-handoff="web" data-track-label="handoff_whatsapp_web">${esc(t('handoff.web'))}</a>
        <a class="link-arrow" href="${esc(link.url)}" target="_blank" rel="noopener" data-handoff="app" data-track-label="handoff_whatsapp_app">${esc(t('handoff.app'))} <span aria-hidden="true">→</span></a>
      </div>
      <p class="wa-handoff__status" aria-live="polite"></p>
      <details class="wa-handoff__preview"${fullQr ? '' : ' open'}>
        <summary>${esc(t('handoff.preview'))}</summary>
        <pre>${esc(link.text)}</pre>
      </details>
      <button type="button" class="wa-handoff__edit link-arrow" data-handoff="edit"><span aria-hidden="true">←</span> ${esc(t('handoff.edit'))}</button>
    </div>`;

  form.hidden = true;
  form.after(panel);
  panel.querySelector('.wa-handoff__title').focus();
  track('wa_qr_shown', { form_location: formLocation, qr_content: fullQr ? 'full_message' : 'chat_only', url_length: link.url.length });

  const status = panel.querySelector('.wa-handoff__status');
  panel.addEventListener('click', async e => {
    const el = e.target.closest('[data-handoff]');
    if (!el) return;
    const action = el.dataset.handoff;
    if (action === 'copy') {
      const ok = await copyText(link.text);
      status.textContent = t(ok ? 'handoff.copied' : 'handoff.copyFailed');
      if (!ok) panel.querySelector('.wa-handoff__preview').open = true;
      track('wa_message_copy', { form_location: formLocation, success: ok });
    } else if (action === 'web') {
      track('wa_web_click', { form_location: formLocation });
    } else if (action === 'app') {
      track('wa_app_click', { form_location: formLocation });
    } else if (action === 'edit') {
      panel.remove();
      form.hidden = false;
      form.querySelector('input, select, textarea')?.focus();
      track('wa_handoff_edit', { form_location: formLocation });
    }
  });
}

