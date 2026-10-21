// Nhãn hiện trong khung chat khi chatbot đang chạy tool (part `tool-<tên>` ở trạng thái
// input-available). Tên tool khớp src/chat/tools/registry.js ở backend.
export const CHAT_TOOL_LABELS = {
  search_question_bank:   'Đang tìm câu hỏi trong ngân hàng...',
  save_questions_to_bank: 'Đang lưu câu hỏi vào ngân hàng...',
  get_student_stats:      'Đang lấy thống kê học sinh...',
  get_lessons:            'Đang lấy danh sách bài học...',
  get_classes:            'Đang lấy danh sách lớp học...',
  get_exams:              'Đang lấy danh sách đề thi...',
  create_exam:            'Đang tạo đề thi...',
  get_exam_stats:         'Đang lấy thống kê đề thi...',
  assign_exam_to_class:   'Đang giao bài tập cho lớp...',
  delete_exam:            'Đang xóa đề thi...',
  unassign_exam:          'Đang hủy giao đề thi...',
  create_announcement:    'Đang gửi thông báo...',
  get_student_progress:   'Đang lấy tiến độ học sinh...',
  update_exam:            'Đang cập nhật đề thi...',
};

// Tool đang chạy (chưa có kết quả) gần nhất của tin nhắn → nhãn để hiện, hoặc null.
export const runningToolLabel = (message) => {
  const running = [...message.parts].reverse()
    .find(p => p.type.startsWith('tool-') && p.state === 'input-available');
  if (!running) return null;
  const name = running.type.slice('tool-'.length);
  return CHAT_TOOL_LABELS[name] ?? 'Đang xử lý...';
};
