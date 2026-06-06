export const definition = {
  type: 'function',
  function: {
    name: 'get_exam_stats',
    description: 'Xem thống kê chi tiết kết quả của một đề thi: điểm trung bình, phân bố điểm, tỉ lệ đúng/sai theo từng câu hỏi.',
    parameters: {
      type: 'object',
      properties: {
        exam_id: {
          type: 'integer',
          description: 'ID đề thi cần xem thống kê',
        },
      },
      required: ['exam_id'],
    },
  },
};
