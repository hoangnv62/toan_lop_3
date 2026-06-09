import { useEffect, useState } from 'react';
import {
  fetchExam, saveExam, deleteExam, cloneExam,
  getExamStats, saveComment, exportExamPdf, exportExam,
} from '../api/examService';
import { toastPromise } from '../utils/toast-promise';
import { toast } from 'react-toastify';

export const useExam = (id) => {
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const result = await fetchExam(id);
        setExam(result);
      } catch (err) {
        toast.error(err?.message || 'Không thể tải đề thi');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return { exam, setExam, loading };
};

export const useExamStats = (examId) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!examId) return;
    const load = async () => {
      try {
        setLoading(true);
        const result = await getExamStats(examId);
        setStats(result);
      } catch (err) {
        toast.error(err?.message || 'Không thể tải thống kê');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [examId]);

  return { stats, loading };
};

export const useExamMutations = () => {
  const [loading, setLoading] = useState(false);

  const save = async (lessonId, examId, payload, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        saveExam(lessonId, examId, payload),
        {
          loading: examId ? 'Đang cập nhật đề thi...' : 'Đang tạo đề thi...',
          success: examId ? 'Cập nhật đề thi thành công' : 'Tạo đề thi thành công',
          error: (err) => err?.message || 'Lưu đề thi thất bại',
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
        deleteExam(id),
        {
          loading: 'Đang xóa đề thi...',
          success: 'Xóa đề thi thành công',
          error: (err) => err?.message || 'Xóa đề thi thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const clone = async (id, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        cloneExam(id),
        {
          loading: 'Đang sao chép đề thi...',
          success: 'Sao chép đề thi thành công',
          error: (err) => err?.message || 'Sao chép thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const comment = async (examId, studentId, text, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        saveComment(examId, studentId, text),
        {
          loading: 'Đang lưu nhận xét...',
          success: 'Lưu nhận xét thành công',
          error: (err) => err?.message || 'Lưu nhận xét thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = async (examId, options) => {
    try {
      setLoading(true);
      await toastPromise(
        exportExamPdf(examId, options),
        {
          loading: 'Đang xuất PDF...',
          success: 'Xuất PDF thành công',
          error: (err) => err?.message || 'Xuất PDF thất bại',
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async (examId, filename) => {
    try {
      setLoading(true);
      await toastPromise(
        exportExam(examId, filename),
        {
          loading: 'Đang xuất Excel...',
          success: 'Xuất Excel thành công',
          error: (err) => err?.message || 'Xuất Excel thất bại',
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return { save, remove, clone, comment, exportPdf, exportExcel, loading };
};
