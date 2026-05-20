import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamResult } from '../../api/examService';
import { FiArrowLeft, FiCheckCircle, FiXCircle } from 'react-icons/fi';

export default function ExamResult() {
  const { examId } = useParams();
  const navigate   = useNavigate();
  const [result, setResult] = useState(null);

  useEffect(() => {
    getExamResult(examId).then(setResult).catch(() => {});
  }, [examId]);

  if (!result) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const score  = result.score ?? 0;
  const passed = score >= 5;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Nav */}
      <div className="bg-white border-b border-gray-200 px-4 py-3.5">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => navigate('/student')}
            className="btn-ghost py-1.5 px-2.5 gap-1.5 text-gray-600">
            <FiArrowLeft size={15} /> Về trang chủ
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Score card */}
        <div className={`card text-center py-8 border-t-4 ${passed ? 'border-t-emerald-400' : 'border-t-red-400'}`}>
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 ${
            passed ? 'bg-emerald-50' : 'bg-red-50'
          }`}>
            <span className={`text-3xl font-bold ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
              {score}
            </span>
          </div>
          <p className={`text-lg font-bold mb-1 ${passed ? 'text-emerald-700' : 'text-red-600'}`}>
            {passed ? 'Đạt' : 'Chưa đạt'}
          </p>
          <p className="text-sm text-gray-500">{result.correct}/{result.total} câu đúng</p>
          <p className="text-sm font-medium text-gray-700 mt-2">{result.examName}</p>
        </div>

        {/* Review */}
        <div className="space-y-3">
          {result.questions?.map((q, qi) => (
            <div key={q.questionId}
              className={`card border-l-4 ${q.isCorrect ? 'border-l-emerald-400' : 'border-l-red-400'}`}>
              <div className="flex items-start gap-2.5 mb-3">
                {q.isCorrect
                  ? <FiCheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  : <FiXCircle size={16} className="text-red-500 mt-0.5 shrink-0" />}
                <p className="font-medium text-gray-900 text-sm leading-relaxed">
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
                        isCorrect  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 font-medium' :
                        isSelected ? 'border-red-300 bg-red-50 text-red-700' :
                                     'border-gray-100 text-gray-600'
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
                  <div className="text-xs text-gray-500 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
                    <span className="font-medium text-amber-700">Giải thích: </span>
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
