import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TeacherLayout from '../../components/TeacherLayout';
import { fetchLesson } from '../../api/lessonService';
import { fetchExam, saveExam, deleteExam } from '../../api/examService';
import { generateQuestions } from '../../api/questionService';
import { toast } from 'react-toastify';
import {
  FiPlus, FiTrash2, FiEdit2, FiEye, FiZap, FiSave, FiX, FiCheckCircle,
} from 'react-icons/fi';

const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

function formatDate(str) {
  if (!str) return '--';
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

const emptyQuestion = () => ({
  questionId: null, content: '', explanation: '',
  answers: ['', '', '', ''].map(() => ({ answerId: null, content: '', correct: false })),
});

// ── Popup bài tập ─────────────────────────────────────────────────────────────
function ExamModal({ lesson, examId, initialData, onClose, onSaved }) {
  const [examName, setExamName] = useState(initialData?.name || '');
  const [examDesc, setExamDesc] = useState(initialData?.description || '');
  const [questions, setQuestions] = useState(initialData?.questions || []);
  const [qCount, setQCount] = useState('5');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── helpers ──────────────────────────────────────────────────────────────
  const addQ = () => setQuestions(p => [...p, emptyQuestion()]);
  const removeQ = (qi) => setQuestions(p => p.filter((_, i) => i !== qi));
  const updateQ = (qi, key, val) =>
    setQuestions(p => p.map((q, i) => i === qi ? { ...q, [key]: val } : q));
  const updateA = (qi, ai, val) =>
    setQuestions(p => p.map((q, i) =>
      i === qi ? { ...q, answers: q.answers.map((a, j) => j === ai ? { ...a, content: val } : a) } : q
    ));
  const setCorrect = (qi, ai) =>
    setQuestions(p => p.map((q, i) =>
      i === qi ? { ...q, answers: q.answers.map((a, j) => ({ ...a, correct: j === ai })) } : q
    ));
  const addAnswer = (qi) =>
    setQuestions(p => p.map((q, i) =>
      i === qi && q.answers.length < 6
        ? { ...q, answers: [...q.answers, { answerId: null, content: '', correct: false }] }
        : q
    ));
  const removeAnswer = (qi, ai) =>
    setQuestions(p => p.map((q, i) =>
      i === qi ? { ...q, answers: q.answers.filter((_, j) => j !== ai) } : q
    ));

  // ── AI generate ──────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!examDesc.trim()) return toast.error('Vui lòng nhập mô tả trước');
    setGenerating(true);
    try {
      const generated = await generateQuestions({
        lessonTitle: lesson?.lessonTitle,
        examDescription: examDesc,
        numQuestions: qCount,
      });
      setQuestions(generated.map(q => ({
        questionId: null, content: q.questionContent, explanation: q.explanation || '',
        answers: q.answers.map(a => ({ answerId: null, content: a.content, correct: a.isCorrected === 1 })),
      })));
      toast.success('Tạo câu hỏi AI thành công');
    } catch {
      toast.error('AI không phản hồi, thử lại');
    } finally {
      setGenerating(false);
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!examName.trim()) return toast.error('Tên bài thi không được trống');
    if (questions.length === 0) return toast.error('Bài thi cần có ít nhất 1 câu hỏi');

    const invalid = questions.findIndex(q => !q.answers.some(a => a.correct));
    if (invalid !== -1) {
      toast.error(`Câu ${invalid + 1} chưa chọn đáp án đúng`);
      return;
    }
    const emptyQ = questions.findIndex(q => !q.content.trim());
    if (emptyQ !== -1) {
      toast.error(`Câu ${emptyQ + 1} chưa có nội dung`);
      return;
    }

    setSaving(true);
    try {
      await saveExam(lesson.lessonId, examId, {
        name: examName, description: examDesc,
        questions: questions.map(q => ({
          questionId: q.questionId,
          questionContent: q.content,
          explanation: q.explanation,
          answers: q.answers.map(a => ({
            answerId: a.answerId, content: a.content, isCorrected: a.correct ? 1 : 0,
          })),
        })),
      });
      toast.success('Lưu thành công');
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white rounded-t-2xl sticky top-0 z-10">
          <h3 className="font-bold text-lg text-gray-800">
            {examId ? '✏️ Chỉnh sửa bài tập' : '➕ Tạo bài tập mới'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <FiX size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Thông tin bài thi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Bài học</p>
              <p className="font-semibold text-gray-700">{lesson?.lessonTitle}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên bài thi <span className="text-red-500">*</span>
              </label>
              <input className="input w-full" placeholder="VD: Bài kiểm tra số 1"
                value={examName} onChange={e => setExamName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả / chủ đề AI</label>
              <input className="input w-full" placeholder="VD: Phép cộng có nhớ..."
                value={examDesc} onChange={e => setExamDesc(e.target.value)} />
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap border-t pt-4">
            <span className="text-sm text-gray-500 font-medium mr-1">Tạo bằng AI:</span>
            <select className="input w-24 text-sm" value={qCount} onChange={e => setQCount(e.target.value)}>
              <option value="5">5 câu</option>
              <option value="10">10 câu</option>
              <option value="15">15 câu</option>
            </select>
            <button className="btn-secondary flex items-center gap-1.5 text-sm"
              onClick={handleGenerate} disabled={generating}>
              <FiZap size={14} />
              {generating ? 'Đang tạo...' : 'Tạo bằng AI'}
            </button>
            <div className="flex-1" />
            <button className="btn-secondary flex items-center gap-1.5 text-sm" onClick={addQ}>
              <FiPlus size={14} /> Thêm câu hỏi
            </button>
          </div>

          {/* Danh sách câu hỏi */}
          {questions.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-sm">Chưa có câu hỏi nào. Tạo bằng AI hoặc thêm thủ công.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, qi) => {
                const hasCorrect = q.answers.some(a => a.correct);
                return (
                  <div key={qi}
                    className={`rounded-xl border-2 transition-colors ${hasCorrect ? 'border-gray-200' : 'border-amber-300 bg-amber-50/40'}`}>

                    {/* Question header */}
                    <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                      <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        Câu {qi + 1}
                      </span>
                      {!hasCorrect && (
                        <span className="text-xs text-amber-600 font-medium">⚠ Chưa chọn đáp án đúng</span>
                      )}
                      {hasCorrect && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <FiCheckCircle size={12} /> Đã chọn đáp án đúng
                        </span>
                      )}
                      <button className="ml-auto p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        onClick={() => removeQ(qi)}>
                        <FiTrash2 size={14} />
                      </button>
                    </div>

                    <div className="px-4 pb-4 space-y-3">
                      {/* Nội dung câu hỏi */}
                      <textarea
                        className="input w-full resize-none text-sm"
                        rows={2}
                        placeholder={`Nội dung câu ${qi + 1}...`}
                        value={q.content}
                        onChange={e => updateQ(qi, 'content', e.target.value)}
                      />

                      {/* Đáp án */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">
                          Chọn đáp án đúng <span className="text-red-500">*</span>
                        </p>
                        <div className="space-y-2">
                          {q.answers.map((a, ai) => (
                            <label key={ai}
                              className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-all ${
                                a.correct
                                  ? 'border-green-400 bg-green-50'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}>
                              <input
                                type="radio"
                                name={`correct-${qi}`}
                                checked={a.correct}
                                onChange={() => setCorrect(qi, ai)}
                                className="accent-green-500 shrink-0"
                              />
                              <span className={`text-xs font-bold w-5 shrink-0 ${a.correct ? 'text-green-600' : 'text-gray-400'}`}>
                                {ANSWER_LABELS[ai] ?? ai + 1}
                              </span>
                              <input
                                className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                                placeholder={`Đáp án ${ANSWER_LABELS[ai] ?? ai + 1}...`}
                                value={a.content}
                                onChange={e => updateA(qi, ai, e.target.value)}
                              />
                              {q.answers.length > 2 && (
                                <button className="shrink-0 text-gray-300 hover:text-red-400 transition-colors"
                                  onClick={e => { e.preventDefault(); removeAnswer(qi, ai); }}>
                                  <FiX size={13} />
                                </button>
                              )}
                            </label>
                          ))}
                        </div>
                        {q.answers.length < 6 && (
                          <button className="mt-2 text-indigo-500 hover:text-indigo-700 text-xs font-medium flex items-center gap-1"
                            onClick={() => addAnswer(qi)}>
                            <FiPlus size={12} /> Thêm đáp án
                          </button>
                        )}
                      </div>

                      {/* Giải thích */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Giải thích đáp án</p>
                        <textarea
                          className="input w-full resize-none text-sm"
                          rows={2}
                          placeholder="Giải thích tại sao đáp án đúng là..."
                          value={q.explanation}
                          onChange={e => updateQ(qi, 'explanation', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <span className="text-sm text-gray-400">{questions.length} câu hỏi</span>
          <div className="flex gap-3">
            <button className="btn-secondary" onClick={onClose}>Hủy</button>
            <button className="btn-primary flex items-center gap-2" onClick={handleSave} disabled={saving}>
              <FiSave size={15} />
              {saving ? 'Đang lưu...' : 'Lưu bài tập'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Trang LessonDetail ────────────────────────────────────────────────────────
export default function LessonDetail() {
  const { lessonId } = useParams();
  const [lesson, setLesson]     = useState(null);
  const [modal, setModal]       = useState(null); // null | { examId, initialData }
  const [deleting, setDeleting] = useState(null); // examId

  useEffect(() => { load(); }, [lessonId]);

  async function load() {
    try {
      const data = await fetchLesson(lessonId);
      setLesson(data);
    } catch { toast.error('Không tải được bài học'); }
  }

  function openCreate() {
    setModal({ examId: null, initialData: null });
  }

  async function openEdit(id) {
    try {
      const exam = await fetchExam(id);
      setModal({
        examId: id,
        initialData: {
          name: exam.name,
          description: exam.description || '',
          questions: exam.questions.map(q => ({
            questionId: q.questionId,
            content: q.questionContent,
            explanation: q.explanation || '',
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
    } finally {
      setDeleting(null);
    }
  }

  return (
    <TeacherLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📘 {lesson?.lessonTitle || '...'}</h1>
        <button className="btn-primary flex items-center gap-2" onClick={openCreate}>
          <FiPlus size={16} /> Tạo bài thi
        </button>
      </div>

      {lesson?.exams?.length === 0 ? (
        <p className="text-gray-400 text-center mt-10">Chưa có đề thi nào.</p>
      ) : (
        <div className="space-y-3">
          {lesson?.exams?.map(exam => (
            <div key={exam.id} className="card flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-800">{exam.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(exam.date_created)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  title="Chỉnh sửa"
                  className="p-2 rounded-lg text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  onClick={() => openEdit(exam.id)}>
                  <FiEdit2 size={16} />
                </button>
                <button
                  title="Xóa"
                  className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                  disabled={deleting === exam.id}
                  onClick={() => handleDelete(exam.id)}>
                  <FiTrash2 size={16} />
                </button>
                <button
                  title="Xem chi tiết"
                  className="btn-primary flex items-center gap-1.5 text-sm py-1.5 px-3"
                  onClick={() => openEdit(exam.id)}>
                  <FiEye size={14} /> Chi tiết
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
    </TeacherLayout>
  );
}
