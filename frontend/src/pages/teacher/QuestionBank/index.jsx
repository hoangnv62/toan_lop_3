import { useEffect, useState } from 'react';
import TeacherLayout from '../../../components/TeacherLayout';
import { getQuestionBank, deleteBankQuestion } from '../../../api/questionBankService';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiLoader, FiDatabase } from 'react-icons/fi';
import QuestionFormModal from './QuestionFormModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';

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
