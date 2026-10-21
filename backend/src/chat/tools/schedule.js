// Chuẩn hoá thời điểm mở đề / hạn nộp mà model gửi lên trước khi lưu vào class_exams.
//
// Vì sao phải chuẩn hoá: cột DATETIME của MariaDB BỎ QUA hậu tố múi giờ — model gửi
// "2026-10-22T16:00:00Z" (= 23:00 giờ VN) thì DB lưu thành 16:00 giờ VN, sớm 7 tiếng. Parse
// bằng Date (hiểu cả Z, +07:00 lẫn chuỗi không múi giờ = giờ máy chủ) rồi ghi lại dạng giờ
// địa phương 'YYYY-MM-DD HH:mm:ss' thì lưu đúng.
//
// "now" / "none" là giá trị model dùng khi giáo viên chọn mở ngay / không giới hạn — tool bắt
// buộc truyền 2 trường này để model không lặng lẽ bỏ qua mà không hỏi.
export const OPEN_NOW = 'now';
export const NO_DEADLINE = 'none';

const pad = (n) => String(n).padStart(2, '0');

export const toLocalSqlDateTime = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
  `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

// → { value: 'YYYY-MM-DD HH:mm:ss' | null, date: Date | null } hoặc { error }
export const parseScheduleTime = (raw, emptyToken, fieldLabel) => {
  if (raw == null || raw === '' || raw === emptyToken) return { value: null, date: null };
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return {
      error: `${fieldLabel} "${raw}" không đúng định dạng ISO 8601 (ví dụ 2026-08-11T09:00:00).`,
    };
  }
  return { value: toLocalSqlDateTime(date), date };
};

// Hạn nộp ở quá khứ thì học sinh mở ra là đã hết hạn; hạn nộp trước giờ mở thì không ai làm được.
// checkPast = false khi sửa giao đề mà không đổi hạn nộp: hạn cũ đã qua thì không chặn việc khác.
export const validateSchedule = ({ openDate, deadlineDate, checkPast = true }) => {
  if (checkPast && deadlineDate && deadlineDate.getTime() <= Date.now()) {
    return `Hạn nộp ${toLocalSqlDateTime(deadlineDate)} đã ở quá khứ nên chưa lưu. ` +
      'Hãy xác nhận lại với thầy/cô xem hạn nộp là ngày nào.';
  }
  if (openDate && deadlineDate && deadlineDate <= openDate) {
    return `Hạn nộp (${toLocalSqlDateTime(deadlineDate)}) phải sau thời điểm mở đề ` +
      `(${toLocalSqlDateTime(openDate)}). Hãy hỏi lại thầy/cô.`;
  }
  return null;
};
