export const definition = {
  type: 'function',
  function: {
    name: 'update_lesson',
    description: 'Đổi tên một bài học của giáo viên. Cần lesson_id (dùng get_lessons để tìm).',
    parameters: {
      type: 'object',
      properties: {
        lesson_id: { type: 'integer', description: 'ID bài học cần đổi tên' },
        title: { type: 'string', description: 'Tên mới của bài học' },
      },
      required: ['lesson_id', 'title'],
    },
  },
};
