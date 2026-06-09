export const definition = {
  type: 'function',
  function: {
    name: 'get_student_progress',
    description: 'Xem tiến độ học tập. Truyền student_id để xem lịch sử điểm từng bài của một học sinh, hoặc class_id để xem điểm trung bình toàn lớp.',
    parameters: {
      type: 'object',
      properties: {
        student_id: {
          type: 'integer',
          description: 'ID học sinh cần xem tiến độ (ưu tiên nếu cung cấp cả hai)',
        },
        class_id: {
          type: 'integer',
          description: 'ID lớp học để xem tóm tắt điểm trung bình của tất cả học sinh',
        },
      },
    },
  },
};
