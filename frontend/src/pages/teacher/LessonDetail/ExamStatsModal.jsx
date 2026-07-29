import { useEffect, useState } from 'react';
import { FiLoader, FiZap } from 'react-icons/fi';
import { getExamStats, getAiStatsAnalysis } from '../../../api/examService';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

export default function ExamStatsModal({ examId, examName, onClose }) {
  const [stats, setStats]           = useState(null);
  const [insights, setInsights]     = useState(null);
  const [aiLoading, setAiLoading]   = useState(false);

  useEffect(() => {
    getExamStats(examId)
      .then(setStats)
      .catch(() => toast.error('Không tải được thống kê'));
  }, [examId]);

  async function handleAiAnalysis() {
    setAiLoading(true);
    try {
      const data = await getAiStatsAnalysis(examId);
      setInsights(data.insights ?? []);
    } catch {
      toast.error('Không thể phân tích AI lúc này');
    } finally { setAiLoading(false); }
  }

  function rateVariant(rate) {
    if (rate >= 70) return 'success';
    if (rate >= 40) return 'warning';
    return 'danger';
  }

  function scoreRange(scores, lo, hi) {
    if (!scores) return 0;
    return scores.filter(s => s >= lo && s < hi).length;
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 shrink-0">
          <DialogTitle>Thống kê bài tập</DialogTitle>
          <DialogDescription className="text-xs truncate">{examName}</DialogDescription>
        </DialogHeader>

        {stats === null ? (
          <div className="flex justify-center py-16">
            <FiLoader size={24} className="animate-spin text-slate-300" />
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{stats.completedStudents ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1">Đã nộp / {stats.totalStudents ?? 0}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.avgScore != null ? (+stats.avgScore).toFixed(1) : '--'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Điểm trung bình</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.totalStudents ? Math.round(((stats.completedStudents ?? 0) / stats.totalStudents) * 100) : 0}%
                </p>
                <p className="text-xs text-slate-500 mt-1">Tỉ lệ hoàn thành</p>
              </div>
            </div>

            {/* Score distribution */}
            {stats.scoreDistribution && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Phân bố điểm</p>
                <div className="space-y-2">
                  {[
                    { label: '0 - 4', lo: 0, hi: 4,  color: 'bg-red-400' },
                    { label: '4 - 6', lo: 4, hi: 6,  color: 'bg-amber-400' },
                    { label: '6 - 8', lo: 6, hi: 8,  color: 'bg-blue-400' },
                    { label: '8 - 10', lo: 8, hi: 11, color: 'bg-emerald-400' },
                  ].map(({ label, lo, hi, color }) => {
                    const count = scoreRange(stats.scoreDistribution, lo, hi);
                    const pct = stats.completedStudents ? Math.round((count / stats.completedStudents) * 100) : 0;
                    return (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-12 shrink-0">{label}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: pct + '%' }} />
                        </div>
                        <span className="text-xs text-slate-500 w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Per-question table */}
            {stats.questions && stats.questions.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Thống kê từng câu hỏi</p>
                <div className="rounded-xl border border-slate-200">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Câu hỏi</TableHead>
                        <TableHead className="text-center">Đã trả lời</TableHead>
                        <TableHead className="text-center">Đúng</TableHead>
                        <TableHead className="text-center">Tỉ lệ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.questions.map((q, i) => (
                        <TableRow key={q.questionId}>
                          <TableCell className="text-slate-700">
                            <Badge variant="info" className="mr-2 text-xs">Câu {i + 1}</Badge>
                            {q.content?.length > 60 ? q.content.slice(0, 60) + '...' : q.content}
                          </TableCell>
                          <TableCell className="text-center">{q.totalAnswered ?? 0}</TableCell>
                          <TableCell className="text-center">{q.correctCount ?? 0}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={rateVariant(q.correctRate ?? 0)}>
                              {q.correctRate != null ? Math.round(q.correctRate) : 0}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* AI analysis */}
            {!insights && !aiLoading && stats.completedStudents > 0 && (
              <Button variant="outline" className="w-full gap-2" onClick={handleAiAnalysis}>
                <FiZap size={14} /> Phân tích AI
              </Button>
            )}

            {aiLoading && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-400">
                <FiLoader size={15} className="animate-spin" /> Đang phân tích dữ liệu...
              </div>
            )}

            {insights && insights.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-1.5">
                  <FiZap size={14} className="text-violet-500" /> Phân tích từ AI
                </p>
                <div className="space-y-2">
                  {insights.map((item, i) => (
                    <div key={i} className="rounded-xl border border-violet-200 bg-violet-50/40 px-4 py-3">
                      <p className="text-sm font-semibold text-violet-700 mb-1">{item.title}</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t border-slate-100 shrink-0">
          <Button variant="outline" className="w-full" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
