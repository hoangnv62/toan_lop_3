import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../../components/TeacherLayout';
import { fetchLessons, createLesson, updateLesson, deleteLesson } from '../../api/lessonService';
import { toast } from 'react-toastify';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiArrowRight, FiBook, FiLoader, FiX } from 'react-icons/fi';

function formatDate(str) {
  if (!str) return '--';
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function LessonModal({ title, initialValue = '', onClose, onSubmit, loading }) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current?.focus();
    if (initialValue) inputRef.current?.select();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <FiX size={17} />
          </button>
        </div>
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên bài học</label>
          <input
            ref={inputRef}
            className="input"
            placeholder="VD: Phép cộng trong phạm vi 100"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSubmit(value); if (e.key === 'Escape') onClose(); }}
          />
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose}>Hủy</button>
          <button className="btn-primary flex-1" onClick={() => onSubmit(value)} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

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
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FiTrash2 size={22} className="text-red-500" />
          </div>
          <h3 className="font-semibold text-gray-900">Xóa bài học</h3>
          <p className="text-sm text-gray-500 mt-2">
            Xóa <span className="font-semibold text-gray-800">"{lesson.title}"</span>?
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

export default function ManageLesson() {
  const [lessons, setLessons]         = useState([]);
  const [query, setQuery]             = useState('');
  const [loading, setLoading]         = useState(true);
  const [showAdd, setShowAdd]         = useState(false);
  const [addLoading, setAddLoading]   = useState(false);
  const [editLesson, setEditLesson]   = useState(null);
  const [editLoading, setEditLoading] = useState(false);
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
    } catch { setLessons([]); }
    finally { setLoading(false); }
  }

  async function handleCreate(title) {
    const t = title.trim();
    if (!t) return toast.error('Tiêu đề không được trống');
    setAddLoading(true);
    try {
      await createLesson(t);
      toast.success('Tạo bài học thành công');
      setShowAdd(false);
      load(query);
    } catch (err) {
      toast.error(err.message || 'Tạo thất bại');
    } finally { setAddLoading(false); }
  }

  async function handleEdit(title) {
    const t = title.trim();
    if (!t) return toast.error('Tiêu đề không được trống');
    setEditLoading(true);
    try {
      await updateLesson(editLesson.id, t);
      toast.success('Cập nhật thành công');
      setEditLesson(null);
      load(query);
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại');
    } finally { setEditLoading(false); }
  }

  return (
    <TeacherLayout>
      {showAdd && (
        <LessonModal
          title="Thêm bài học mới"
          onClose={() => setShowAdd(false)}
          onSubmit={handleCreate}
          loading={addLoading}
        />
      )}
      {editLesson && (
        <LessonModal
          title="Sửa tên bài học"
          initialValue={editLesson.title}
          onClose={() => setEditLesson(null)}
          onSubmit={handleEdit}
          loading={editLoading}
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Bài học & Bài tập</h1>
          <p className="text-sm text-gray-500 mt-0.5">{lessons.length} bài học</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 w-56"
              placeholder="Tìm kiếm bài học..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <button className="btn-primary whitespace-nowrap" onClick={() => setShowAdd(true)}>
            <FiPlus size={16} /> Thêm bài học
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <FiLoader size={24} className="animate-spin text-gray-400" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FiBook size={22} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">
            {query ? 'Không tìm thấy bài học nào' : 'Chưa có bài học nào'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {lessons.map(l => (
            <div key={l.id}
              className="card flex items-center justify-between gap-4 py-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                  <FiBook size={16} className="text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{l.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">{formatDate(l.created_at)}</span>
                    <span className="badge-indigo">{l.exam_count ?? 0} </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button title="Sửa" className="btn-ghost p-2"
                  onClick={() => setEditLesson(l)}>
                  <FiEdit2 size={15} />
                </button>
                <button title="Xóa" className="btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50 p-2"
                  onClick={() => setDeleteLesson(l)}>
                  <FiTrash2 size={15} />
                </button>
                <button className="btn-primary py-1.5 px-3 text-xs ml-1"
                  onClick={() => navigate(`/lesson-detail/${l.id}`)}>
                  Chi tiết <FiArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </TeacherLayout>
  );
}
