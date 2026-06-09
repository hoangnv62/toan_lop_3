import { useEffect, useState } from 'react';
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '../api/announcementService';
import { toastPromise } from '../utils/toast-promise';
import { toast } from 'react-toastify';

export const useAnnouncements = (classId) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!classId) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getAnnouncements(classId);
        setAnnouncements(data);
      } catch (err) {
        toast.error(err?.message || 'Không thể tải thông báo');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [classId]);

  return { announcements, setAnnouncements, loading };
};

export const useAnnouncementMutations = (classId) => {
  const [loading, setLoading] = useState(false);

  const create = async (payload, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        createAnnouncement(classId, payload),
        {
          loading: 'Đang đăng thông báo...',
          success: 'Đăng thông báo thành công',
          error: (err) => err?.message || 'Đăng thông báo thất bại',
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
        deleteAnnouncement(id),
        {
          loading: 'Đang xóa thông báo...',
          success: 'Xóa thông báo thành công',
          error: (err) => err?.message || 'Xóa thông báo thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  return { create, remove, loading };
};
