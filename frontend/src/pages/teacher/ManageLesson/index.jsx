import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../../../components/TeacherLayout';
import { fetchLessons, createLesson, updateLesson } from '../../../api/lessonService';
import { toast } from 'react-toastify';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiArrowRight, FiBook, FiLoader } from 'react-icons/fi';
import LessonFormModal from './LessonFormModal';
import DeleteLessonModal from './DeleteLessonModal';
import Pagination from '../../../components/Pagination';

function formatDate(str) {
  if (!str) return '--';
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

export default function ManageLesson() {
  const [lessons, setLessons]         = useState([]);
  const [total, setTotal]             = useState(0);
  const [pages, setPages]             = useState(1);
  const [page, setPage]               = useState(1);
  const [query, setQuery]             = useState('');
  const [loading, setLoading]         = useState(true);
  const [showAdd, setShowAdd]         = useState(false);
  const [addLoading, setAddLoading]   = useState(false);
  const [editLesson, setEditLesson]   = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLesson_, setDeleteLesson] = useState(null);
  const debounceRef = useRef();
  const navigate = useNavigate();

  useEffect(() => { load(query, page); }, [page]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      load(query, 1);
    }, 1000);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function load(q, p) {
    setLoading(true);
    try {
      const data = await fetchLessons(q, p);
      setLessons(data.items);
      setTotal(data.total);
      setPages(data.pages);
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
      setPage(1);
      load(query, 1);
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
      load(query, page);
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại');
    } finally { setEditLoading(false); }
  }

  return (
    <TeacherLayout>
      {showAdd && (
        <LessonFormModal
          title="Thêm bài học mới"
          onClose={() => setShowAdd(false)}
          onSubmit={handleCreate}
          loading={addLoading}
        />
      )}
      {editLesson && (
        <LessonFormModal
          title="Sửa tên bài học"
          initialValue={editLesson.title}
          onClose={() => setEditLesson(null)}
          onSubmit={handleEdit}
          loading={editLoading}
        />
      )}
      {deleteLesson_ && (
        <DeleteLessonModal
          lesson={deleteLesson_}
          onClose={() => setDeleteLesson(null)}
          onDeleted={() => { setDeleteLesson(null); load(query); }}
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Bài học & Bài tập</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} bài học</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
          <FiLoader size={24} className="animate-spin text-indigo-400" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FiBook size={22} className="text-indigo-400" />
          </div>
          <p className="text-slate-500 font-semibold">
            {query ? 'Không tìm thấy bài học nào' : 'Chưa có bài học nào'}
          </p>
        </div>
      ) : (
        <>
        <div className="space-y-2">
          {lessons.map(l => (
            <div key={l.id}
              className="card flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                  <FiBook size={16} className="text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{l.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-400">{formatDate(l.created_at)}</span>
                    <span className="badge-indigo">{l.exam_count ?? 0} bài tập</span>
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
        <Pagination page={page} pages={pages} onChange={p => { setPage(p); }} />
        </>
      )}
    </TeacherLayout>
  );
}
