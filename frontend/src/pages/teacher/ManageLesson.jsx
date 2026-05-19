import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../../components/TeacherLayout';
import { fetchLessons, createLesson, updateLesson, deleteLesson } from '../../api/lessonService';
import { toast } from 'react-toastify';
import {
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiEye, FiBookOpen,
} from 'react-icons/fi';

function formatDate(str) {
  if (!str) return '--';
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// ── Modal thêm bài học ───────────────────────────────────────────────────────
function AddModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit() {
    const t = title.trim();
    if (!t) return toast.error('Tiêu đề không được trống');
    setLoading(true);
    try {
      await createLesson(t);
      toast.success('Tạo bài học thành công');
      onCreated();
    } catch (err) {
      toast.error(err.message || 'Tạo thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-800">➕ Thêm bài học mới</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên bài học</label>
          <input
            ref={inputRef}
            className="input w-full"
            placeholder="VD: Phép cộng trong phạm vi 100"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onClose(); }}
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button className="btn-secondary flex-1" onClick={onClose}>Hủy</button>
          <button className="btn-primary flex-1" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo bài học'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal sửa tên bài học ────────────────────────────────────────────────────
function EditModal({ lesson, onClose, onUpdated }) {
  const [title, setTitle] = useState(lesson.title);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  async function handleSubmit() {
    const t = title.trim();
    if (!t) return toast.error('Tiêu đề không được trống');
    setLoading(true);
    try {
      await updateLesson(lesson.id, t);
      toast.success('Cập nhật thành công');
      onUpdated();
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-800">✏️ Sửa tên bài học</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên bài học</label>
          <input
            ref={inputRef}
            className="input w-full"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onClose(); }}
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button className="btn-secondary flex-1" onClick={onClose}>Hủy</button>
          <button className="btn-primary flex-1" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal xác nhận xóa ───────────────────────────────────────────────────────
function DeleteModal({ lesson, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteLesson(lesson.id);
      toast.success('Đã xóa bài học');
      onDeleted();
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-3">🗑️</div>
          <h3 className="text-lg font-bold text-gray-800">Xác nhận xóa</h3>
          <p className="text-gray-500 text-sm mt-2">
            Xóa bài học <span className="font-semibold text-gray-800">"{lesson.title}"</span>?
          </p>
          <p className="text-xs text-red-400 mt-1">Tất cả bài thi trong bài học này cũng sẽ bị xóa.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose}>Hủy</button>
          <button className="btn-danger flex-1" onClick={handleDelete} disabled={loading}>
            {loading ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Trang chính ──────────────────────────────────────────────────────────────
export default function ManageLesson() {
  const [lessons, setLessons]     = useState([]);
  const [query, setQuery]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [editLesson, setEditLesson]     = useState(null);
  const [deleteLesson_, setDeleteLesson] = useState(null);
  const debounceRef = useRef();
  const navigate = useNavigate();

  useEffect(() => { load(''); }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(query), 1000);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function load(q) {
    setLoading(true);
    try {
      const data = await fetchLessons(q);
      setLessons(data);
    } catch {
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TeacherLayout>
      {showAdd && (
        <AddModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); load(query); }}
        />
      )}
      {editLesson && (
        <EditModal
          lesson={editLesson}
          onClose={() => setEditLesson(null)}
          onUpdated={() => { setEditLesson(null); load(query); }}
        />
      )}
      {deleteLesson_ && (
        <DeleteModal
          lesson={deleteLesson_}
          onClose={() => setDeleteLesson(null)}
          onDeleted={() => { setDeleteLesson(null); load(query); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FiBookOpen className="text-indigo-500" /> Quản lý bài học
        </h1>
        <div className="relative flex-1 max-w-xs ml-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input w-full pl-9"
            placeholder="Tìm kiếm bài học..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <button className="btn-primary flex items-center gap-2 whitespace-nowrap" onClick={() => setShowAdd(true)}>
          <FiPlus /> Thêm bài học
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <p className="text-center text-gray-400 mt-10">Đang tải...</p>
      ) : lessons.length === 0 ? (
        <p className="text-center text-gray-400 mt-10">
          {query ? 'Không tìm thấy bài học nào.' : 'Chưa có bài học nào.'}
        </p>
      ) : (
        <div className="space-y-3">
          {lessons.map(l => (
            <div key={l.id} className="card flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{l.title}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                  <span>{formatDate(l.created_at)}</span>
                  <span className="flex items-center gap-1">
                    <FiBookOpen size={11} />
                    {l.exam_count ?? 0} bài thi
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  title="Cập nhật"
                  className="p-2 rounded-lg text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  onClick={() => setEditLesson(l)}
                >
                  <FiEdit2 size={16} />
                </button>
                <button
                  title="Xóa"
                  className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                  onClick={() => setDeleteLesson(l)}
                >
                  <FiTrash2 size={16} />
                </button>
                <button
                  title="Xem chi tiết"
                  className="btn-primary flex items-center gap-1.5 text-sm py-1.5 px-3"
                  onClick={() => navigate(`/lesson-detail/${l.id}`)}
                >
                  <FiEye size={14} /> Chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </TeacherLayout>
  );
}
