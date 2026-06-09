import { useEffect, useState } from 'react';
import {
  getQuestionBank, createBankQuestion, updateBankQuestion,
  deleteBankQuestion, importQuestionBankFromExcel,
} from '../api/questionBankService';
import { toastPromise } from '../utils/toast-promise';
import { toast } from 'react-toastify';

export const useQuestionBank = (page = 1, limit = 10, q = '', lessonId = null) => {
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await getQuestionBank(page, limit, q, lessonId);
        setData(result);
      } catch (err) {
        toast.error(err?.message || 'Không thể tải ngân hàng câu hỏi');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, limit, q, lessonId]);

  return { ...data, loading };
};

export const useQuestionBankMutations = () => {
  const [loading, setLoading] = useState(false);

  const create = async (payload, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        createBankQuestion(payload),
        {
          loading: 'Đang thêm câu hỏi...',
          success: 'Thêm câu hỏi thành công',
          error: (err) => err?.message || 'Thêm câu hỏi thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id, payload, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        updateBankQuestion(id, payload),
        {
          loading: 'Đang cập nhật câu hỏi...',
          success: 'Cập nhật câu hỏi thành công',
          error: (err) => err?.message || 'Cập nhật câu hỏi thất bại',
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
        deleteBankQuestion(id),
        {
          loading: 'Đang xóa câu hỏi...',
          success: 'Xóa câu hỏi thành công',
          error: (err) => err?.message || 'Xóa câu hỏi thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const importExcel = async (file, lessonId, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        importQuestionBankFromExcel(file, lessonId),
        {
          loading: 'Đang import câu hỏi...',
          success: 'Import câu hỏi thành công',
          error: (err) => err?.message || 'Import thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  return { create, update, remove, importExcel, loading };
};
