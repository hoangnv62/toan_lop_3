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

const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Mốc thời gian hiện tại theo giờ Việt Nam.
 *
 * Dùng để nhúng vào system prompt của chatbot. Không có nó thì model không biết
 * hôm nay là ngày nào, nên "9h hôm nay, hạn 9h ngày mai" bị bịa thành ngày ngẫu
 * nhiên — đã tạo ra đề thi có deadline nằm ở quá khứ, học sinh không làm được.
 *
 * Trả về cả `isoDate` để model ghép thẳng vào tham số ISO 8601 của tool.
 */
export const describeNow = (now = new Date()) => {
  const vi = (options) =>
    new Intl.DateTimeFormat('vi-VN', { timeZone: VN_TIMEZONE, ...options }).format(now);
  // en-CA cho ra đúng dạng yyyy-mm-dd.
  const isoDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);

  return {
    isoDate,
    text:
      `${vi({ weekday: 'long' })}, ngày ${vi({ day: '2-digit', month: '2-digit', year: 'numeric' })}, ` +
      `${vi({ hour: '2-digit', minute: '2-digit', hour12: false })} (giờ Việt Nam)`,
  };
};
