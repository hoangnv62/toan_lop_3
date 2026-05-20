import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchExam, submitExam } from '../../api/examService';
import { toast } from 'react-toastify';
import { FiAlertCircle } from 'react-icons/fi';

function ConfirmSubmitModal({ answered, total, onConfirm, onCancel }) {
  const unanswered = total - answered;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="text-center mb-5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
            unanswered > 0 ? 'bg-amber-50' : 'bg-indigo-50'
          }`}>
            <FiAlertCircle size={24} className={unanswered > 0 ? 'text-amber-500' : 'text-indigo-500'} />
          </div>
          <h3 className="font-semibold text-gray-900 text-base">Xác nhận nộp bài?</h3>
          <p className="text-sm text-gray-500 mt-2">
            Đã trả lời <span className="font-semibold text-gray-800">{answered}/{total}</span> câu hỏi.
          </p>
          {unanswered > 0 && (
            <p className="text-xs text-amber-600 mt-1 font-medium">
              Còn {unanswered} câu chưa trả lời.
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onCancel}>Làm tiếp</button>
          <button className="btn-primary flex-1" onClick={onConfirm}>Nộp bài</button>
        </div>
      </div>
    </div>
  );
}

const EXAM_DURATION = 20 * 60;

export default function StudentExam() {
  const { examId }  = useParams();
  const navigate    = useNavigate();
  const [exam, setExam]           = useState(null);
  const [answers, setAnswers]     = useState({});
  const [timeLeft, setTimeLeft]   = useState(EXAM_DURATION);
  const [submitting, setSubmitting]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchExam(examId).then(setExam).catch(() => toast.error('Không tải được bài tập'));
  }, [examId]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  function selectAnswer(questionId, answerId) {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
  }

  async function handleSubmit(auto = false) {
    if (!auto) { setShowConfirm(true); return; }
    setShowConfirm(false);
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const timeSpent = EXAM_DURATION - timeLeft;
      await submitExam(Number(examId), {
        answers: Object.entries(answers).map(([qId, aId]) => ({
          questionId: Number(qId), answerId: Number(aId),
        })),
        timeSpent,
      });
      toast.success('Nộp bài thành công');
      setTimeout(() => navigate(`/exam-result/${examId}`), 800);
    } catch (err) {
      toast.error(err.message || 'Nộp bài thất bại');
      setSubmitting(false);
    }
  }

  const mm       = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss       = String(timeLeft % 60).padStart(2, '0');
  const answered = Object.keys(answers).length;
  const total    = exam?.questions?.length ?? 0;
  const pct      = total ? (answered / total) * 100 : 0;

  const timeStatus =
    timeLeft <= 60  ? 'urgent' :
    timeLeft <= 300 ? 'warning' : 'normal';

  const timerCls =
    timeStatus === 'urgent'  ? 'text-red-600 bg-red-50 border-red-200' :
    timeStatus === 'warning' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                               'text-indigo-600 bg-indigo-50 border-indigo-200';

  return (
    <div className="min-h-screen bg-gray-50">
      {showConfirm && (
        <ConfirmSubmitModal
          answered={answered}
          total={total}
          onConfirm={() => handleSubmit(true)}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{exam?.name || 'Đang tải...'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{answered}/{total} câu đã trả lời</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className={`font-mono font-bold text-base px-3 py-1 rounded-lg border ${timerCls}`}>
              {mm}:{ss}
            </div>
            <button className="btn-primary py-1.5 px-4" onClick={() => handleSubmit(false)} disabled={submitting}>
              {submitting ? 'Đang nộp...' : 'Nộp bài'}
            </button>
          </div>
        </div>
        {/* Progress bar */}
        {total > 0 && (
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-8">
        {!exam ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : exam.questions.map((q, qi) => (
          <div key={q.questionId} className="card">
            <p className="font-semibold text-gray-900 mb-4 text-sm leading-relaxed">
              <span className="badge-indigo mr-2">Câu {qi + 1}</span>
              {q.questionContent}
            </p>
            <div className="space-y-2">
              {q.answers.map(a => {
                const selected = answers[q.questionId] === a.answerId;
                return (
                  <button key={a.answerId}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                      selected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                    onClick={() => selectAnswer(q.questionId, a.answerId)}>
                    {a.content}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
