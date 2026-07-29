import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TeacherLayout from '../../../layouts/TeacherLayout';
import { fetchLesson } from '../../../api/lessonService';
import { fetchExam, deleteExam, cloneExam } from '../../../api/examService';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiEdit2, FiLoader, FiSend, FiCopy, FiBarChart2, FiFileText } from 'react-icons/fi';
import ExamModal from './ExamModal';
import AssignExamModal from './AssignExamModal';
import ExamStatsModal from './ExamStatsModal';
import ExportPdfModal from './ExportPdfModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LessonDetail() {
  const { lessonId } = useParams();
  const [lesson, setLesson]           = useState(null);
  const [modal, setModal]             = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [statsModal, setStatsModal]   = useState(null);
  const [deleting, setDeleting]       = useState(null);
  const [cloning, setCloning]         = useState(null);
  const [pdfModal, setPdfModal]       = useState(null);

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
          questions: exam.questions.map(q => ({
            questionId: q.questionId, content: q.questionContent, explanation: q.explanation || '',
            answers: q.answers.map(a => ({
              answerId: a.answerId, content: String(a.content), correct: a.isCorrected === 1,
            })),
          })),
        },
      });
    } catch (err) {
      toast.error(err.message || 'Không tải được bài tập');
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
      toast.success('Đã sao chép bài tập');
      load();
    } catch (err) {
      toast.error(err.message || 'Sao chép thất bại');
    } finally { setCloning(null); }
  }

  return (
    <TeacherLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{lesson?.lessonTitle || '...'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{lesson?.exams?.length ?? 0} bài tập</p>
        </div>
        <Button variant="gradient" onClick={() => setModal({ examId: null, initialData: null })}>
          <FiPlus size={16} /> Tạo bài tập
        </Button>
      </div>

      {/* Exam list */}
      {lesson?.exams?.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FiEdit2 size={22} className="text-indigo-400" />
          </div>
          <p className="text-slate-500 font-semibold">Chưa có bài tập nào</p>
          <p className="text-sm text-slate-400 mt-1">Tạo bài tập đầu tiên cho bài học này</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lesson?.exams?.map(exam => (
            <Card key={exam.id} className="flex-row items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                  <FiEdit2 size={15} className="text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{exam.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{exam.dateCreated || '--'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon-sm" title="Giao cho lớp" className="text-indigo-600 hover:bg-indigo-50" onClick={() => setAssignModal({ exam })}>
                  <FiSend size={15} />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Thống kê" onClick={() => setStatsModal({ examId: exam.id, examName: exam.name })}>
                  <FiBarChart2 size={15} />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Xuất PDF" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => setPdfModal({ id: exam.id, name: exam.name })}>
                  <FiFileText size={15} />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Sao chép" className="text-slate-500 hover:bg-slate-100" disabled={cloning === exam.id} onClick={() => handleClone(exam.id)}>
                  {cloning === exam.id
                    ? <FiLoader size={15} className="animate-spin" />
                    : <FiCopy size={15} />}
                </Button>
                <Button variant="ghost" size="icon-sm" title="Chỉnh sửa" onClick={() => openEdit(exam.id)}>
                  <FiEdit2 size={15} />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Xóa" className="text-red-500 hover:text-red-600 hover:bg-red-50" disabled={deleting === exam.id} onClick={() => handleDelete(exam.id)}>
                  {deleting === exam.id
                    ? <FiLoader size={15} className="animate-spin" />
                    : <FiTrash2 size={15} />}
                </Button>
              </div>
            </Card>
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

      {pdfModal && (
        <ExportPdfModal
          exam={pdfModal}
          onClose={() => setPdfModal(null)}
        />
      )}
    </TeacherLayout>
  );
}
