/* Enquiry form → validated → pre-filled WhatsApp message.
   Creates an enquiry only; it never confirms a booking. */
import { t, getLang } from './i18n.js';
import { enquiryLink } from './whatsapp.js';
import { opensWhatsAppDirectly, showHandoff } from './wa-handoff.js';
import { track } from './track.js';
import { icon } from './ui.js';
import { AIRPORT_ZONES, VEHICLES } from './config.js';
import { basePrice, zonePrice, getZone } from './pricing.js';

const MAX_SEATS = Math.max(...VEHICLES.map(v => v.seats));

const SERVICES = [
  ['airport', 'airport_transfer'],
  ['half_day', 'half_day_driver'],
  ['full_day', 'full_day_driver'],
  ['custom', 'custom_day_trip'],
  ['scooter', 'scooter_tour'],
  ['explore', null],
  ['food', null],
  ['adventure', null],
  ['family', null],
  ['beaches', null],
  ['culture', null],
  ['other', null],
];

let uid = 0;
const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

function field(id, key, control, { full = false, optional = false } = {}) {
  return `<div class="field${full ? ' field--full' : ''}">
    <label for="${id}"><span data-i18n="form.${key}">${t(`form.${key}`)}</span>${optional ? ` <span class="optional" data-i18n="form.optional">${t('form.optional')}</span>` : ''}</label>
    ${control}
    <span class="field__error" id="${id}-err" aria-live="polite"></span>
  </div>`;
}

export function renderForms() {
  document.querySelectorAll('[data-enquiry-form]').forEach(host => {
    const n = ++uid;
    const id = k => `f${n}-${k}`;
    const location = host.dataset.formLocation || document.body.dataset.page;
    host.innerHTML = `
      <form class="enquiry" novalidate>
        ${field(id('name'), 'name', `<input id="${id('name')}" name="name" type="text" autocomplete="name" maxlength="80" required aria-describedby="${id('name')}-err">`)}
        ${field(id('date'), 'date', `<input id="${id('date')}" name="date" type="date" min="${today()}" required aria-describedby="${id('date')}-err">`)}
        ${field(id('passengers'), 'passengers', `<input id="${id('passengers')}" name="passengers" type="number" inputmode="numeric" min="1" max="99" step="1" required aria-describedby="${id('passengers')}-err">`)}
        ${field(id('accommodation'), 'accommodation', `<input id="${id('accommodation')}" name="accommodation" type="text" maxlength="120" required aria-describedby="${id('accommodation')}-err" data-i18n-placeholder="form.accommodationPh" placeholder="${t('form.accommodationPh')}">`)}
        ${field(id('service'), 'service', `<select id="${id('service')}" name="service" required aria-describedby="${id('service')}-err">
            <option value="" data-i18n="form.choose">${t('form.choose')}</option>
            ${SERVICES.map(([v]) => `<option value="${v}" data-i18n="form.options.${v}">${t(`form.options.${v}`)}</option>`).join('')}
          </select>`, { full: true })}
        ${field(id('zone'), 'zone', `<select id="${id('zone')}" name="zone" aria-describedby="${id('zone')}-err">
            <option value="" data-i18n="airportZones.choose">${t('airportZones.choose')}</option>
            ${AIRPORT_ZONES.map(z => `<option value="${z.key}"${z.key === getZone() ? ' selected' : ''} data-i18n="zones.${z.key}">${t(`zones.${z.key}`)}</option>`).join('')}
          </select>`, { full: true })}
        ${field(id('vehicle'), 'vehicle', `<select id="${id('vehicle')}" name="vehicle" aria-describedby="${id('vehicle')}-err ${id('vehicle')}-note">
            ${VEHICLES.map(v => `<option value="${v.key}" data-i18n="vehicles.${v.key}">${t(`vehicles.${v.key}`)}</option>`).join('')}
          </select><small class="field__note" id="${id('vehicle')}-note" data-i18n="form.vehicleNote">${t('form.vehicleNote')}</small>`, { full: true })}
        ${field(id('notes'), 'notes', `<textarea id="${id('notes')}" name="notes" maxlength="800" data-i18n-placeholder="form.notesPh" placeholder="${t('form.notesPh')}"></textarea>`, { full: true, optional: true })}
        <div class="enquiry__foot">
          <p class="enquiry__summary" role="alert"></p>
          <button class="btn btn--green btn--icon" type="submit">${icon('whatsapp')}<span data-i18n="form.submit">${t('form.submit')}</span></button>
          <p class="enquiry__note" data-i18n="form.note">${t('form.note')}</p>
        </div>
      </form>`;

    const form = host.querySelector('form');
    // The area field only appears for airport transfers.
    const zoneField = form.elements.zone.closest('.field');
    const vehicleField = form.elements.vehicle.closest('.field');
    const toggleZone = () => { const air = form.elements.service.value !== 'airport'; zoneField.hidden = air; vehicleField.hidden = air; };
    toggleZone();
    form.elements.service.addEventListener('change', toggleZone);

    // Match the vehicle to the group size: cars too small for the group are
    // greyed out, and if the chosen one no longer fits the next size up is picked.
    const vehicleSel = form.elements.vehicle;
    const vehicleNote = form.querySelector(`#${id('vehicle')}-note`);
    const setNote = (key, vars) => { if (vars) delete vehicleNote.dataset.i18n; else vehicleNote.dataset.i18n = key; vehicleNote.textContent = t(key, vars); };
    const syncVehicle = () => {
      const pax = Number(form.elements.passengers.value) || 0;
      const fits = VEHICLES.filter(v => pax <= v.seats);
      [...vehicleSel.options].forEach(o => { o.disabled = fits.length > 0 && !fits.some(v => v.key === o.value); });
      if (!fits.length) setNote('form.vehicleTwo', { max: MAX_SEATS });
      else if (pax > VEHICLES[0].seats) {
        if (vehicleSel.selectedOptions[0]?.disabled) vehicleSel.value = fits[0].key;
        setNote('form.vehicleBig', { n: pax, seats: fits[0].seats });
      } else setNote('form.vehicleNote');
    };
    syncVehicle();
    form.elements.passengers.addEventListener('input', syncVehicle);
    document.addEventListener('bp:langchange', syncVehicle); // the note has numbers in it
    const setError = (name, key) => {
      const input = form.elements[name];
      const err = form.querySelector(`#${input.id}-err`);
      if (key) { input.setAttribute('aria-invalid', 'true'); err.dataset.i18n = key; err.textContent = t(key); }
      else { input.removeAttribute('aria-invalid'); delete err.dataset.i18n; err.textContent = ''; }
    };

    const validate = () => {
      const v = Object.fromEntries(new FormData(form));
      const errors = {};
      const name = (v.name || '').trim();
      if (!name) errors.name = 'form.errors.required';
      else if (name.length < 2) errors.name = 'form.errors.nameShort';
      if (!v.date) errors.date = 'form.errors.required';
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date)) errors.date = 'form.errors.dateInvalid';
      else if (v.date < today()) errors.date = 'form.errors.datePast';
      const pax = Number(v.passengers);
      if (!v.passengers) errors.passengers = 'form.errors.required';
      else if (!Number.isInteger(pax) || pax < 1 || pax > 99) errors.passengers = 'form.errors.passengers';
      if (!(v.accommodation || '').trim()) errors.accommodation = 'form.errors.required';
      if (!v.service) errors.service = 'form.errors.service';
      if (v.service === 'airport' && !v.zone) errors.zone = 'form.errors.service';
      ['name', 'date', 'passengers', 'accommodation', 'service', 'zone'].forEach(f => setError(f, errors[f]));
      return { v, errors };
    };

    // Clear a field's error as soon as it is fixed.
    form.addEventListener('input', e => { if (e.target.getAttribute('aria-invalid')) validate(); });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const summary = form.querySelector('.enquiry__summary');
      const { v, errors } = validate();
      const bad = Object.keys(errors);
      if (bad.length) {
        summary.dataset.i18n = 'form.errors.summary';
        summary.textContent = t('form.errors.summary');
        form.elements[bad[0]].focus();
        track('form_error', { form_location: location, fields: bad.join(',') });
        return;
      }
      summary.textContent = ''; delete summary.dataset.i18n;

      const [, priceKey] = SERVICES.find(([s]) => s === v.service);
      const isAirport = v.service === 'airport' && v.zone;
      const pax = Number(v.passengers);
      const tooBig = pax > MAX_SEATS;                    // needs more than one vehicle
      const bigGroup = pax > VEHICLES[0].seats;          // bigger than the Innova
      const vehicle = isAirport ? (VEHICLES.find(x => x.key === v.vehicle && pax <= x.seats) || VEHICLES.find(x => pax <= x.seats) || VEHICLES[VEHICLES.length - 1]).key : null;
      // Day prices on the site are for the Innova, so a bigger group gets a quote instead.
      let priceIdr = null;
      if (isAirport) priceIdr = tooBig ? null : zonePrice(v.zone, vehicle);
      else if (priceKey && !(bigGroup && v.service !== 'scooter')) priceIdr = basePrice(priceKey);
      let groupNote = '';
      if (tooBig) groupNote = t('wa.enquiry.twoVehicles', { n: pax });
      else if (bigGroup && !isAirport && v.service !== 'scooter') groupNote = t('wa.enquiry.bigGroup', { n: pax });
      const dateText = new Intl.DateTimeFormat(getLang() === 'zh-CN' ? 'zh-CN' : getLang(), { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
        .format(new Date(`${v.date}T00:00:00`));
      const link = enquiryLink({
        name: v.name.trim(),
        date: dateText,
        passengers: v.passengers,
        accommodation: v.accommodation.trim(),
        service: t(`form.options.${v.service}`),
        notes: (v.notes || '').trim(),
        area: isAirport ? t(`zones.${v.zone}`) : '',
        vehicle: isAirport ? t(`vehicles.${vehicle}`) : '',
        groupNote,
        priceIdr,
      });
      const direct = opensWhatsAppDirectly();

      track('generate_lead', { form_location: location, service: v.service, zone: isAirport ? v.zone : undefined, vehicle: vehicle || undefined, passengers: Number(v.passengers), method: 'whatsapp', handoff: direct ? 'direct' : 'qr' });

      if (!direct) { showHandoff(form, link, location); return; }
      const w = window.open(link.url, '_blank');
      if (w) w.opener = null; else window.location.href = link.url;
    });
  });
}
