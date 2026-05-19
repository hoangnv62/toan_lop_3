import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TeacherLayout from '../../components/TeacherLayout';
import Modal from '../../components/Modal';
import { fetchLesson } from '../../api/lessonService';
import { fetchExam, saveExam, deleteExam } from '../../api/examService';
import { generateQuestions } from '../../api/questionService';
import { toast } from 'react-toastify';

function formatDate(str) {
  if (!str) return '--';
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

const emptyQuestion = () => ({ questionId: null, content: '', explanation: '', answers: [] });
const emptyAnswer = () => ({ answerId: null, content: '', correct: false });

export default function LessonDetail() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [examId, setExamId] = useState(null);
  const [examName, setExamName] = useState('');
  const [examDesc, setExamDesc] = useState('');
  const [qCount, setQCount] = useState('5');
  const [questions, setQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { load(); }, [lessonId]);

  async function load() {
    try {
      const data = await fetchLesson(lessonId);
      setLesson(data);
    } catch { toast.error('Không tải được bài học'); }
  }

  function openCreate() {
    setExamId(null); setExamName(''); setExamDesc(''); setQuestions([]);
    setModalOpen(true);
  }

  async function openDetail(id) {
    try {
      const exam = await fetchExam(id);
      setExamId(id);
      setExamName(exam.name);
      setExamDesc(exam.description || '');
      setQuestions(exam.questions.map(q => ({
        questionId: q.questionId,
        content: q.questionContent,
        explanation: q.explanation || '',
        answers: q.answers.map(a => ({ answerId: a.answerId, content: String(a.content), correct: a.isCorrected === 1 })),
      })));
      setModalOpen(true);
    } catch (err) {
      toast.error(err.message || 'Không tải được bài thi');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Xóa đề thi?')) return;
    try {
      await deleteExam(id);
      toast.success('Đã xóa');
      load();
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại');
    }
  }

  async function handleSave() {
    if (!examName.trim()) return toast.error('Tên bài thi không được trống');
    const payload = {
      name: examName, description: examDesc,
      questions: questions.map(q => ({
        questionId: q.questionId,
        questionContent: q.content,
        explanation: q.explanation,
        answers: q.answers.map(a => ({ answerId: a.answerId, content: a.content, isCorrected: a.correct ? 1 : 0 })),
      })),
    };
    try {
      await saveExam(lessonId, examId, payload);
      toast.success('Lưu thành công');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Lưu thất bại');
    }
  }

  async function handleGenerate() {
    if (!examDesc.trim()) return toast.error('Vui lòng nhập mô tả');
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
    } catch { toast.error('AI không phản hồi, thử lại'); }
    setGenerating(false);
  }

  const addQ = () => setQuestions(p => [...p, emptyQuestion()]);
  const removeQ = (i) => setQuestions(p => p.filter((_, idx) => idx !== i));
  const updateQ = (i, key, val) => setQuestions(p => p.map((q, idx) => idx === i ? { ...q, [key]: val } : q));
  const addA = (qi) => setQuestions(p => p.map((q, idx) => idx === qi ? { ...q, answers: [...q.answers, emptyAnswer()] } : q));
  const removeA = (qi, ai) => setQuestions(p => p.map((q, idx) => idx === qi ? { ...q, answers: q.answers.filter((_, i) => i !== ai) } : q));
  const updateA = (qi, ai, key, val) => setQuestions(p => p.map((q, idx) => idx === qi
    ? { ...q, answers: q.answers.map((a, i) => i === ai ? { ...a, [key]: val } : key === 'correct' ? { ...a, correct: false } : a) }
    : q));
  const setCorrect = (qi, ai) => setQuestions(p => p.map((q, idx) => idx === qi
    ? { ...q, answers: q.answers.map((a, i) => ({ ...a, correct: i === ai })) } : q));

  return (
    <TeacherLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📘 {lesson?.lessonTitle || '...'}</h1>
        <button className="btn-primary" onClick={openCreate}>➕ Tạo bài thi</button>
      </div>

      {lesson?.exams?.length === 0 ? (
        <p className="text-gray-400 text-center mt-10">Chưa có đề thi nào.</p>
      ) : (
        <div className="space-y-3">
          {lesson?.exams?.map(exam => (
            <div key={exam.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{exam.name}</p>
                <p className="text-xs text-gray-400">{formatDate(exam.date_created)}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-danger text-sm py-1.5 px-3" onClick={() => handleDelete(exam.id)}>Xóa</button>
                <button className="btn-primary text-sm py-1.5 px-3" onClick={() => openDetail(exam.id)}>Chi tiết</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title="📝 Thông tin bài thi" onClose={() => setModalOpen(false)}>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Bài học</label>
              <p className="text-gray-800 font-semibold">{lesson?.lessonTitle}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Tên bài thi *</label>
              <input className="input mt-1" value={examName} onChange={e => setExamName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Mô tả</label>
              <input className="input mt-1" value={examDesc} onChange={e => setExamDesc(e.target.value)} />
            </div>
            <div className="flex gap-3 items-center">
              <select className="input w-28" value={qCount} onChange={e => setQCount(e.target.value)}>
                <option value="5">5 câu</option>
                <option value="10">10 câu</option>
                <option value="15">15 câu</option>
              </select>
              <button className="btn-secondary text-sm" onClick={handleGenerate} disabled={generating}>
                {generating ? '⏳ Đang tạo...' : '🤖 Tạo AI'}
              </button>
              <button className="btn-secondary text-sm" onClick={addQ}>+ Thêm câu</button>
              <button className="btn-primary text-sm ml-auto" onClick={handleSave}>💾 Lưu</button>
            </div>

            <div className="space-y-4 mt-2">
              {questions.map((q, qi) => (
                <div key={qi} className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-500">Câu {qi + 1}</span>
                    <button className="ml-auto text-red-400 hover:text-red-600 text-sm" onClick={() => removeQ(qi)}>🗑 Xóa</button>
                  </div>
                  <input className="input" placeholder="Nội dung câu hỏi..." value={q.content}
                    onChange={e => updateQ(qi, 'content', e.target.value)} />
                  <textarea className="input resize-none" rows={2} placeholder="Giải thích..."
                    value={q.explanation} onChange={e => updateQ(qi, 'explanation', e.target.value)} />
                  <div className="space-y-2 pl-2">
                    {q.answers.map((a, ai) => (
                      <div key={ai} className="flex items-center gap-2">
                        <input type="radio" name={`correct-${qi}`} checked={a.correct}
                          onChange={() => setCorrect(qi, ai)} className="accent-indigo-500" />
                        <input className="input flex-1 text-sm" placeholder="Đáp án..." value={a.content}
                          onChange={e => updateA(qi, ai, 'content', e.target.value)} />
                        <button className="text-gray-400 hover:text-red-500" onClick={() => removeA(qi, ai)}>✕</button>
                      </div>
                    ))}
                    <button className="text-indigo-500 text-sm hover:underline" onClick={() => addA(qi)}>➕ Thêm đáp án</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </TeacherLayout>
  );
}
