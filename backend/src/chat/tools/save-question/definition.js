export const definition = {
  type: 'function',
  function: {
    name: 'save_questions_to_bank',
    description: 'Lưu danh sách câu hỏi trắc nghiệm vào ngân hàng câu hỏi. Mỗi câu phải có đúng 4 đáp án và đúng 1 đáp án đúng. Bắt buộc phải có lesson_id — gọi get_lessons trước để lấy đúng ID.',
    parameters: {
      type: 'object',
      properties: {
        lesson_id: {
          type: 'integer',
          description: 'ID bài học chứa các câu hỏi này (BẮT BUỘC). Phải là ID có thật lấy từ get_lessons, KHÔNG được tự bịa hay đoán. Nếu giáo viên chỉ nói tên chủ đề, hãy gọi get_lessons để tìm bài học khớp; không tìm thấy thì hỏi lại giáo viên chứ đừng lưu.',
        },
        questions: {
          type: 'array',
          description: 'Danh sách câu hỏi cần lưu',
          items: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'Nội dung câu hỏi',
              },
              explanation: {
                type: 'string',
                description: 'Giải thích đáp án đúng (tuỳ chọn)',
              },
              answers: {
                type: 'array',
                description: 'Đúng 4 đáp án, trong đó đúng 1 đáp án có isCorrect = true',
                items: {
                  type: 'object',
                  properties: {
                    content: { type: 'string', description: 'Nội dung đáp án' },
                    isCorrect: { type: 'boolean', description: 'true nếu đây là đáp án đúng' },
                  },
                  required: ['content', 'isCorrect'],
                },
              },
            },
            required: ['content', 'answers'],
          },
        },
      },
      required: ['lesson_id', 'questions'],
    },
  },
};
