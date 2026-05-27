import { useState } from 'react';
import { FiPlus, FiX, FiSave, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { createBankQuestion, updateBankQuestion } from '../../../api/questionBankService';
import { toast } from 'react-toastify';

const ANSWER_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

function emptyAnswers() {
  return ['', '', '', ''].map(() => ({ content: '', is_correct: false }));
}

export default function QuestionFormModal({ initial, lessons = [], defaultLessonId = null, onClose, onSaved }) {
  const isEdit = !!initial;
  const [content, setContent]         = useState(initial?.content || '');
  const [explanation, setExplanation] = useState(initial?.explanation || '');
  const [lessonId, setLessonId]       = useState(defaultLessonId ?? null);
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
        lesson_id: lessonId || null,
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
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <FiX size={17} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Chủ đề</label>
            <select
              className="input w-full"
              value={lessonId ?? ''}
              onChange={e => setLessonId(e.target.value ? Number(e.target.value) : null)}
            >
              {lessons.map(l => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Giải thích đáp án</label>
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
                Đáp án <span className="text-red-500">*</span>
              </p>
              {hasCorrect
                ? <span className="text-xs text-emerald-600 flex items-center gap-1"><FiCheckCircle size={12} /> Đã chọn đáp án đúng</span>
                : <span className="text-xs text-amber-600 flex items-center gap-1"><FiAlertCircle size={12} /> Chưa chọn đáp án đúng</span>}
            </div>
            <div className="space-y-2">
              {answers.map((a, ai) => (
                <label key={ai}
                  className={'flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-all ' +
                    (a.is_correct ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50')}>
                  <input type="radio" name="correct-answer"
                    checked={a.is_correct} onChange={() => setCorrect(ai)}
                    className="accent-emerald-500 shrink-0" />
                  <span className={'text-xs font-bold w-5 shrink-0 ' + (a.is_correct ? 'text-emerald-600' : 'text-gray-400')}>
                    {ANSWER_LABELS[ai] ?? ai + 1}
                  </span>
                  <input
                    className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                    placeholder={'Đáp án ' + (ANSWER_LABELS[ai] ?? ai + 1) + '...'}
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
          <button className="btn-secondary" onClick={onClose}>Hủy</button>
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
