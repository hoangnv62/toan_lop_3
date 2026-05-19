import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamResult } from '../../api/examService';

export default function ExamResult() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);

  useEffect(() => {
    getExamResult(examId).then(setResult).catch(() => {});
  }, [examId]);

  if (!result) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Đang tải kết quả...</p>
    </div>
  );

  const score = result.score ?? 0;
  const passed = score >= 5;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Result header */}
        <div className={`card text-center py-6 border-t-4 ${passed ? 'border-green-500' : 'border-red-400'}`}>
          <div className={`text-5xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-500'}`}>
            {score}/10
          </div>
          <p className={`text-lg font-semibold ${passed ? 'text-green-700' : 'text-red-600'}`}>
            {passed ? '✅ Đạt' : '❌ Chưa đạt'}
          </p>
          <p className="text-sm text-gray-500 mt-1">{result.correct}/{result.total} câu đúng</p>
          <p className="text-gray-600 font-medium mt-2">{result.examName}</p>
          <button className="btn-secondary text-sm mt-4" onClick={() => navigate('/student')}>
            ← Về trang chủ
          </button>
        </div>

        {/* Questions review */}
        <div className="space-y-3">
          {result.questions?.map((q, qi) => (
            <div key={q.questionId} className={`card border-l-4 ${q.isCorrect ? 'border-green-400' : 'border-red-400'}`}>
              <p className="font-semibold text-gray-800 mb-2 text-sm">
                <span className={`mr-2 ${q.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                  {q.isCorrect ? '✓' : '✗'}
                </span>
                Câu {qi + 1}: {q.questionContent}
              </p>
              <div className="space-y-1.5">
                {q.answers?.map(a => {
                  let cls = 'border-gray-100 text-gray-600';
                  if (a.isCorrected === 1) cls = 'border-green-300 bg-green-50 text-green-700 font-medium';
                  else if (a.isSelected && a.isCorrected !== 1) cls = 'border-red-300 bg-red-50 text-red-700';
                  return (
                    <div key={a.answerId} className={`px-3 py-2 rounded-lg border text-sm ${cls}`}>
                      {a.content}
                      {a.isCorrected === 1 && <span className="ml-2 text-xs">(Đáp án đúng)</span>}
                      {a.isSelected && a.isCorrected !== 1 && <span className="ml-2 text-xs">(Bạn chọn)</span>}
                    </div>
                  );
                })}
              </div>
              {q.explanation && (
                <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  💡 {q.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
