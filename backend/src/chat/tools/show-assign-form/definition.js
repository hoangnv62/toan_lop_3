export const definition = {
  type: 'function',
  function: {
    name: 'show_assign_exam_form',
    description:
      'Hiện form giao bài ngay trong khung chat để giáo viên tự chọn lớp, thời gian làm bài, giờ ' +
      'mở đề và hạn nộp rồi bấm "Giao bài". Dùng khi giáo viên nhờ giao một đề mà CHƯA nói đủ ' +
      'thời gian làm bài + giờ mở + hạn nộp — thay cho việc hỏi bằng chữ. Cần exam_id (dùng ' +
      'get_exams để tìm). Biết lớp thì truyền class_id để chọn sẵn.',
    parameters: {
      type: 'object',
      properties: {
        exam_id: { type: 'integer', description: 'ID đề thi cần giao' },
        class_id: { type: 'integer', description: 'ID lớp để chọn sẵn trong form (tuỳ chọn)' },
      },
      required: ['exam_id'],
    },
  },
};
