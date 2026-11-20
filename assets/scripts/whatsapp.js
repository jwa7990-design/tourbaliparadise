/* WhatsApp links & messages. The number lives only in config.js. */
import { BUSINESS } from './config.js';
import { basePrice, zonePrice } from './pricing.js';
import { t } from './i18n.js';
import { formatIDR, formatConverted } from './currency.js';

export const waUrl = (text = '') =>
  `https://wa.me/${BUSINESS.whatsappNumber}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/** The same chat in WhatsApp Web (for desktop visitors who use it). */
export const waWebUrl = (text = '') =>
  `https://web.whatsapp.com/send?phone=${BUSINESS.whatsappNumber}${text ? `&text=${encodeURIComponent(text)}` : ''}`;

/** "(Indicative price on your website: Rp 600,000 ≈ A$49 AUD.)" or ''. */
export function priceLineFor(amountIdr) {
  const idr = formatIDR(amountIdr);
  if (!idr) return '';
  const conv = formatConverted(amountIdr);
  return t('wa.priceLine', { price: conv ? `${idr} ≈ ${conv}` : idr });
}
export const priceLine = priceKey => priceLineFor(basePrice(priceKey));

/** Contextual message for a [data-wa] link. */
export function contextMessage(ctx, priceKey, zoneKey) {
  if (zoneKey) {
    const msg = t('wa.airportZone', { area: t(`zones.${zoneKey}`) });
    const pl = priceLineFor(zonePrice(zoneKey));
    return pl ? `${msg}\n\n${pl}` : msg;
  }
  const base = t(`wa.${ctx}`);
  const msg = base.startsWith('wa.') ? t('wa.general') : base;
  const pl = priceKey ? priceLine(priceKey) : '';
  return pl ? `${msg}\n\n${pl}` : msg;
}

/** Update every WhatsApp link with a message in the current language. */
export function refreshWaLinks(root = document) {
  root.querySelectorAll('[data-wa]').forEach(a => {
    a.href = waUrl(contextMessage(a.dataset.wa, a.dataset.waPrice, a.dataset.waZone));
  });
}

/** Full enquiry message from the form. Optional fields are left out when empty. */
export function enquiryMessage(d) {
  const lines = [
    t('wa.enquiry.intro'),
    '',
    `${t('wa.enquiry.name')}: ${d.name}`,
    `${t('wa.enquiry.interest')}: ${d.service}`,
    ...(d.area ? [`${t('wa.enquiry.area')}: ${d.area}`] : []),
    ...(d.vehicle ? [`${t('form.vehicle')}: ${d.vehicle}`] : []),
    `${t('wa.enquiry.date')}: ${d.date}`,
    `${t('wa.enquiry.passengers')}: ${d.passengers}`,
    `${t('wa.enquiry.accommodation')}: ${d.accommodation}`,
  ];
  if (d.groupNote) lines.push('', d.groupNote);
  if (d.notes) lines.push('', `${t('wa.enquiry.notes')}:`, d.notes);
  const pl = priceLineFor(d.priceIdr);
  if (pl) lines.push('', pl);
  lines.push('', t('wa.enquiry.closing'));
  return lines.join('\n');
}

/** One place that turns a completed enquiry into the message and its links.
    Phones open `url` directly; desktops show `url` as a QR code. */
export function enquiryLink(d) {
  const text = enquiryMessage(d);
  return { text, url: waUrl(text), webUrl: waWebUrl(text) };
}
