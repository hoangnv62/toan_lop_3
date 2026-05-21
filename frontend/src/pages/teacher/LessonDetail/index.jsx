import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TeacherLayout from '../../../components/TeacherLayout';
import { fetchLesson } from '../../../api/lessonService';
import { fetchExam, deleteExam, cloneExam } from '../../../api/examService';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiEdit2, FiEye, FiLoader, FiSend, FiCopy, FiBarChart2 } from 'react-icons/fi';
import ExamModal from './ExamModal';
import AssignExamModal from './AssignExamModal';
import ExamStatsModal from './ExamStatsModal';

function formatDate(str) {
  if (!str) return '--';
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

export default function LessonDetail() {
  const { lessonId } = useParams();
  const [lesson, setLesson]           = useState(null);
  const [modal, setModal]             = useState(null);
  const [assignModal, setAssignModal] = useState(null); // { exam: { id, name } }
  const [statsModal, setStatsModal]   = useState(null); // { examId, examName }
  const [deleting, setDeleting]       = useState(null);
  const [cloning, setCloning]         = useState(null);

  useEffect(() => { load(); }, [lessonId]);

  async function load() {
    try {
      const data = await fetchLesson(lessonId);
      setLesson(data);
    } catch { toast.error('Không tải được bài học'); }
  }

  async function openEdit(id) {
    try {
      const exam = await fetchExam(id);
      setModal({
        examId: id,
        initialData: {
          name: exam.name, description: exam.description || '',
          timeLimit: exam.timeLimit ? Math.round(exam.timeLimit / 60) : '',
          questions: exam.questions.map(q => ({
            questionId: q.questionId, content: q.questionContent, explanation: q.explanation || '',
            answers: q.answers.map(a => ({
              answerId: a.answerId, content: String(a.content), correct: a.isCorrected === 1,
            })),
          })),
        },
      });
    } catch (err) {
      toast.error(err.message || 'Không tải được bài thi');
    }
  }

  async function handleDelete(id) {
    setDeleting(id);
    try {
      await deleteExam(id);
      toast.success('Đã xóa');
      load();
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại');
    } finally { setDeleting(null); }
  }

  async function handleClone(id) {
    setCloning(id);
    try {
      await cloneExam(id);
      toast.success('Đã sao chép bài thi');
      load();
    } catch (err) {
      toast.error(err.message || 'Sao chép thất bại');
    } finally { setCloning(null); }
  }

  return (
    <TeacherLayout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{lesson?.lessonTitle || '...'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{lesson?.exams?.length ?? 0} bài tập</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({ examId: null, initialData: null })}>
          <FiPlus size={16} /> Tạo bài thi
        </button>
      </div>

      {/* Exam list */}
      {lesson?.exams?.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FiEdit2 size={22} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">Chưa có bài tập nào</p>
          <p className="text-sm text-gray-400 mt-1">Tạo bài tập đầu tiên cho bài học này</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lesson?.exams?.map(exam => (
            <div key={exam.id}
              className="card flex items-center justify-between gap-4 py-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                  <FiEdit2 size={15} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{exam.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(exam.date_created)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button title="Giao cho lớp"
                  className="btn-ghost text-indigo-600 hover:bg-indigo-50 p-2"
                  onClick={() => setAssignModal({ exam })}>
                  <FiSend size={15} />
                </button>
                <button title="Thong ke"
                  className="btn-ghost p-2"
                  onClick={() => setStatsModal({ examId: exam.id, examName: exam.name })}>
                  <FiBarChart2 size={15} />
                </button>
                <button title="Sao chép"
                  className="btn-ghost text-gray-500 hover:bg-gray-100 p-2"
                  disabled={cloning === exam.id}
                  onClick={() => handleClone(exam.id)}>
                  {cloning === exam.id
                    ? <FiLoader size={15} className="animate-spin" />
                    : <FiCopy size={15} />}
                </button>
                <button title="Chỉnh sửa"
                  className="btn-ghost p-2"
                  onClick={() => openEdit(exam.id)}>
                  <FiEdit2 size={15} />
                </button>
                <button title="Xóa"
                  className="btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50 p-2"
                  disabled={deleting === exam.id}
                  onClick={() => handleDelete(exam.id)}>
                  {deleting === exam.id
                    ? <FiLoader size={15} className="animate-spin" />
                    : <FiTrash2 size={15} />}
                </button>
                <button
                  className="btn-primary py-1.5 px-3 text-xs ml-1"
                  onClick={() => openEdit(exam.id)}>
                  <FiEye size={13} /> Chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ExamModal
          lesson={lesson}
          examId={modal.examId}
          initialData={modal.initialData}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      {assignModal && (
        <AssignExamModal
          exam={assignModal.exam}
          onClose={() => setAssignModal(null)}
        />
      )}

      {statsModal && (
        <ExamStatsModal
          examId={statsModal.examId}
          examName={statsModal.examName}
          onClose={() => setStatsModal(null)}
        />
      )}
    </TeacherLayout>
  );
}
