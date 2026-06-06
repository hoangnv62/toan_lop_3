export const definition = {
  type: 'function',
  function: {
    name: 'search_question_bank',
    description: 'Tìm câu hỏi trong ngân hàng câu hỏi của giáo viên theo chủ đề hoặc bài học.',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Từ khóa tìm kiếm trong nội dung câu hỏi (ví dụ: "phép cộng", "hình chữ nhật")',
        },
        lesson_id: {
          type: 'integer',
          description: 'ID bài học để lọc câu hỏi theo bài cụ thể',
        },
        limit: {
          type: 'integer',
          description: 'Số câu hỏi tối đa trả về (mặc định 10, tối đa 20)',
        },
      },
      required: [],
    },
  },
};
