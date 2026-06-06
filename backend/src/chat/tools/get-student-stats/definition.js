export const definition = {
  type: 'function',
  function: {
    name: 'get_student_stats',
    description: 'Lấy thống kê kết quả học tập của học sinh trong lớp do giáo viên quản lý.',
    parameters: {
      type: 'object',
      properties: {
        class_id: {
          type: 'integer',
          description: 'ID lớp cần xem thống kê. Để trống để lấy tất cả lớp của giáo viên.',
        },
      },
      required: [],
    },
  },
};
