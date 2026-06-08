import { useEffect, useRef, useState } from 'react';
import TeacherLayout from '../../../layouts/TeacherLayout';
import { useDebounce } from '../../../hooks/useDebounce';
import { getQuestionBank, deleteBankQuestion, importQuestionBankFromExcel, downloadSampleQuestionBank } from '../../../api/questionBankService';
import { fetchLessons } from '../../../api/lessonService';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiLoader, FiDatabase, FiUpload, FiDownload, FiSearch, FiChevronDown } from 'react-icons/fi';
import QuestionFormModal from './QuestionFormModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Pagination from '../../../components/Pagination';

export default function QuestionBank() {
  const [questions, setQuestions]           = useState([]);
  const [total, setTotal]                   = useState(0);
  const [page, setPage]                     = useState(1);
  const [pages, setPages]                   = useState(1);
  const [loading, setLoading]               = useState(true);
  const [modal, setModal]                   = useState(null);
  const [confirmDelete, setConfirmDelete]   = useState(null);
  const [deleting, setDeleting]             = useState(null);
  const [importing, setImporting]           = useState(false);
  const [query, setQuery]                   = useState('');
  const [lessons, setLessons]               = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const fileInputRef = useRef();
  const isInitialMount = useRef(true);
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    fetchLessons('', 1, 100)
      .then(data => setLessons(data.items ?? data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => { load(debouncedQuery, page, selectedLesson); }, [page]); // eslint-disable-line

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    setPage(1);
    load(debouncedQuery, 1, selectedLesson);
  }, [debouncedQuery]); // eslint-disable-line

  function handleLessonChange(val) {
    setSelectedLesson(val);
    setPage(1);
    load(query, 1, val);
  }

  async function load(q, p, lessonId) {
    setLoading(true);
    try {
      const data = await getQuestionBank(p, 10, q, lessonId);
      setQuestions(data.items ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch (err) {
      toast.error(err.message || 'Không tải được ngân hàng câu hỏi');
    } finally { setLoading(false); }
  }

  async function confirmDeleteQuestion() {
    const id = confirmDelete.id;
    setConfirmDelete(null);
    setDeleting(id);
    try {
      await deleteBankQuestion(id);
      toast.success('Đã xóa câu hỏi');
      const newPage = questions.length === 1 && page > 1 ? page - 1 : page;
      setPage(newPage);
      if (newPage === page) load(debouncedQuery, page, selectedLesson);
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại');
    } finally { setDeleting(null); }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImporting(true);
    try {
      const lessonId = (selectedLesson !== null && selectedLesson !== 0) ? selectedLesson : null;
      const data = await importQuestionBankFromExcel(file, lessonId);
      const { imported, errors } = data;
      if (imported > 0) {
        toast.success(`Đã import ${imported} câu hỏi`);
        setPage(1);
        load(debouncedQuery, 1, selectedLesson);
      }
      if (errors?.length) errors.forEach(err => toast.error(err, { autoClose: 6000 }));
      if (imported === 0 && !errors?.length) toast.warning('File không có câu hỏi hợp lệ');
    } catch (err) {
      toast.error(err.message || 'Import thất bại');
    } finally { setImporting(false); }
  }

  function getLessonName(lessonId) {
    if (!lessonId) return null;
    return lessons.find(l => l.id === lessonId)?.title ?? null;
  }

  const importLessonLabel = selectedLesson && selectedLesson !== 0
    ? `Import vào: ${getLessonName(selectedLesson) ?? 'chủ đề đã chọn'}`
    : 'Import (chưa phân loại)';

  return (
    <TeacherLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ngân hàng câu hỏi</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} câu hỏi</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="relative">
            <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9 w-48"
              placeholder="Tìm câu hỏi..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          <div className="relative">
            <select
              className="input pr-8 appearance-none cursor-pointer w-44"
              value={selectedLesson ?? ''}
              onChange={e => {
                const v = e.target.value;
                handleLessonChange(v === '' ? null : Number(v));
              }}
            >
              <option value="">Tất cả chủ đề</option>
              <option value={0}>Chưa phân loại</option>
              {lessons.map(l => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
            <FiChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          <button
            className="btn-ghost whitespace-nowrap"
            onClick={() => downloadSampleQuestionBank().catch(err => toast.error(err.message))}>
            <FiDownload size={15} /> File mẫu
          </button>
          {selectedLesson !== null && (
            <button
              className="btn-secondary whitespace-nowrap"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              title={importLessonLabel}
            >
              {importing ? <FiLoader size={15} className="animate-spin" /> : <FiUpload size={15} />}
              {importing ? 'Đang import...' : 'Import Excel'}
            </button>
          )}
          <button className="btn-primary whitespace-nowrap" onClick={() => setModal({ initial: null })}>
            <FiPlus size={16} /> Thêm câu hỏi
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <FiLoader size={24} className="animate-spin text-indigo-400" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FiDatabase size={22} className="text-indigo-400" />
          </div>
          <p className="text-slate-500 font-semibold">
            {query || selectedLesson !== null ? 'Không tìm thấy câu hỏi nào' : 'Chưa có câu hỏi nào trong ngân hàng'}
          </p>
          {!query && selectedLesson === null && (
            <p className="text-sm text-slate-400 mt-1">Thêm câu hỏi để tái sử dụng trong bài tập</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map(q => {
            const lessonName = getLessonName(q.lessonId);
            return (
              <div key={q.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 leading-relaxed line-clamp-2">{q.content}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="badge-indigo text-xs">{q.answers?.length ?? 0} đáp án</span>
                      {lessonName
                        ? <span className="badge-green text-xs">{lessonName}</span>
                        : <span className="badge-gray text-xs">Chưa phân loại</span>}
                      <span className="text-xs text-slate-400">{q.createdAt || '--'}</span>
                      {q.explanation && (
                        <span className="text-xs text-slate-400 truncate max-w-[200px]" title={q.explanation}>
                          Giải thích: {q.explanation}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button title="Chỉnh sửa" className="btn-ghost p-2" onClick={() => setModal({ initial: q })}>
                      <FiEdit2 size={15} />
                    </button>
                    <button
                      title="Xóa"
                      className="btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50 p-2"
                      disabled={deleting === q.id}
                      onClick={() => setConfirmDelete(q)}>
                      {deleting === q.id ? <FiLoader size={15} className="animate-spin" /> : <FiTrash2 size={15} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} pages={pages} onChange={p => setPage(p)} />

      {modal && (
        <QuestionFormModal
          initial={modal.initial}
          lessons={lessons}
          defaultLessonId={modal.initial ? modal.initial.lessonId : (selectedLesson > 0 ? selectedLesson : null)}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); const p = modal?.initial ? page : 1; setPage(p); load(query, p, selectedLesson); }}
        />
      )}

      {confirmDelete && (
        <ConfirmDeleteModal
          question={confirmDelete}
          onConfirm={confirmDeleteQuestion}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </TeacherLayout>
  );
}
