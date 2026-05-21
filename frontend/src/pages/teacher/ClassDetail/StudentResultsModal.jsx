import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend, Filler,
} from 'chart.js';
import {
  FiX, FiLoader, FiChevronLeft, FiCheckCircle, FiXCircle,
  FiClock, FiSave, FiTrendingUp, FiEye,
} from 'react-icons/fi';
import { getStudentSubmission, saveComment } from '../../../api/examService';
import { getStudentResults, getStudentProgress } from '../../../api/studentService';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

function formatDate(str) {
  if (!str) return '--';
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export default function StudentResultsModal({ student, onClose }) {
  const [results, setResults]           = useState(null);
  const [progress, setProgress]         = useState([]);
  const [detail, setDetail]             = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [comment, setComment]           = useState('');
  const [savingComment, setSavingComment] = useState(false);

  useEffect(() => {
    getStudentResults(student.id)
      .then(data => setResults(data))
      .catch(() => setResults({ studentName: student.full_name, results: [] }));
    getStudentProgress(student.id)
      .then(rows => setProgress(rows))
      .catch(() => {});
  }, [student.id]);

  async function viewDetail(examId, examName) {
    setLoadingDetail(true);
    try {
      const data = await getStudentSubmission(examId, student.id);
      setDetail({ ...data, examNameLabel: examName, examId });
      setComment(data.teacherComment || '');
    } catch (err) {
      toast.error(err.message || 'Không tải được bài làm');
    } finally { setLoadingDetail(false); }
  }

  async function handleSaveComment() {
    if (!comment.trim()) return toast.error('Nhận xét không được trống');
    setSavingComment(true);
    try {
      await saveComment(detail.examId, student.id, comment.trim());
      toast.success('Đã lưu nhận xét');
      setDetail(d => ({ ...d, teacherComment: comment.trim() }));
    } catch (err) {
      toast.error(err.message || 'Lưu nhận xét thất bại');
    } finally { setSavingComment(false); }
  }

  // ── Detail view ──
  if (detail) {
    const passed = detail.score >= 5;
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 shrink-0">
            <button
              onClick={() => setDetail(null)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
              <FiChevronLeft size={17} />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{detail.examNameLabel}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{student.full_name}</p>
            </div>
            <div className={`px-3 py-1 rounded-lg text-sm font-bold ${passed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
              {detail.score}/10
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
              <FiX size={17} />
            </button>
          </div>

          {/* Info bar */}
          <div className="flex items-center gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 shrink-0">
            <span>{detail.correct}/{detail.total} câu đúng</span>
            {detail.timeSpent > 0 && (
              <span className="flex items-center gap-1">
                <FiClock size={11} /> {Math.floor(detail.timeSpent / 60)}p{detail.timeSpent % 60}s
              </span>
            )}
            {detail.submittedAt && <span>Nộp: {formatDate(detail.submittedAt)}</span>}
          </div>

          {/* Questions */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
            {detail.questions.map((q, qi) => (
              <div key={q.questionId}
                className={`rounded-xl border-2 p-4 ${q.isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/20'}`}>
                <div className="flex items-start gap-2 mb-3">
                  <span className={`mt-0.5 shrink-0 ${q.isCorrect ? 'text-emerald-500' : 'text-red-400'}`}>
                    {q.isCorrect ? <FiCheckCircle size={16} /> : <FiXCircle size={16} />}
                  </span>
                  <p className="text-sm font-medium text-gray-900 leading-relaxed">
                    <span className="badge-indigo mr-2 text-xs">Câu {qi + 1}</span>
                    {q.questionContent}
                  </p>
                </div>
                <div className="space-y-1.5 ml-6">
                  {q.answers.map(a => {
                    const isCorrect   = a.isCorrected === 1;
                    const isSelected  = a.isSelected;
                    let cls = 'border-gray-200 text-gray-600';
                    if (isCorrect)                cls = 'border-emerald-400 bg-emerald-50 text-emerald-700 font-medium';
                    if (isSelected && !isCorrect) cls = 'border-red-400 bg-red-50 text-red-600 font-medium';
                    return (
                      <div key={a.answerId}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${cls}`}>
                        {isCorrect  && <FiCheckCircle size={13} className="text-emerald-500 shrink-0" />}
                        {isSelected && !isCorrect && <FiXCircle size={13} className="text-red-400 shrink-0" />}
                        {!isCorrect && !isSelected && <span className="w-3.5 shrink-0" />}
                        <span>{a.content}</span>
                        {isSelected && <span className="ml-auto text-xs opacity-60">(Đã chọn)</span>}
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <p className="mt-2 ml-6 text-xs text-gray-500 italic border-l-2 border-gray-200 pl-2">
                    {q.explanation}
                  </p>
                )}
              </div>
            ))}

            {/* Teacher comment */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
                Nhận xét của giáo viên
              </p>
              <textarea
                className="input resize-none text-sm w-full"
                rows={3}
                placeholder="Nhập nhận xét cho học sinh..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                <button
                  className="btn-primary py-1.5 px-4 text-sm gap-1.5"
                  onClick={handleSaveComment}
                  disabled={savingComment}>
                  {savingComment
                    ? <><FiLoader size={13} className="animate-spin" /> Đang lưu...</>
                    : <><FiSave size={13} /> Lưu nhận xét</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-gray-900">Bài làm của học sinh</h3>
            <p className="text-xs text-gray-400 mt-0.5">{student.full_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <FiX size={17} />
          </button>
        </div>

        {/* Progress chart */}
        {progress.length > 1 && (
          <div className="mb-5 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <FiTrendingUp size={14} className="text-indigo-600" />
              <p className="text-xs font-semibold text-gray-700">Tiến bộ qua thời gian</p>
            </div>
            <Line
              data={{
                labels: progress.map(p => p.examName),
                datasets: [{
                  label: 'Điểm',
                  data: progress.map(p => p.score),
                  borderColor: '#4F46E5',
                  backgroundColor: 'rgba(79,70,229,0.08)',
                  tension: 0.4,
                  pointRadius: 4,
                  pointBackgroundColor: '#4F46E5',
                  fill: true,
                }],
              }}
              options={{
                responsive: true,
                scales: {
                  y: { min: 0, max: 10, grid: { color: '#F3F4F6' } },
                  x: { grid: { display: false }, ticks: { maxRotation: 30, font: { size: 10 } } },
                },
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        )}

        {results === null ? (
          <div className="flex justify-center py-10">
            <FiLoader size={20} className="animate-spin text-gray-300" />
          </div>
        ) : results.results.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Học sinh chưa làm bài nào.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.results.map(r => {
              const passed = r.score >= 5;
              return (
                <div key={r.examId}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 mr-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.examName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.lessonName}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-sm font-bold ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
                      {r.score}/10
                    </span>
                    <button
                      className="btn-secondary py-1 px-2.5 text-xs gap-1"
                      disabled={loadingDetail}
                      onClick={() => viewDetail(r.examId, r.examName)}>
                      {loadingDetail
                        ? <FiLoader size={12} className="animate-spin" />
                        : <><FiEye size={12} /> Chi tiết</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button className="btn-secondary w-full mt-5" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
