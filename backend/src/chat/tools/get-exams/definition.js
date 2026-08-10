export const definition = {
  type: 'function',
  function: {
    name: 'get_exams',
    description: `Lấy danh sách đề thi của giáo viên, kèm exam_id, số câu hỏi và các lớp đã được giao.
BẮT BUỘC gọi tool này trước khi sửa (update_exam), xóa (delete_exam), giao (assign_exam_to_class),
hủy giao (unassign_exam) hoặc xem thống kê (get_exam_stats) một đề đã có — vì các tool đó cần exam_id.
Kể cả đề vừa tạo trong cuộc trò chuyện này cũng phải gọi lại để lấy đúng exam_id.`,
    parameters: {
      type: 'object',
      properties: {
        lesson_id: {
          type: 'integer',
          description:
            'Chỉ lấy đề thuộc bài học này. Bỏ trống để lấy đề của tất cả bài học — dùng khi chưa biết đề nằm ở bài học nào.',
        },
      },
      required: [],
    },
  },
};
