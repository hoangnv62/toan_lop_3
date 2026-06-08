export const definition = {
  type: 'function',
  function: {
    name: 'assign_exam_to_class',
    description: 'Giao đề thi cho một lớp học. Cần biết exam_id và class_id (dùng get_lessons/get_classes nếu chưa biết).',
    parameters: {
      type: 'object',
      properties: {
        exam_id: {
          type: 'integer',
          description: 'ID của đề thi cần giao',
        },
        class_id: {
          type: 'integer',
          description: 'ID của lớp học nhận bài',
        },
        time_limit: {
          type: 'integer',
          description: 'Thời gian làm bài tính bằng giây (mặc định 1200 = 20 phút)',
        },
        open_time: {
          type: 'string',
          description: 'Thời điểm mở đề, định dạng ISO 8601. Để null nếu mở ngay.',
        },
        deadline: {
          type: 'string',
          description: 'Thời hạn nộp bài, định dạng ISO 8601. Để null nếu không giới hạn.',
        },
      },
      required: ['exam_id', 'class_id'],
    },
  },
};
