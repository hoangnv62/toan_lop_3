export const definition = {
  type: 'function',
  function: {
    name: 'delete_exam',
    description:
      'Xóa vĩnh viễn một đề thi của giáo viên. Cần exam_id (dùng get_exams để tìm). ' +
      'Lần gọi đầu KHÔNG xóa mà trả về thông tin đề để hỏi giáo viên xác nhận; chỉ gọi lại ' +
      'ở lượt sau khi giáo viên đã đồng ý rõ ràng.',
    parameters: {
      type: 'object',
      properties: {
        exam_id: {
          type: 'integer',
          description: 'ID của đề thi cần xóa',
        },
      },
      required: ['exam_id'],
    },
  },
};
