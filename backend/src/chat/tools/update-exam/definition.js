export const definition = {
  type: 'function',
  function: {
    name: 'update_exam',
    description: `Cập nhật đề thi. Hỗ trợ 2 loại thay đổi (có thể kết hợp cùng lúc):
- Nội dung đề (name, description, questions): chỉ cần exam_id
- Thông tin giao đề (time_limit, deadline, open_time): cần thêm class_id. Chỉ truyền trường
  muốn đổi — trường không truyền giữ nguyên giá trị cũ`,
    parameters: {
      type: 'object',
      properties: {
        exam_id: {
          type: 'integer',
          description: 'ID đề thi cần cập nhật',
        },
        name: {
          type: 'string',
          description: 'Tên mới của đề thi',
        },
        description: {
          type: 'string',
          description: 'Mô tả mới của đề thi',
        },
        questions: {
          type: 'array',
          description: 'Danh sách câu hỏi thay thế toàn bộ. Mỗi câu có đúng 4 đáp án, 1 đúng.',
          items: {
            type: 'object',
            properties: {
              content:     { type: 'string' },
              explanation: { type: 'string' },
              answers: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    content:   { type: 'string' },
                    isCorrect: { type: 'boolean' },
                  },
                  required: ['content', 'isCorrect'],
                },
              },
            },
            required: ['content', 'answers'],
          },
        },
        class_id: {
          type: 'integer',
          description: 'ID lớp học — bắt buộc khi muốn sửa thông tin giao đề',
        },
        time_limit: {
          type: 'integer',
          description: 'Thời gian làm bài mới (giây)',
        },
        deadline: {
          type: 'string',
          description: 'Hạn nộp mới, ISO 8601 theo giờ Việt Nam (vd 2026-08-12T23:00:00). ' +
            'Truyền "none" để bỏ giới hạn. Không đổi thì đừng truyền.',
        },
        open_time: {
          type: 'string',
          description: 'Thời điểm mở đề mới, ISO 8601 theo giờ Việt Nam (vd 2026-08-11T07:00:00). ' +
            'Truyền "now" để mở ngay. Không đổi thì đừng truyền.',
        },
      },
      required: ['exam_id'],
    },
  },
};
