export const definition = {
  type: 'function',
  function: {
    name: 'assign_exam_to_class',
    description:
      'Giao đề thi cho một lớp học. Cần exam_id và class_id (dùng get_exams/get_classes nếu chưa ' +
      'biết). Phải hỏi giáo viên thời gian làm bài, thời điểm mở đề và hạn nộp trước khi gọi.',
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
          description: 'Thời điểm mở đề, ISO 8601 theo giờ Việt Nam (vd 2026-08-11T07:00:00). ' +
            'BẮT BUỘC — hỏi giáo viên; giáo viên chọn mở ngay thì truyền "now".',
        },
        deadline: {
          type: 'string',
          description: 'Hạn nộp bài, ISO 8601 theo giờ Việt Nam (vd 2026-08-12T23:00:00). ' +
            'BẮT BUỘC — hỏi giáo viên; giáo viên chọn không giới hạn thì truyền "none".',
        },
      },
      required: ['exam_id', 'class_id', 'open_time', 'deadline'],
    },
  },
};
