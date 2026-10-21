import { toLocalSqlDateTime } from '../tools/schedule.js';

// Form giao bài dạng A2UI v0.9 (https://a2ui.org/specification/v0.9-a2ui/). Backend tự dựng từ dữ
// liệu thật thay vì để model sinh JSON: chắc chắn đúng, không tốn token. Component dùng đúng
// tên + thuộc tính của basic catalog, nhưng catalogId là catalog riêng của dự án — frontend hiển
// thị bằng shadcn (frontend/src/components/shared/chat-a2ui/catalog.jsx).
export const A2UI_CATALOG_ID = 'https://eduhub.local/a2ui/catalogs/shadcn-basic-v1.json';
export const ASSIGN_EXAM_ACTION = 'assign_exam';
const DEFAULT_MINUTES = 20;

// 'YYYY-MM-DDTHH:mm' giờ máy chủ — đúng định dạng của <input type="datetime-local">.
const toInputDateTime = (date) => toLocalSqlDateTime(date).slice(0, 16).replace(' ', 'T');

const text = (id, value, variant = 'body') => ({ id, component: 'Text', text: value, variant });

export const buildAssignExamForm = ({ surfaceId, exam, classes, classId }) => {
  const v = 'v0.9';
  const nowInput = toInputDateTime(new Date());
  const components = [
    { id: 'root', component: 'Card', child: 'body' },
    {
      id: 'body', component: 'Column',
      children: [
        'title', 'class', 'minutes', 'open', 'openHint', 'deadline', 'deadlineHint', 'submit',
      ],
    },
    text('title', `Giao đề "${exam.name}"`, 'h4'),
    {
      id: 'class', component: 'ChoicePicker', label: 'Lớp nhận bài',
      variant: 'mutuallyExclusive', value: { path: '/classId' },
      options: classes.map(c => ({ label: c.className, value: String(c.classId) })),
    },
    {
      id: 'minutes', component: 'TextField', label: 'Thời gian làm bài (phút)',
      variant: 'number', value: { path: '/minutes' },
    },
    {
      id: 'open', component: 'DateTimeInput', label: 'Mở đề lúc',
      enableDate: true, enableTime: true, min: nowInput, value: { path: '/openTime' },
    },
    text('openHint', 'Để trống = mở ngay', 'caption'),
    {
      id: 'deadline', component: 'DateTimeInput', label: 'Hạn nộp',
      enableDate: true, enableTime: true, min: nowInput, value: { path: '/deadline' },
    },
    text('deadlineHint', 'Để trống = không giới hạn', 'caption'),
    { id: 'submitLabel', component: 'Text', text: 'Giao bài' },
    {
      id: 'submit', component: 'Button', child: 'submitLabel', variant: 'primary',
      action: {
        event: {
          name: ASSIGN_EXAM_ACTION,
          context: {
            classId: { path: '/classId' },
            minutes: { path: '/minutes' },
            openTime: { path: '/openTime' },
            deadline: { path: '/deadline' },
          },
        },
      },
    },
  ];

  return [
    { version: v, createSurface: { surfaceId, catalogId: A2UI_CATALOG_ID } },
    { version: v, updateComponents: { surfaceId, components } },
    {
      version: v,
      updateDataModel: {
        surfaceId, path: '/',
        value: {
          classId: classId ? [String(classId)] : [],
          minutes: String(DEFAULT_MINUTES),
          openTime: '',
          deadline: '',
        },
      },
    },
  ];
};
