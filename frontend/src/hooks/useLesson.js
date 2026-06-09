import { useEffect, useState } from 'react';
import { fetchLessons, createLesson, updateLesson, deleteLesson } from '../api/lessonService';
import { toastPromise } from '../utils/toast-promise';
import { toast } from 'react-toastify';

export const useLessons = (q = '', page = 1, limit = 10) => {
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await fetchLessons(q, page, limit);
        setData(result);
      } catch (err) {
        toast.error(err?.message || 'Không thể tải danh sách bài học');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [q, page, limit]);

  return { ...data, loading };
};

export const useLessonMutations = () => {
  const [loading, setLoading] = useState(false);

  const create = async (title, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        createLesson(title),
        {
          loading: 'Đang tạo bài học...',
          success: 'Tạo bài học thành công',
          error: (err) => err?.message || 'Tạo bài học thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id, title, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        updateLesson(id, title),
        {
          loading: 'Đang cập nhật bài học...',
          success: 'Cập nhật bài học thành công',
          error: (err) => err?.message || 'Cập nhật thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        deleteLesson(id),
        {
          loading: 'Đang xóa bài học...',
          success: 'Xóa bài học thành công',
          error: (err) => err?.message || 'Xóa bài học thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  return { create, update, remove, loading };
};
