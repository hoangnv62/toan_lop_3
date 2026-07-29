import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../../../layouts/TeacherLayout';
import { useDebounce } from '../../../hooks/useDebounce';
import { fetchLessons } from '../../../api/lessonService';
import { useLessonMutations } from '../../../hooks/useLesson';
import { toast } from 'react-toastify';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiArrowRight, FiBook } from 'react-icons/fi';
import LessonFormModal from './LessonFormModal';
import DeleteLessonModal from './DeleteLessonModal';
import Pagination from '../../../components/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function ManageLesson() {
  const [lessons, setLessons]         = useState([]);
  const [total, setTotal]             = useState(0);
  const [pages, setPages]             = useState(1);
  const [page, setPage]               = useState(1);
  const [query, setQuery]             = useState('');
  const [loading, setLoading]         = useState(true);
  const [showAdd, setShowAdd]         = useState(false);
  const [editLesson, setEditLesson]   = useState(null);
  const [deleteLesson_, setDeleteLesson] = useState(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 500);
  const isInitialMount = useRef(true);
  const { create, update, loading: mutationLoading } = useLessonMutations();

  useEffect(() => { load(debouncedQuery, page); }, [page]); // eslint-disable-line

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    setPage(1);
    load(debouncedQuery, 1);
  }, [debouncedQuery]);

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
    await create(t, () => {
      setShowAdd(false);
      setPage(1);
      load(query, 1);
    });
  }

  async function handleEdit(title) {
    const t = title.trim();
    if (!t) return toast.error('Tiêu đề không được trống');
    await update(editLesson.id, t, () => {
      setEditLesson(null);
      load(query, page);
    });
  }

  return (
    <TeacherLayout>
      {showAdd && (
        <LessonFormModal
          title="Thêm bài học mới"
          onClose={() => setShowAdd(false)}
          onSubmit={handleCreate}
          loading={mutationLoading}
        />
      )}
      {editLesson && (
        <LessonFormModal
          title="Sửa tên bài học"
          initialValue={editLesson.title}
          onClose={() => setEditLesson(null)}
          onSubmit={handleEdit}
          loading={mutationLoading}
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bài học & Bài tập</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} bài học</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9 w-56" placeholder="Tìm kiếm bài học..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <Button variant="gradient" className="whitespace-nowrap" onClick={() => setShowAdd(true)}>
            <FiPlus size={16} /> Thêm bài học
          </Button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex-row items-center justify-between gap-4 px-5 py-4 hover:translate-y-0">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Skeleton className="size-9 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-24 rounded-md" />
            </Card>
          ))}
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
            <Card key={l.id} className="flex-row items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                  <FiBook size={16} className="text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{l.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-400">{l.createdAt || '--'}</span>
                    <Badge variant="info">{l.examCount ?? 0} bài tập</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon-sm" title="Sửa" onClick={() => setEditLesson(l)}>
                  <FiEdit2 size={15} />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Xóa" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteLesson(l)}>
                  <FiTrash2 size={15} />
                </Button>
                <Button variant="gradient" className="py-1.5 px-3 text-xs ml-1" onClick={() => navigate(`/lesson-detail/${l.id}`)}>
                  Chi tiết <FiArrowRight size={13} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
        <Pagination page={page} pages={pages} onChange={p => { setPage(p); }} />
        </>
      )}
    </TeacherLayout>
  );
}
