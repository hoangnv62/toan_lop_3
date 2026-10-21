import { toast } from 'react-toastify';

export const toastPromise = (promise, { loading, success, error }) =>
  toast.promise(promise, {
    pending: loading,
    // success/error nhận hàm khi câu báo phụ thuộc kết quả trả về.
    success: typeof success === 'function' ? { render: ({ data }) => success(data) } : success,
    error: {
      render({ data }) {
        return typeof error === 'function'
          ? error(data)
          : error || data?.message || 'Có lỗi xảy ra';
      },
    },
  });
