import { useEffect, useState } from 'react';
import TeacherLayout from '../../components/TeacherLayout';
import {
  getQuestionBank, createBankQuestion, updateBankQuestion, deleteBankQuestion,
} from '../../api/questionBankService';
import { toast } from 'react-toastify';
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiLoader, FiDatabase,
  FiCheckCircle, FiAlertCircle,
} from 'react-icons/fi';

const ANSWER_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

function ConfirmDeleteModal({ question, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Xác nhận xóa</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <FiX size={17} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-1.5">Bạn có chắc muốn xóa câu hỏi sau không?</p>
        <p className="text-sm font-medium text-gray-900 bg-gray-50 rounded-lg px-3 py-2 line-clamp-2 mb-5">
          {question.content}
        </p>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onClose}>Hủy</button>
          <button className="btn-danger flex-1" onClick={onConfirm}>Xóa</button>
        </div>
      </div>
    </div>
  );
}

function emptyAnswers() {
  return ['', '', '', ''].map(() => ({ content: '', is_correct: false }));
}

function QuestionFormModal({ initial, onClose, onSaved }) {
  const isEdit = !!initial;
  const [content, setContent]         = useState(initial?.content || '');
  const [explanation, setExplanation] = useState(initial?.explanation || '');
  const [answers, setAnswers]         = useState(
    initial?.answers
      ? initial.answers.map(a => ({ content: a.content, is_correct: a.is_correct === 1 || a.is_correct === true }))
      : emptyAnswers()
  );
  const [saving, setSaving] = useState(false);

  function updateAnswer(ai, val) {
    setAnswers(prev => prev.map((a, i) => i === ai ? { ...a, content: val } : a));
  }
  function setCorrect(ai) {
    setAnswers(prev => prev.map((a, i) => ({ ...a, is_correct: i === ai })));
  }
  function addAnswer() {
    if (answers.length >= 6) return;
    setAnswers(prev => [...prev, { content: '', is_correct: false }]);
  }
  function removeAnswer(ai) {
    if (answers.length <= 2) return;
    setAnswers(prev => prev.filter((_, i) => i !== ai));
  }

  async function handleSave() {
    if (!content.trim()) return toast.error('Nội dung câu hỏi không được trống');
    if (!answers.some(a => a.is_correct)) return toast.error('Vui lòng chọn 1 đáp án đúng');
    const emptyIdx = answers.findIndex(a => !a.content.trim());
    if (emptyIdx !== -1) return toast.error('Đáp án ' + (ANSWER_LABELS[emptyIdx] ?? emptyIdx + 1) + ' chưa có nội dung');
    setSaving(true);
    try {
      const payload = {
        content: content.trim(),
        explanation: explanation.trim(),
        answers: answers.map(a => ({ content: a.content.trim(), is_correct: a.is_correct ? 1 : 0 })),
      };
      if (isEdit) {
        await updateBankQuestion(initial.id, payload);
        toast.success('Đã cập nhật câu hỏi');
      } else {
        await createBankQuestion(payload);
        toast.success('Đã thêm câu hỏi vào ngân hàng');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Lưu thất bại');
    } finally { setSaving(false); }
  }

  const hasCorrect = answers.some(a => a.is_correct);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-semibold text-gray-900">
            {isEdit ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
          </h3>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <FiX size={17} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nội dung câu hỏi <span className="text-red-500">*</span>
            </label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Nhập nội dung câu hỏi..."
              value={content}
              onChange={e => setContent(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Giai thich dap an</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Giải thích tại sao đáp án đúng là..."
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">
                Dap an <span className="text-red-500">*</span>
              </p>
              {hasCorrect
                ? <span className="text-xs text-emerald-600 flex items-center gap-1"><FiCheckCircle size={12} /> Đã chọn đáp án đúng</span>
                : <span className="text-xs text-amber-600 flex items-center gap-1"><FiAlertCircle size={12} /> Chưa chọn đáp án đúng</span>}
            </div>
            <div className="space-y-2">
              {answers.map((a, ai) => (
                <label key={ai}
                  className={'flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-all ' +
                    (a.is_correct
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50')}>
                  <input type="radio" name="correct-answer"
                    checked={a.is_correct} onChange={() => setCorrect(ai)}
                    className="accent-emerald-500 shrink-0" />
                  <span className={'text-xs font-bold w-5 shrink-0 ' + (a.is_correct ? 'text-emerald-600' : 'text-gray-400')}>
                    {ANSWER_LABELS[ai] ?? ai + 1}
                  </span>
                  <input
                    className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                    placeholder={'Dap an ' + (ANSWER_LABELS[ai] ?? ai + 1) + '...'}
                    value={a.content}
                    onChange={e => updateAnswer(ai, e.target.value)}
                  />
                  {answers.length > 2 && (
                    <button
                      className="shrink-0 text-gray-300 hover:text-red-400 transition-colors"
                      onClick={e => { e.preventDefault(); removeAnswer(ai); }}>
                      <FiX size={13} />
                    </button>
                  )}
                </label>
              ))}
            </div>
            {answers.length < 6 && (
              <button
                className="mt-2 text-indigo-600 hover:text-indigo-700 text-xs font-medium flex items-center gap-1"
                onClick={addAnswer}>
                <FiPlus size={12} /> Thêm đáp án
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl shrink-0">
          <button className="btn-secondary" onClick={onClose}>Huy</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <><FiLoader size={14} className="animate-spin" /> Đang lưu...</>
              : <><FiSave size={14} /> {isEdit ? 'Cập nhật' : 'Thêm câu hỏi'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting]   = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getQuestionBank();
      setQuestions(Array.isArray(data) ? data : []);
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
      load();
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại');
    } finally { setDeleting(null); }
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
          <p className="text-sm text-gray-500 mt-0.5">{questions.length} câu hỏi</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({ initial: null })}>
          <FiPlus size={16} /> Thêm câu hỏi
        </button>
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
          <p className="text-gray-500 font-medium">Chưa có câu hỏi nào trong ngân hàng</p>
          <p className="text-sm text-gray-400 mt-1">Thêm câu hỏi để tái sử dụng trong bài thi</p>
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

      {modal && (
        <QuestionFormModal
          initial={modal.initial}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
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
