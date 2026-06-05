// Parse "dd/mm/yyyy" → "YYYY-MM-DD" for <input type="date">
export const parseDateToInput = (str) => {
  if (!str) return '';
  const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return '';
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
};

// Parse "dd/mm/yyyy HH:mm" → "YYYY-MM-DDTHH:mm" for <input type="datetime-local">
export const parseDateTimeToLocal = (str) => {
  if (!str) return '';
  const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/);
  if (!match) return '';
  const [, dd, mm, yyyy, HH, min] = match;
  return `${yyyy}-${mm}-${dd}T${HH}:${min}`;
};

// Parse "dd/mm/yyyy HH:mm" → Date object for comparisons
export const parseDateTime = (str) => {
  if (!str) return null;
  const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/);
  if (!match) return null;
  const [, dd, mm, yyyy, HH, min] = match;
  return new Date(`${yyyy}-${mm}-${dd}T${HH}:${min}`);
};
