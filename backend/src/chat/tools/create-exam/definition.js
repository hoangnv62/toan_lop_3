export const definition = {
  type: 'function',
  function: {
    name: 'create_exam',
    description: 'Tạo đề thi mới và lưu vào hệ thống. Cần biết lesson_id trước (dùng get_lessons nếu chưa biết). Mỗi câu hỏi phải có đúng 4 đáp án và đúng 1 đáp án đúng.',
    parameters: {
      type: 'object',
      properties: {
        lesson_id: {
          type: 'integer',
          description: 'ID bài học chứa đề thi này',
        },
        name: {
          type: 'string',
          description: 'Tên đề thi',
        },
        description: {
          type: 'string',
          description: 'Mô tả đề thi (tuỳ chọn)',
        },
        questions: {
          type: 'array',
          description: 'Danh sách câu hỏi của đề thi',
          items: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'Nội dung câu hỏi',
              },
              explanation: {
                type: 'string',
                description: 'Giải thích đáp án (tuỳ chọn)',
              },
              answers: {
                type: 'array',
                description: 'Đúng 4 đáp án, trong đó đúng 1 cái có isCorrect = true',
                items: {
                  type: 'object',
                  properties: {
                    content:   { type: 'string',  description: 'Nội dung đáp án' },
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
      required: ['lesson_id', 'name', 'questions'],
    },
  },
};
