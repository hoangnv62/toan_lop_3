import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamResult, getAiExamFeedback } from '../../api/examService';
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiLoader, FiZap } from 'react-icons/fi';

export default function ExamResult() {
  const { examId } = useParams();
  const navigate   = useNavigate();
  const [result, setResult]         = useState(null);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiLoading, setAiLoading]   = useState(false);

  useEffect(() => {
    getExamResult(examId).then(data => {
      setResult(data);
      setAiLoading(true);
      getAiExamFeedback(examId)
        .then(res => setAiFeedback(res.feedback))
        .catch(() => {})
        .finally(() => setAiLoading(false));
    }).catch(() => {});
  }, [examId]);

  if (!result) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const score  = result.score ?? 0;
  const passed = score >= 5;

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Nav */}
      <div className="bg-white border-b border-slate-100 px-4 py-3.5 shadow-[0_1px_20px_-4px_rgba(79,70,229,0.08)]">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => navigate('/student')}
            className="btn-ghost py-1.5 px-2.5 gap-1.5 text-slate-600">
            <FiArrowLeft size={15} /> Về trang chủ
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Score card */}
        <div className={`bg-white rounded-xl border border-slate-100 shadow-soft p-8 text-center border-t-4 ${passed ? 'border-t-emerald-400' : 'border-t-red-400'}`}>
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 ${
            passed ? 'bg-emerald-50' : 'bg-red-50'
          }`}>
            <span className={`text-3xl font-extrabold ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
              {score}
            </span>
          </div>
          <p className={`text-lg font-extrabold mb-1 ${passed ? 'text-emerald-700' : 'text-red-600'}`}>
            {passed ? 'Đạt' : 'Chưa đạt'}
          </p>
          <p className="text-sm text-slate-500">{result.correct}/{result.total} câu đúng</p>
          <p className="text-sm font-semibold text-slate-700 mt-2">{result.examName}</p>
        </div>

        {/* Teacher comment */}
        {result.teacherComment && (
          <div className="card border-l-4 border-l-indigo-400 bg-indigo-50/40">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1.5">
              Nhận xét của giáo viên
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">{result.teacherComment}</p>
          </div>
        )}

        {/* AI feedback */}
        {(aiLoading || aiFeedback) && (
          <div className="card border-l-4 border-l-violet-400 bg-violet-50/40">
            <p className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <FiZap size={11} /> Nhận xét từ AI
            </p>
            {aiLoading
              ? <div className="flex items-center gap-2 text-sm text-slate-400">
                  <FiLoader size={13} className="animate-spin" /> Đang phân tích bài làm...
                </div>
              : <p className="text-sm text-slate-700 leading-relaxed">{aiFeedback}</p>}
          </div>
        )}

        {/* Review */}
        <div className="space-y-3">
          {result.questions?.map((q, qi) => (
            <div key={q.questionId}
              className={`card border-l-4 ${q.isCorrect ? 'border-l-emerald-400' : 'border-l-red-400'}`}>
              <div className="flex items-start gap-2.5 mb-3">
                {q.isCorrect
                  ? <FiCheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  : <FiXCircle size={16} className="text-red-500 mt-0.5 shrink-0" />}
                <p className="font-semibold text-slate-900 text-sm leading-relaxed">
                  Câu {qi + 1}: {q.questionContent}
                </p>
              </div>
              <div className="space-y-2 pl-6">
                {q.answers?.map(a => {
                  const isCorrect  = a.isCorrected === 1;
                  const isSelected = a.isSelected && !isCorrect;
                  return (
                    <div key={a.answerId}
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        isCorrect  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold' :
                        isSelected ? 'border-red-300 bg-red-50 text-red-700' :
                                     'border-slate-100 text-slate-600'
                      }`}>
                      {a.content}
                      {isCorrect  && <span className="ml-2 text-xs opacity-70">(Đáp án đúng)</span>}
                      {isSelected && <span className="ml-2 text-xs opacity-70">(Bạn chọn)</span>}
                    </div>
                  );
                })}
              </div>
              {q.explanation && (
                <div className="mt-3 pl-6">
                  <div className="text-xs text-slate-500 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
                    <span className="font-semibold text-amber-700">Giải thích: </span>
                    {q.explanation}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
