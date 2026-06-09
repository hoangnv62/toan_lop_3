export const definition = {
  type: 'function',
  function: {
    name: 'delete_exam',
    description: 'Xóa một đề thi thuộc quyền quản lý của giáo viên. Cần biết exam_id (dùng get_lessons để tìm nếu chưa biết).',
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
