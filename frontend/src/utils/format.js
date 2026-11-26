/* Dates from the API are naive (no timezone suffix) so JS parses them as local time. */
export const parseDate = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const fmtDate = (v, opts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) => {
  const d = parseDate(v);
  return d ? d.toLocaleDateString(undefined, opts) : '-';
};
export const fmtTime = (v) => {
  const d = parseDate(v);
  return d ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '-';
};
export const fmtDateTime = (v) => `${fmtDate(v)}, ${fmtTime(v)}`;

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function fmtRange(start, end) {
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s) return '-';
  if (!e) return fmtDateTime(s);
  return sameDay(s, e)
    ? `${fmtDate(s)}, ${fmtTime(s)} to ${fmtTime(e)}`
    : `${fmtDateTime(s)} to ${fmtDateTime(e)}`;
}

export function dateParts(v) {
  const d = parseDate(v);
  if (!d) return { month: '', day: '', weekday: '' };
  return {
    month: d.toLocaleDateString(undefined, { month: 'short' }),
    day: d.getDate(),
    weekday: d.toLocaleDateString(undefined, { weekday: 'short' }),
  };
}

export function timeUntil(v) {
  const d = parseDate(v);
  if (!d) return '';
  const diff = d.getTime() - Date.now();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const min = 60e3, hour = 60 * min, day = 24 * hour;
  if (abs < hour) return rtf.format(Math.round(diff / min), 'minute');
  if (abs < day) return rtf.format(Math.round(diff / hour), 'hour');
  if (abs < 60 * day) return rtf.format(Math.round(diff / day), 'day');
  return rtf.format(Math.round(diff / (30 * day)), 'month');
}

export const isPast = (v) => {
  const d = parseDate(v);
  return !!d && d.getTime() < Date.now();
};

/* <input type="datetime-local"> value ("YYYY-MM-DDTHH:mm") -> naive ISO the API expects.
   We never send "Z"/offsets: the backend stores naive datetimes, and comparing aware vs naive
   values inside event updates raises a TypeError (HTTP 500). */
export const toApiDateTime = (local) => (!local ? null : local.length === 16 ? `${local}:00` : local);

export function toInputValue(v) {
  const d = parseDate(v);
  if (!d) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || '?';
export const firstName = (name = '') => name.trim().split(/\s+/)[0] || 'there';
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/* Deterministic poster colours so each club/event keeps the same look everywhere. */
const PALETTE = [
  { bg: '#2F4BFF', fg: '#FFFFFF' },
  { bg: '#FF4D94', fg: '#15183A' },
  { bg: '#FFC933', fg: '#15183A' },
  { bg: '#2ED3A5', fg: '#15183A' },
  { bg: '#FF7A45', fg: '#15183A' },
  { bg: '#B79CFF', fg: '#15183A' },
];
export function hashStr(s = '') {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
export function coverFor(key) {
  const p = PALETTE[hashStr(key) % PALETTE.length];
  return { '--cover-bg': p.bg, '--cover-fg': p.fg };
}

export const CATEGORY_SUGGESTIONS = [
  'Technology', 'Arts', 'Music', 'Sports', 'Literature', 'Science',
  'Cultural', 'Social service', 'Entrepreneurship', 'Gaming', 'Workshop',
];
