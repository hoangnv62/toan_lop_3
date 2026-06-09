export const definition = {
  type: 'function',
  function: {
    name: 'unassign_exam',
    description: 'Hủy giao một đề thi khỏi một lớp học. Cần biết exam_id và class_id (dùng get_lessons/get_classes nếu chưa biết).',
    parameters: {
      type: 'object',
      properties: {
        exam_id: {
          type: 'integer',
          description: 'ID của đề thi cần hủy giao',
        },
        class_id: {
          type: 'integer',
          description: 'ID của lớp học cần hủy giao đề',
        },
      },
      required: ['exam_id', 'class_id'],
    },
  },
};
