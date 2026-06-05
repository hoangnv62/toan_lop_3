import { useNavigate } from 'react-router-dom';
import { FiClock } from 'react-icons/fi';
import { parseDateTime } from '../../../utils/date';

export default function ExamList({ exams, viewAll = false }) {
  const navigate = useNavigate();

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Danh sách bài tập</h3>
      {exams.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-8">
          {viewAll ? 'Chưa có đề thi nào.' : 'Không có đề thi trong tuần này.'}
        </p>
      ) : (
        <div className="space-y-2">
          {exams.map(exam => {
            const isPastDeadline = exam.deadline && parseDateTime(exam.deadline) < new Date();
            return (
              <div key={exam.examId}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="min-w-0 mr-3">
                  <p className="font-medium text-slate-900 text-sm truncate">{exam.examName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{exam.lessonTitle}</p>
                  {exam.deadline && !exam.done && (
                    <p className={`text-xs mt-0.5 flex items-center gap-1 ${isPastDeadline ? 'text-red-500' : 'text-amber-600'}`}>
                      <FiClock size={10} />
                      {isPastDeadline ? 'Hết hạn: ' : 'Hạn: '}
                      {exam.deadline}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {exam.score != null && (
                    <span className={`text-sm font-bold ${exam.score >= 5 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {exam.score}/10
                    </span>
                  )}
                  {exam.done ? (
                    <button className="btn-secondary py-1.5 px-3 text-xs"
                      onClick={() => navigate(`/exam-result/${exam.examId}`)}>
                      Xem kết quả
                    </button>
                  ) : (
                    <button
                      className="btn-primary py-1.5 px-3 text-xs disabled:opacity-50 disabled:pointer-events-none"
                      disabled={isPastDeadline}
                      onClick={() => navigate(`/student/exam/${exam.examId}`)}>
                      {isPastDeadline ? 'Hết hạn' : 'Làm bài'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
