import { useEffect, useRef, useState } from 'react';
import TeacherLayout from '../../../layouts/TeacherLayout';
import { useDebounce } from '../../../hooks/useDebounce';
import { getQuestionBank, deleteBankQuestion, deleteBankQuestions, importQuestionBankFromExcel, downloadSampleQuestionBank } from '../../../api/questionBankService';
import { fetchLessons } from '../../../api/lessonService';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiLoader, FiDatabase, FiUpload, FiDownload, FiSearch, FiZap } from 'react-icons/fi';
import QuestionFormModal from './QuestionFormModal';
import AiGenerateModal from './AiGenerateModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Pagination from '../../../components/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

export default function QuestionBank() {
  const [questions, setQuestions]           = useState([]);
  const [total, setTotal]                   = useState(0);
  const [page, setPage]                     = useState(1);
  const [pages, setPages]                   = useState(1);
  const [limit, setLimit]                   = useState(10);
  const [loading, setLoading]               = useState(true);
  const [modal, setModal]                   = useState(null);
  const [aiModal, setAiModal]               = useState(false);
  const [confirmDelete, setConfirmDelete]   = useState(null);
  const [deleting, setDeleting]             = useState(null);
  const [selectedIds, setSelectedIds]       = useState([]);
  const [bulkDeleting, setBulkDeleting]     = useState(false);
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

  function handleLimitChange(val) {
    const next = Number(val);
    setLimit(next);
    setPage(1);
    // Truyền limit tường minh: setLimit chưa kịp có hiệu lực trong lần chạy này.
    load(query, 1, selectedLesson, next);
  }

  async function load(q, p, lessonId, pageSize = limit) {
    setLoading(true);
    // Đổi trang/tìm kiếm/lọc là danh sách khác hẳn — giữ lựa chọn cũ sẽ khiến
    // người dùng xóa nhầm những câu không còn nhìn thấy trên màn hình.
    setSelectedIds([]);
    try {
      const data = await getQuestionBank(p, pageSize, q, lessonId);
      setQuestions(data.items ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch (err) {
      toast.error(err.message || 'Không tải được ngân hàng câu hỏi');
    } finally { setLoading(false); }
  }

  function toggleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleSelectAll() {
    setSelectedIds(prev => prev.length === questions.length ? [] : questions.map(q => q.id));
  }

  // Xóa hết câu trên trang cuối thì trang đó biến mất — lùi về trang trước cho
  // khỏi hiện danh sách rỗng.
  function reloadAfterDelete(removedCount) {
    const newPage = removedCount >= questions.length && page > 1 ? page - 1 : page;
    setPage(newPage);
    if (newPage === page) load(debouncedQuery, page, selectedLesson);
  }

  async function confirmDeleteQuestion() {
    const ids = confirmDelete.map(q => q.id);
    const isBulk = ids.length > 1;
    if (isBulk) setBulkDeleting(true); else setDeleting(ids[0]);
    try {
      if (isBulk) {
        const { deleted } = await deleteBankQuestions(ids);
        toast.success(`Đã xóa ${deleted} câu hỏi`);
        // deleted < ids.length nghĩa là có câu vừa bị xóa ở nơi khác — nói thật
        // thay vì báo thành công trọn vẹn.
        if (deleted < ids.length) {
          toast.warning(`${ids.length - deleted} câu hỏi không còn tồn tại`);
        }
      } else {
        await deleteBankQuestion(ids[0]);
        toast.success('Đã xóa câu hỏi');
      }
      setConfirmDelete(null);
      reloadAfterDelete(ids.length);
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại');
    } finally { setDeleting(null); setBulkDeleting(false); }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImporting(true);
    try {
      const data = await importQuestionBankFromExcel(file, selectedLesson);
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

  const importLessonLabel = `Import vào: ${getLessonName(selectedLesson) ?? 'chủ đề đã chọn'}`;

  return (
    <TeacherLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Ngân hàng câu hỏi</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {total > 0
              ? `Hiển thị ${(page - 1) * limit + 1}–${Math.min(page * limit, total)} trong ${total} câu hỏi`
              : '0 câu hỏi'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="relative">
            <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9 w-48" placeholder="Tìm câu hỏi..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>

          {/* Radix Select không nhận value="" nên dùng sentinel 'all' cho "Tất cả chủ đề" */}
          <Select
            value={selectedLesson == null ? 'all' : String(selectedLesson)}
            onValueChange={v => handleLessonChange(v === 'all' ? null : Number(v))}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả chủ đề</SelectItem>
              {lessons.map(l => (
                <SelectItem key={l.id} value={String(l.id)}>{l.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          <Button variant="ghost" className="whitespace-nowrap" onClick={() => downloadSampleQuestionBank().catch(err => toast.error(err.message))}>
            <FiDownload size={15} /> File mẫu
          </Button>
          {selectedLesson !== null && (
            <Button variant="outline" className="whitespace-nowrap" onClick={() => fileInputRef.current?.click()} disabled={importing} title={importLessonLabel}>
              {importing ? <FiLoader size={15} className="animate-spin" /> : <FiUpload size={15} />}
              {importing ? 'Đang import...' : 'Import Excel'}
            </Button>
          )}
          <Button variant="outline" className="whitespace-nowrap" onClick={() => setAiModal(true)}>
            <FiZap size={15} /> Tạo bằng AI
          </Button>
          <Button variant="gradient" className="whitespace-nowrap" onClick={() => setModal({ initial: null })}>
            <FiPlus size={16} /> Thêm câu hỏi
          </Button>
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
          <div className="flex items-center justify-between gap-3 px-1">
            <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer select-none">
              <Checkbox
                checked={selectedIds.length === questions.length}
                onCheckedChange={toggleSelectAll}
                aria-label="Chọn tất cả câu hỏi trên trang"
              />
              {selectedIds.length > 0 ? `Đã chọn ${selectedIds.length} câu` : 'Chọn tất cả trang này'}
            </label>
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setConfirmDelete(questions.filter(q => selectedIds.includes(q.id)))}
                disabled={bulkDeleting}
              >
                {bulkDeleting ? <FiLoader size={15} className="animate-spin" /> : <FiTrash2 size={15} />}
                Xóa {selectedIds.length} câu
              </Button>
            )}
          </div>

          {questions.map(q => {
            const lessonName = getLessonName(q.lessonId);
            return (
              <Card key={q.id} className="p-5 gap-0">
                <div className="flex items-start justify-between gap-4">
                  <Checkbox
                    className="mt-1 shrink-0"
                    checked={selectedIds.includes(q.id)}
                    onCheckedChange={() => toggleSelect(q.id)}
                    aria-label={`Chọn câu hỏi: ${q.content.slice(0, 40)}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 leading-relaxed line-clamp-2">{q.content}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <Badge variant="info" className="text-xs">{q.answers?.length ?? 0} đáp án</Badge>
                      {lessonName && <Badge variant="success" className="text-xs">{lessonName}</Badge>}
                      <span className="text-xs text-slate-400">{q.createdAt || '--'}</span>
                      {q.explanation && (
                        <span className="text-xs text-slate-400 truncate max-w-[200px]" title={q.explanation}>
                          Giải thích: {q.explanation}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" title="Chỉnh sửa" className="p-2" onClick={() => setModal({ initial: q })}>
                      <FiEdit2 size={15} />
                    </Button>
                    <Button variant="ghost" title="Xóa" className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2" disabled={deleting === q.id} onClick={() => setConfirmDelete([q])}>
                      {deleting === q.id ? <FiLoader size={15} className="animate-spin" /> : <FiTrash2 size={15} />}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Chỉ hiện khi thật sự có gì để phân trang — dưới 10 câu thì đây là nhiễu. */}
      {total > 10 && (
        <div className="flex items-center justify-end gap-2 mt-5">
          <span className="text-sm text-slate-500">Mỗi trang</span>
          <Select value={String(limit)} onValueChange={handleLimitChange}>
            <SelectTrigger size="sm" className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[10, 20, 50].map(n => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Pagination tự có mt-5 nên không bọc thêm lề ở đây */}
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

      {aiModal && (
        <AiGenerateModal
          lessons={lessons}
          defaultLessonId={selectedLesson > 0 ? selectedLesson : null}
          onClose={() => setAiModal(false)}
          onSaved={() => { setAiModal(false); setPage(1); load(debouncedQuery, 1, selectedLesson); }}
        />
      )}

      {confirmDelete && (
        <ConfirmDeleteModal
          questions={confirmDelete}
          deleting={bulkDeleting || deleting !== null}
          onConfirm={confirmDeleteQuestion}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </TeacherLayout>
  );
}
