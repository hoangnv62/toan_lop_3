import { useState } from 'react';
import { FiFileText, FiClock, FiDownload, FiLoader, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Pagination from '../../../components/Pagination';
import { parseDateTime } from '../../../utils/date';
import ClassResultsModal from '../../../components/shared/ClassResultsModal';
import { FaChartBar } from "react-icons/fa";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const LIMIT = 10;

function deadlineInfo(deadlineStr) {
  if (!deadlineStr) return null;
  const now      = new Date();
  const deadline = parseDateTime(deadlineStr);
  if (!deadline) return null;
  const diffMs   = deadline - now;
  const diffH    = diffMs / 36e5;

  if (diffMs < 0)   return { label: deadlineStr, cls: 'text-red-500',   bg: 'bg-red-50',   icon: <FiAlertCircle size={11} />, note: 'Đã hết hạn' };
  if (diffH < 24)   return { label: deadlineStr, cls: 'text-amber-600', bg: 'bg-amber-50', icon: <FiClock size={11} />,       note: 'Sắp hết hạn' };
  if (diffH < 72)   return { label: deadlineStr, cls: 'text-amber-500', bg: 'bg-amber-50', icon: <FiClock size={11} />,       note: null };
  return               { label: deadlineStr, cls: 'text-slate-400',   bg: 'bg-slate-50',  icon: <FiClock size={11} />,       note: null };
}

export default function ExamList({ exams, exportingId, onExport, onUnassign }) {
  const [page, setPage]           = useState(1);
  const [classModal, setClassModal] = useState(null);

  const pages        = Math.max(1, Math.ceil(exams.length / LIMIT));
  // Kẹp lúc render thay vì reset bằng effect: khi giáo viên thu hồi bài tập
  // và trang hiện tại không còn tồn tại thì tự lùi về trang cuối cùng.
  const currentPage  = Math.min(page, pages);
  const paged        = exams.slice((currentPage - 1) * LIMIT, currentPage * LIMIT);
  const totalCompleted = exams.reduce((s, e) => s + (e.completedCount ?? 0), 0);
  const totalAssigned  = exams.reduce((s, e) => s + (e.totalStudents ?? 0), 0);

  return (
    <Card className="p-5 gap-0">
      {classModal && (
        <ClassResultsModal exam={classModal} onClose={() => setClassModal(null)} />
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiFileText size={16} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Bài tập đã giao</h3>
          <Badge variant="info">{exams.length}</Badge>
        </div>
        {exams.length > 0 && totalAssigned > 0 && (
          <span className="text-xs text-slate-400">
            Tổng hoàn thành:
            <span className="font-semibold text-slate-700 ml-1">{totalCompleted}/{totalAssigned}</span>
          </span>
        )}
      </div>

      {exams.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FiFileText size={20} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-500 font-medium">Chưa có bài tập nào</p>
          <p className="text-xs text-slate-400 mt-1">Giao bài từ trang chi tiết bài học</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paged.map(ae => {
            const pct      = ae.totalStudents > 0 ? Math.round((ae.completedCount / ae.totalStudents) * 100) : 0;
            const allDone  = pct === 100;
            const dl       = deadlineInfo(ae.deadline);

            return (
              <div key={ae.examId}
                className="rounded-xl border border-slate-100 hover:border-indigo-100 hover:shadow-xs transition-all duration-200 overflow-hidden">

                {/* Top stripe: completion color */}
                <div className={`h-1 ${allDone ? 'bg-emerald-400' : pct >= 50 ? 'bg-indigo-400' : 'bg-amber-400'}`} />

                <div className="p-4">
                  {/* Row 1: name + actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${allDone ? 'bg-emerald-50' : 'bg-indigo-50'}`}>
                        {allDone
                          ? <FiCheckCircle size={15} className="text-emerald-600" />
                          : <FiFileText size={15} className="text-indigo-600" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 leading-tight truncate">{ae.examName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{ae.lessonName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost" size="icon-sm"
                        title="Xem kết quả cả lớp"
                        className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        onClick={() => setClassModal(ae)}>
                        <FaChartBar size={14} />
                      </Button>
                      <Button
                        variant="ghost" size="icon-sm"
                        title="Xuất Excel"
                        className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        disabled={exportingId === ae.examId}
                        onClick={() => onExport(ae.examId, ae.examName)}>
                        {exportingId === ae.examId
                          ? <FiLoader size={14} className="animate-spin" />
                          : <FiDownload size={14} />}
                      </Button>
                      <Button
                        variant="ghost" size="icon-sm"
                        title="Thu hồi bài tập"
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                        onClick={() => onUnassign(ae.examId)}>
                        <FiX size={14} />
                      </Button>
                    </div>
                  </div>

                  {/* Row 2: progress + deadline */}
                  <div className="mt-3 space-y-2">
                    {/* Progress bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">Hoàn thành</span>
                        <span className={`text-xs font-semibold ${allDone ? 'text-emerald-600' : 'text-slate-700'}`}>
                          {ae.completedCount}/{ae.totalStudents} học sinh · {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            allDone ? 'bg-emerald-400' : pct >= 50 ? 'bg-indigo-400' : 'bg-amber-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Deadline */}
                    {dl && (
                      <div className={`flex items-center gap-1.5 text-xs ${dl.cls} rounded-lg px-2 py-1 ${dl.bg} w-fit`}>
                        {dl.icon}
                        <span>Hạn nộp: {dl.label}</span>
                        {dl.note && <span className="font-semibold">· {dl.note}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Pagination page={currentPage} pages={pages} onChange={setPage} />
    </Card>
  );
}
