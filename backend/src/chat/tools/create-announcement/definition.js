export const definition = {
  type: 'function',
  function: {
    name: 'create_announcement',
    description:
      'Đăng thông báo đến một hoặc nhiều lớp và gửi email cho phụ huynh. Cần class_ids ' +
      '(dùng get_classes nếu chưa biết). Lần gọi đầu KHÔNG gửi mà trả bản xem trước để hỏi ' +
      'giáo viên; chỉ gọi lại với đúng nội dung đó ở lượt sau khi giáo viên đã đồng ý.',
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
