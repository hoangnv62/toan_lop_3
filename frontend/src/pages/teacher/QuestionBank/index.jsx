import { useEffect, useRef, useState } from 'react';
import TeacherLayout from '../../../components/TeacherLayout';
import { getQuestionBank, deleteBankQuestion, importQuestionBankFromExcel, downloadSampleQuestionBank } from '../../../api/questionBankService';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiLoader, FiDatabase, FiUpload, FiDownload, FiSearch } from 'react-icons/fi';
import QuestionFormModal from './QuestionFormModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Pagination from '../../../components/Pagination';

export default function QuestionBank() {
  const [questions, setQuestions]         = useState([]);
  const [total, setTotal]                 = useState(0);
  const [page, setPage]                   = useState(1);
  const [pages, setPages]                 = useState(1);
  const [loading, setLoading]             = useState(true);
  const [modal, setModal]                 = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting]           = useState(null);
  const [importing, setImporting]         = useState(false);
  const [query, setQuery]                 = useState('');
  const fileInputRef   = useRef();
  const debounceRef    = useRef();
  const isMountedRef   = useRef(false); // skip debounce effect on initial mount

  // Runs on mount + page change (query changes handled by the debounce effect below)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(query, page); }, [page]);

  // Runs only when query changes (skip mount)
  useEffect(() => {
    if (!isMountedRef.current) { isMountedRef.current = true; return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      load(query, 1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function load(q, p) {
    setLoading(true);
    try {
      const data = await getQuestionBank(p, 10, q);
      setQuestions(data.items ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch (err) {
      toast.error(err.message || 'Không tải được ngân hàng câu hỏi');
    } finally { setLoading(false); }
  }

  async function handleDelete(question) {
    setConfirmDelete(question);
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
      if (newPage === page) load(query, page);
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
      const data = await importQuestionBankFromExcel(file);
      const { imported, errors } = data;
      if (imported > 0) {
        toast.success(`Đã import ${imported} câu hỏi`);
        setPage(1);
        load(query, 1);
      }
      if (errors?.length) {
        errors.forEach(err => toast.error(err, { autoClose: 6000 }));
      }
      if (imported === 0 && !errors?.length) {
        toast.warning('File không có câu hỏi hợp lệ');
      }
    } catch (err) {
      toast.error(err.message || 'Import thất bại');
    } finally { setImporting(false); }
  }

  function formatDate(str) {
    if (!str) return '--';
    const d = new Date(str);
    return String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear();
  }

  return (
    <TeacherLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ngân hàng câu hỏi</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} câu hỏi</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 w-52"
              placeholder="Tìm câu hỏi..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImport}
          />
          <button
            className="btn-ghost whitespace-nowrap"
            onClick={() => downloadSampleQuestionBank().catch(err => toast.error(err.message))}>
            <FiDownload size={15} /> File mẫu
          </button>
          <button
            className="btn-secondary whitespace-nowrap"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}>
            {importing
              ? <FiLoader size={15} className="animate-spin" />
              : <FiUpload size={15} />}
            {importing ? 'Đang import...' : 'Import Excel'}
          </button>
          <button className="btn-primary whitespace-nowrap" onClick={() => setModal({ initial: null })}>
            <FiPlus size={16} /> Thêm câu hỏi
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <FiLoader size={24} className="animate-spin text-gray-400" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FiDatabase size={22} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">
            {query ? 'Không tìm thấy câu hỏi nào' : 'Chưa có câu hỏi nào trong ngân hàng'}
          </p>
          {!query && <p className="text-sm text-gray-400 mt-1">Thêm câu hỏi để tái sử dụng trong bài thi</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map(q => (
            <div key={q.id} className="card hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-relaxed line-clamp-2">
                    {q.content}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="badge-indigo text-xs">{q.answers?.length ?? 0} đáp án</span>
                    <span className="text-xs text-gray-400">{formatDate(q.created_at)}</span>
                    {q.explanation && (
                      <span className="text-xs text-gray-400 truncate max-w-[200px]" title={q.explanation}>
                        Giải thích: {q.explanation}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    title="Chỉnh sửa"
                    className="btn-ghost p-2"
                    onClick={() => setModal({ initial: q })}>
                    <FiEdit2 size={15} />
                  </button>
                  <button
                    title="Xóa"
                    className="btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50 p-2"
                    disabled={deleting === q.id}
                    onClick={() => handleDelete(q)}>
                    {deleting === q.id
                      ? <FiLoader size={15} className="animate-spin" />
                      : <FiTrash2 size={15} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} pages={pages} onChange={p => setPage(p)} />

      {modal && (
        <QuestionFormModal
          initial={modal.initial}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); const p = modal?.initial ? page : 1; setPage(p); load(query, p); }}
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
