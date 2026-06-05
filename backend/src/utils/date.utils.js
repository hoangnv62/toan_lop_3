/**
 * Convert a date value to dd/mm/yyyy.
 * Returns null if input is falsy.
 */
export const formatDate = (value) => {
  if (!value) return null;
  const str = value instanceof Date ? value.toISOString() : String(value);
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, yyyy, mm, dd] = match;
  return `${dd}/${mm}/${yyyy}`;
};

/**
 * Convert a datetime value to dd/mm/yyyy HH:mm.
 * Returns null if input is falsy.
 */
export const formatDateTime = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return null;
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const HH   = String(d.getHours()).padStart(2, '0');
  const min  = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${HH}:${min}`;
};
