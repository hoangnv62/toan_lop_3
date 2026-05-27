import { useState, useRef } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiZap, FiSave, FiX, FiCheckCircle, FiLoader, FiUpload, FiDatabase } from 'react-icons/fi';
import { saveExam } from '../../../api/examService';
import { generateQuestions, importQuestionsFromExcel } from '../../../api/questionService';
import { toast } from 'react-toastify';
import QuestionBankPickerModal from './QuestionBankPickerModal';

const ANSWER_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const emptyQuestion = () => ({
  questionId: null, content: '', explanation: '',
  answers: ['','','',''].map(() => ({ answerId: null, content: '', correct: false })),
});

export default function ExamModal({ lesson, examId, initialData, onClose, onSaved }) {
  const [examName, setExamName]   = useState(initialData?.name || '');
  const [examDesc, setExamDesc]   = useState(initialData?.description || '');
  const [questions, setQuestions] = useState(initialData?.questions || []);
  const [qCount, setQCount]       = useState('5');
  const [generating, setGenerating]   = useState(false);
  const [saving, setSaving]           = useState(false);
  const [importing, setImporting]     = useState(false);
  const [bankModal, setBankModal]     = useState(false);
  const importRef = useRef(null);

  const addQ     = () => setQuestions(p => [...p, emptyQuestion()]);
  const removeQ  = (qi) => setQuestions(p => p.filter((_, i) => i !== qi));
  const updateQ  = (qi, key, val) =>
    setQuestions(p => p.map((q, i) => i === qi ? { ...q, [key]: val } : q));
  const updateA  = (qi, ai, val) =>
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

  async function handleImportExcel(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const res = await importQuestionsFromExcel(file);
      const imported = res.data.map(q => ({
        questionId: null, content: q.questionContent, explanation: q.explanation || '',
        answers: q.answers.map(a => ({ answerId: null, content: a.content, correct: a.isCorrected === 1 })),
      }));
      setQuestions(p => [...p, ...imported]);
      toast.success(`Đã import ${imported.length} câu hỏi`);
      if (res.errors?.length) toast.warning(`${res.errors.length} dòng bị lỗi`);
    } catch (err) {
      toast.error(err.message || 'Import thất bại');
    } finally {
      setImporting(false);
      if (importRef.current) importRef.current.value = '';
    }
  }

  async function handleGenerate() {
    if (!examDesc.trim()) return toast.error('Vui lòng nhập mô tả trước');
    setGenerating(true);
    try {
      const generated = await generateQuestions({
        lessonTitle: lesson?.lessonTitle, examDescription: examDesc, numQuestions: qCount,
      });
      setQuestions(generated.map(q => ({
        questionId: null, content: q.questionContent, explanation: q.explanation || '',
        answers: q.answers.map(a => ({ answerId: null, content: a.content, correct: a.isCorrected === 1 })),
      })));
      toast.success('Tạo câu hỏi AI thành công');
    } catch {
      toast.error('AI không phản hồi, thử lại');
    } finally { setGenerating(false); }
  }

  async function handleSave() {
    if (!examName.trim()) return toast.error('Tên  bài tập không được trống');
    if (questions.length === 0) return toast.error(' Bài tập cần có ít nhất 1 câu hỏi');
    const invalid = questions.findIndex(q => !q.answers.some(a => a.correct));
    if (invalid !== -1) return toast.error(`Câu ${invalid + 1} chưa chọn đáp án đúng`);
    const emptyQ = questions.findIndex(q => !q.content.trim());
    if (emptyQ !== -1) return toast.error(`Câu ${emptyQ + 1} chưa có nội dung`);
    setSaving(true);
    try {
      await saveExam(lesson.lessonId, examId, {
        name: examName, description: examDesc,
        questions: questions.map(q => ({
          questionId: q.questionId, questionContent: q.content, explanation: q.explanation,
          answers: q.answers.map(a => ({ answerId: a.answerId, content: a.content, isCorrected: a.correct ? 1 : 0 })),
        })),
      });
      toast.success('Lưu thành công');
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Lưu thất bại');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900">
              {examId ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{lesson?.lessonTitle}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tên  bài tập <span className="text-red-500">*</span>
              </label>
              <input className="input" placeholder="VD: Bài kiểm tra số 1"
                value={examName} onChange={e => setExamName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mô tả / chủ đề AI
              </label>
              <input className="input" placeholder="VD: Phép cộng có nhớ..."
                value={examDesc} onChange={e => setExamDesc(e.target.value)} />
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
            <span className="text-sm text-gray-600 font-medium">Tạo bằng AI:</span>
            <select className="input w-24 text-sm py-1.5"
              value={qCount} onChange={e => setQCount(e.target.value)}>
              <option value="5">5 câu</option>
              <option value="10">10 câu</option>
              <option value="15">15 câu</option>
            </select>
            <button className="btn-secondary text-sm py-1.5 gap-1.5"
              onClick={handleGenerate} disabled={generating}>
              {generating
                ? <><FiLoader size={13} className="animate-spin" /> Đang tạo...</>
                : <><FiZap size={13} /> Tạo bằng AI</>}
            </button>
            <label className={`btn-secondary text-sm py-1.5 gap-1.5 cursor-pointer ${importing ? 'opacity-60 pointer-events-none' : ''}`}>
              {importing
                ? <><FiLoader size={13} className="animate-spin" /> Đang import...</>
                : <><FiUpload size={13} /> Import Excel</>}
              <input
                ref={importRef}
                type="file" accept=".xlsx,.xls" className="hidden"
                onChange={handleImportExcel}
              />
            </label>
            <div className="flex-1" />
            <button className="btn-secondary text-sm py-1.5 gap-1.5" onClick={() => setBankModal(true)}>
              <FiDatabase size={13} /> Từ ngân hàng
            </button>
            <button className="btn-secondary text-sm py-1.5 gap-1.5" onClick={addQ}>
              <FiPlus size={13} /> Thêm câu hỏi
            </button>
          </div>

          {bankModal && (
            <QuestionBankPickerModal
              lessonId={lesson?.id}
              onClose={() => setBankModal(false)}
              onAdd={picked => setQuestions(p => [...p, ...picked])}
            />
          )}

          {/* Questions */}
          {questions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FiEdit2 size={20} className="text-gray-400" />
              </div>
              <p className="text-sm">Chưa có câu hỏi nào. Tạo bằng AI hoặc thêm thủ công.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, qi) => {
                const hasCorrect = q.answers.some(a => a.correct);
                return (
                  <div key={qi}
                    className={`rounded-xl border-2 transition-colors ${
                      hasCorrect ? 'border-gray-200' : 'border-amber-300 bg-amber-50/30'
                    }`}>

                    {/* Q header */}
                    <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                      <span className="badge-indigo">Câu {qi + 1}</span>
                      {!hasCorrect && (
                        <span className="text-xs text-amber-600 font-medium">Chưa chọn đáp án đúng</span>
                      )}
                      {hasCorrect && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <FiCheckCircle size={12} /> Đã chọn đáp án đúng
                        </span>
                      )}
                      <button
                        className="ml-auto p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        onClick={() => removeQ(qi)}>
                        <FiTrash2 size={14} />
                      </button>
                    </div>

                    <div className="px-4 pb-4 space-y-3">
                      <textarea
                        className="input resize-none text-sm"
                        rows={2}
                        placeholder={`Nội dung câu ${qi + 1}...`}
                        value={q.content}
                        onChange={e => updateQ(qi, 'content', e.target.value)}
                      />

                      {/* Answers */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">
                          Chọn đáp án đúng <span className="text-red-500">*</span>
                        </p>
                        <div className="space-y-2">
                          {q.answers.map((a, ai) => (
                            <label key={ai}
                              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-all ${
                                a.correct
                                  ? 'border-emerald-400 bg-emerald-50'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}>
                              <input type="radio" name={`correct-${qi}`}
                                checked={a.correct} onChange={() => setCorrect(qi, ai)}
                                className="accent-emerald-500 shrink-0" />
                              <span className={`text-xs font-bold w-5 shrink-0 ${a.correct ? 'text-emerald-600' : 'text-gray-400'}`}>
                                {ANSWER_LABELS[ai] ?? ai + 1}
                              </span>
                              <input
                                className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                                placeholder={`Đáp án ${ANSWER_LABELS[ai] ?? ai + 1}...`}
                                value={a.content}
                                onChange={e => updateA(qi, ai, e.target.value)}
                              />
                              {q.answers.length > 2 && (
                                <button
                                  className="shrink-0 text-gray-300 hover:text-red-400 transition-colors"
                                  onClick={e => { e.preventDefault(); removeAnswer(qi, ai); }}>
                                  <FiX size={13} />
                                </button>
                              )}
                            </label>
                          ))}
                        </div>
                        {q.answers.length < 6 && (
                          <button
                            className="mt-2 text-indigo-600 hover:text-indigo-700 text-xs font-medium flex items-center gap-1"
                            onClick={() => addAnswer(qi)}>
                            <FiPlus size={12} /> Thêm đáp án
                          </button>
                        )}
                      </div>

                      {/* Explanation */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1.5">Giải thích đáp án</p>
                        <textarea
                          className="input resize-none text-sm"
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

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl shrink-0">
          <span className="text-sm text-gray-400 font-medium">{questions.length} câu hỏi</span>
          <div className="flex gap-3">
            <button className="btn-secondary" onClick={onClose}>Hủy</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving
                ? <><FiLoader size={14} className="animate-spin" /> Đang lưu...</>
                : <><FiSave size={14} /> Lưu bài tập</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
