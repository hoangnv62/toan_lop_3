import { useEffect, useState } from 'react';
import {
  fetchClasses, createClass, updateClass, deleteClass, getClassDetail,
  assignStudent, removeStudent, uploadStudents, searchStudents,
  assignExam, updateExamAssignment, unassignExam,
} from '../api/classService';
import { toastPromise } from '../utils/toast-promise';
import { toast } from 'react-toastify';

export const useClasses = (page = 1, limit = 12, refreshKey = 0) => {
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await fetchClasses(page, limit);
        setData(result);
      } catch (err) {
        toast.error(err?.message || 'Không thể tải danh sách lớp học');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, limit, refreshKey]);

  return { ...data, loading };
};

export const useClassDetail = (id, studentPage = 1) => {
  const [classDetail, setClassDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const result = await getClassDetail(id, studentPage);
        setClassDetail(result);
      } catch (err) {
        toast.error(err?.message || 'Không thể tải thông tin lớp học');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, studentPage]);

  return { classDetail, setClassDetail, loading };
};

export const useClassMutations = () => {
  const [loading, setLoading] = useState(false);

  const create = async (className, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        createClass(className),
        {
          loading: 'Đang tạo lớp học...',
          success: 'Tạo lớp học thành công',
          error: (err) => err?.message || 'Tạo lớp học thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id, className, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        updateClass(id, className),
        {
          loading: 'Đang cập nhật lớp học...',
          success: 'Cập nhật lớp học thành công',
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
        deleteClass(id),
        {
          loading: 'Đang xóa lớp học...',
          success: 'Xóa lớp học thành công',
          error: (err) => err?.message || 'Xóa lớp học thất bại',
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

export const useClassStudentMutations = () => {
  const [loading, setLoading] = useState(false);

  const search = async (q, classId) => {
    try {
      setLoading(true);
      return await searchStudents(q, classId);
    } catch (err) {
      toast.error(err?.message || 'Tìm kiếm thất bại');
    } finally {
      setLoading(false);
    }
  };

  const assign = async (classId, username, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        assignStudent(classId, username),
        {
          loading: 'Đang thêm học sinh...',
          success: 'Thêm học sinh thành công',
          error: (err) => err?.message || 'Thêm học sinh thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (classId, studentId, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        removeStudent(classId, studentId),
        {
          loading: 'Đang xóa học sinh khỏi lớp...',
          success: 'Đã xóa học sinh khỏi lớp',
          error: (err) => err?.message || 'Xóa học sinh thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const upload = async (classId, file, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        uploadStudents(classId, file),
        {
          loading: 'Đang import danh sách học sinh...',
          success: 'Import học sinh thành công',
          error: (err) => err?.message || 'Import thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  return { search, assign, remove, upload, loading };
};

export const useClassExamMutations = () => {
  const [loading, setLoading] = useState(false);

  const assign = async (classId, examId, timeLimitMin, deadline, openTime, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        assignExam(classId, examId, timeLimitMin, deadline, openTime),
        {
          loading: 'Đang giao đề thi...',
          success: 'Giao đề thi thành công',
          error: (err) => err?.message || 'Giao đề thi thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const update = async (classId, examId, timeLimitMin, deadline, openTime, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        updateExamAssignment(classId, examId, timeLimitMin, deadline, openTime),
        {
          loading: 'Đang cập nhật bài thi...',
          success: 'Cập nhật bài thi thành công',
          error: (err) => err?.message || 'Cập nhật thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const unassign = async (classId, examId, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        unassignExam(classId, examId),
        {
          loading: 'Đang gỡ đề thi...',
          success: 'Gỡ đề thi thành công',
          error: (err) => err?.message || 'Gỡ đề thi thất bại',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  return { assign, update, unassign, loading };
};
