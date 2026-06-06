export const definition = {
  type: 'function',
  function: {
    name: 'get_lessons',
    description: 'Lấy danh sách bài học của giáo viên. Dùng để biết lesson_id trước khi tạo đề thi hoặc tìm câu hỏi theo bài.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Tìm kiếm bài học theo tên (tuỳ chọn)',
        },
      },
      required: [],
    },
  },
};
