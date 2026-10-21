export const definition = {
  type: 'function',
  function: {
    name: 'create_lesson',
    description:
      'Tạo bài học (chủ đề) mới cho giáo viên, vd. "Phép nhân". Chỉ gọi SAU KHI đã hỏi và giáo ' +
      'viên đồng ý tạo. Trùng tên bài đã có thì không tạo mà trả bài cũ; có bài gần trùng ' +
      'tên thì trả danh sách để hỏi lại — giáo viên vẫn muốn tạo bài riêng thì gọi lại với ' +
      'allow_similar=true.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Tên bài học, vd. "Phép nhân trong phạm vi 100"' },
        allow_similar: {
          type: 'boolean',
          description: 'true khi giáo viên đã xác nhận vẫn tạo dù có bài gần trùng tên',
        },
      },
      required: ['title'],
    },
  },
};
