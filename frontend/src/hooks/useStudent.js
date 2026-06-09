import { useEffect, useState } from 'react';
import {
  fetchDashboard, fetchTeacherDashboard,
  getStudentResults, getStudentProgress, getAIAdvice,
} from '../api/studentService';
import { toastPromise } from '../utils/toast-promise';
import { toast } from 'react-toastify';

export const useStudentDashboard = (dateFrom, dateTo, all = false) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await fetchDashboard(dateFrom, dateTo, all);
        setDashboard(result);
      } catch (err) {
        toast.error(err?.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dateFrom, dateTo, all]);

  return { dashboard, setDashboard, loading };
};

export const useTeacherDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await fetchTeacherDashboard();
        setDashboard(result);
      } catch (err) {
        toast.error(err?.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { dashboard, loading };
};

export const useStudentResults = (studentId) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getStudentResults(studentId);
        setResults(data);
      } catch (err) {
        toast.error(err?.message || 'Không thể tải kết quả học sinh');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  return { results, loading };
};

export const useStudentProgress = (studentId) => {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getStudentProgress(studentId);
        setProgress(data);
      } catch (err) {
        toast.error(err?.message || 'Không thể tải tiến độ học sinh');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  return { progress, loading };
};

export const useAIAdviceMutation = () => {
  const [loading, setLoading] = useState(false);

  const fetchAdvice = async (payload, callback) => {
    try {
      setLoading(true);
      const data = await toastPromise(
        getAIAdvice(payload),
        {
          loading: 'AI đang phân tích...',
          success: 'Phân tích hoàn tất',
          error: (err) => err?.message || 'Không thể lấy tư vấn AI',
        }
      );
      callback?.(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  return { fetchAdvice, loading };
};
