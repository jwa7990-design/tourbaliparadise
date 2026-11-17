/* Giving-back log: read from assets/data/giving-log.json (edited by hand,
   see GIVING-LOG.md). Totals are calculated here, never typed in. */
let pending = null;

const valid = d => d && /^\d{4}-\d{2}-\d{2}$/.test(d.date) && Number.isFinite(d.amountIdr) && d.amountIdr > 0;

export function loadGivingLog() {
  if (!pending) {
    pending = fetch('assets/data/giving-log.json', { cache: 'no-cache' })
      .then(r => (r.ok ? r.json() : { donations: [] }))
      .then(j => (Array.isArray(j.donations) ? j.donations.filter(valid) : []))
      .then(list => list.sort((a, b) => b.date.localeCompare(a.date)))
      .catch(() => []);
  }
  return pending;
}

export function givingTotals(list) {
  return {
    total: list.reduce((s, d) => s + d.amountIdr, 0),
    count: list.length,
    lastDate: list[0]?.date || null,
  };
}
