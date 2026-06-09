export const definition = {
  type: 'function',
  function: {
    name: 'create_announcement',
    description: 'Đăng thông báo đến một hoặc nhiều lớp học cùng lúc. Cần biết class_ids (dùng get_classes nếu chưa biết).',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Tiêu đề thông báo',
        },
        content: {
          type: 'string',
          description: 'Nội dung thông báo',
        },
        class_ids: {
          type: 'array',
          items: { type: 'integer' },
          description: 'Danh sách ID các lớp nhận thông báo',
          minItems: 1,
        },
      },
      required: ['title', 'content', 'class_ids'],
    },
  },
};
