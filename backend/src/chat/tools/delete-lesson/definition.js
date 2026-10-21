export const definition = {
  type: 'function',
  function: {
    name: 'delete_lesson',
    description:
      'Xóa vĩnh viễn một bài học CÙNG mọi đề thi, câu hỏi, lượt giao đề, bài làm của học sinh và ' +
      'câu hỏi ngân hàng thuộc bài đó. Cần lesson_id (dùng get_lessons). Lần gọi đầu KHÔNG ' +
      'xóa mà ' +
      'trả bản xem trước (sẽ mất những gì) để hỏi giáo viên xác nhận.',
    parameters: {
      type: 'object',
      properties: {
        lesson_id: { type: 'integer', description: 'ID bài học cần xóa' },
      },
      required: ['lesson_id'],
    },
  },
};
