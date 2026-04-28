import { MOIS_ABR } from '../constants/mois';

export function isoWeek(d) {
  const dt = new Date(d || Date.now());
  dt.setHours(0,0,0,0);
  dt.setDate(dt.getDate() + 3 - (dt.getDay() + 6) % 7);
  const w1 = new Date(dt.getFullYear(), 0, 4);
  return 1 + Math.round(((dt - w1) / 864e5 - 3 + (w1.getDay() + 6) % 7) / 7);
}

export function genRef(prefix, existingRefs = [], dateStr = null) {
  const d  = dateStr ? new Date(dateStr) : new Date();
  const yr = d.getFullYear();
  const mo = MOIS_ABR[d.getMonth()];
  const wk = String(isoWeek(d)).padStart(3, '0');
  const base = `${prefix}/${yr}/${mo}/${wk}`;
  const same = existingRefs.filter(r => (r || '').startsWith(base));
  const seq  = String(same.length + 1).padStart(2, '0');
  return `${base}/${seq}`;
}
