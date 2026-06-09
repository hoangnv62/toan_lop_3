import { useEffect, useState } from 'react';
import { getRelatives, addRelative, updateRelative, deleteRelative } from '../api/relativeService';
import { toastPromise } from '../utils/toast-promise';
import { toast } from 'react-toastify';

export const useRelatives = (studentId) => {
  const [relatives, setRelatives] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getRelatives(studentId);
        setRelatives(data);
      } catch (err) {
        toast.error(err?.message || 'Không thể tải danh sách người thân');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  return { relatives, setRelatives, loading };
};

export const useRelativeMutations = () => {
  const [loading, setLoading] = useState(false);

  const add = async (studentId, payload, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        addRelative(studentId, payload),
        {
          loading: 'Đang thêm người thân...',
          success: 'Thêm người thân thành công',
          error: (err) => err?.message || 'Thêm người thân thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const update = async (relativeId, payload, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        updateRelative(relativeId, payload),
        {
          loading: 'Đang cập nhật thông tin...',
          success: 'Cập nhật thành công',
          error: (err) => err?.message || 'Cập nhật thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (relativeId, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        deleteRelative(relativeId),
        {
          loading: 'Đang xóa người thân...',
          success: 'Xóa người thân thành công',
          error: (err) => err?.message || 'Xóa người thân thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  return { add, update, remove, loading };
};
