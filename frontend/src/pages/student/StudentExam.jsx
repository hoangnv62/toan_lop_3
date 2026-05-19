import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchExam, submitExam } from '../../api/examService';
import { toast } from 'react-toastify';

const EXAM_DURATION = 20 * 60;

export default function StudentExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchExam(examId).then(setExam).catch(() => toast.error('Không tải được đề thi'));
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
    if (!auto && !confirm('Nộp bài?')) return;
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const timeSpent = EXAM_DURATION - timeLeft;
      const payload = {
        answers: Object.entries(answers).map(([qId, aId]) => ({
          questionId: Number(qId),
          answerId: Number(aId),
        })),
        timeSpent,
      };
      await submitExam(Number(examId), payload);
      toast.success('Nộp bài thành công');
      setTimeout(() => navigate(`/exam-result/${examId}`), 800);
    } catch (err) {
      toast.error(err.message || 'Nộp bài thất bại');
      setSubmitting(false);
    }
  }

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const timeColor = timeLeft <= 60 ? 'text-red-500' : timeLeft <= 300 ? 'text-yellow-500' : 'text-indigo-600';
  const answered = Object.keys(answers).length;
  const total = exam?.questions?.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-800 text-sm">{exam?.name || 'Đang tải...'}</p>
          <p className="text-xs text-gray-400">{answered}/{total} câu đã trả lời</p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`font-mono font-bold text-lg ${timeColor}`}>{mm}:{ss}</span>
          <button className="btn-primary text-sm py-1.5 px-4" onClick={() => handleSubmit(false)} disabled={submitting}>
            {submitting ? 'Đang nộp...' : 'Nộp bài'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-20">
        {!exam ? (
          <p className="text-center text-gray-400 mt-20">Đang tải đề thi...</p>
        ) : exam.questions.map((q, qi) => (
          <div key={q.questionId} className="card">
            <p className="font-semibold text-gray-800 mb-3">
              <span className="text-indigo-500 mr-2">Câu {qi + 1}.</span>
              {q.questionContent}
            </p>
            <div className="space-y-2">
              {q.answers.map(a => {
                const selected = answers[q.questionId] === a.answerId;
                return (
                  <button key={a.answerId}
                    className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition
                      ${selected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-700'}`}
                    onClick={() => selectAnswer(q.questionId, a.answerId)}>
                    {a.content}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Tiến độ</span>
              <span>{answered}/{total}</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${total ? (answered / total) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
