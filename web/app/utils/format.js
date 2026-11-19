export function dateLabel(value, precision) {
  if (!value) return 'Unknown';
  const d = String(value);
  const [y, m, day] = d.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (precision === 'YEAR_ONLY') return y;
  if (precision === 'MONTH_YEAR' || !day) return `${months[Number(m) - 1] || ''} ${y}`;
  return `${day} ${months[Number(m) - 1] || ''} ${y}`;
}

export function shortDate(value) {
  if (!value) return '—';
  const [y, m, d] = String(value).split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (!m) return y;
  if (!d) return `${months[Number(m) - 1]} ${y}`;
  return `${d} ${months[Number(m) - 1]} ${y}`;
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function dayMonth(value) {
  if (!value) return '—';
  const [y, m] = String(value).split('-');
  return m ? `${m}/${y}` : y;
}
