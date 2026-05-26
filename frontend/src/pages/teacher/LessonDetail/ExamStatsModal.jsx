import { useEffect, useState } from 'react';
import { FiX, FiLoader } from 'react-icons/fi';
import { getExamStats } from '../../../api/examService';
import { toast } from 'react-toastify';

export default function ExamStatsModal({ examId, examName, onClose }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getExamStats(examId)
      .then(setStats)
      .catch(() => toast.error('Khong tai duoc thong ke'));
  }, [examId]);

  function rateBadge(rate) {
    if (rate >= 70) return 'badge-green';
    if (rate >= 40) return 'badge-yellow';
    return 'bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium';
  }

  function scoreRange(scores, lo, hi) {
    if (!scores) return 0;
    return scores.filter(s => s >= lo && s < hi).length;
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900">Thống kê  bài tập</h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{examName}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <FiX size={17} />
          </button>
        </div>

        {stats === null ? (
          <div className="flex justify-center py-16">
            <FiLoader size={24} className="animate-spin text-gray-300" />
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.completedStudents ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">Đã nộp / {stats.totalStudents ?? 0}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.avgScore != null ? (+stats.avgScore).toFixed(1) : '--'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Điểm trung bình</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.totalStudents ? Math.round(((stats.completedStudents ?? 0) / stats.totalStudents) * 100) : 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Tỉ lệ hoàn thành</p>
              </div>
            </div>

            {/* Score distribution */}
            {stats.scoreDistribution && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Phân bố điểm</p>
                <div className="space-y-2">
                  {[
                    { label: '0 - 4', lo: 0, hi: 4, color: 'bg-red-400' },
                    { label: '4 - 6', lo: 4, hi: 6, color: 'bg-amber-400' },
                    { label: '6 - 8', lo: 6, hi: 8, color: 'bg-blue-400' },
                    { label: '8 - 10', lo: 8, hi: 11, color: 'bg-emerald-400' },
                  ].map(({ label, lo, hi, color }) => {
                    const count = scoreRange(stats.scoreDistribution, lo, hi);
                    const pct = stats.completedStudents ? Math.round((count / stats.completedStudents) * 100) : 0;
                    return (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-12 shrink-0">{label}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: pct + '%' }} />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Per-question table */}
            {stats.questions && stats.questions.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Thống kê từng câu hỏi</p>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="table-head">Cau hoi</th>
                        <th className="table-head text-center">Đã trả lời</th>
                        <th className="table-head text-center">Đúng</th>
                        <th className="table-head text-center">Tỉ lệ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.questions.map((q, i) => (
                        <tr key={q.questionId} className="table-row">
                          <td className="table-cell text-gray-700">
                            <span className="badge-indigo mr-2 text-xs">Câu {i + 1}</span>
                            {q.content?.length > 60 ? q.content.slice(0, 60) + '...' : q.content}
                          </td>
                          <td className="table-cell text-center">{q.totalAnswered ?? 0}</td>
                          <td className="table-cell text-center">{q.correctCount ?? 0}</td>
                          <td className="table-cell text-center">
                            <span className={rateBadge(q.correctRate ?? 0)}>
                              {q.correctRate != null ? Math.round(q.correctRate) : 0}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          <button className="btn-secondary w-full" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
