import { useEffect, useState } from 'react';
import { FiLoader, FiAward, FiClock, FiCheckCircle } from 'react-icons/fi';
import { getClassResults } from '../../api/examService';
import { useAuth } from '../../context/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

function fmtTime(seconds) {
  if (!seconds) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}p ${s}s` : `${s}s`;
}

export default function ClassResultsModal({ exam, onClose }) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClassResults(exam.examId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [exam.examId]);

  const results = data?.results ?? [];
  const myRank  = !isTeacher ? results.findIndex(r => r.username === user?.username) + 1 : 0;
  const topScore = results.length ? results[0].score : null;

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      {/* Dialog đã tự render qua portal nên không cần createPortal như trước */}
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col gap-0 p-0">

        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-slate-100 shrink-0">
          <DialogTitle className="text-sm">Kết quả cả lớp</DialogTitle>
          <DialogDescription className="text-xs truncate">{exam.examName}</DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <FiLoader size={22} className="animate-spin text-indigo-400" />
            </div>
          ) : results.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">Chưa có học sinh nào nộp bài.</p>
          ) : (
            <>
              {/* Summary bar */}
              <div className="grid grid-cols-3 gap-3 px-5 py-4 bg-slate-50/60 border-b border-slate-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-indigo-600">{results.length}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Đã nộp</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-600">
                    {(results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Điểm TB</p>
                </div>
                <div className="text-center">
                  {isTeacher ? (
                    <>
                      <p className="text-lg font-bold text-amber-600">{topScore ?? '--'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Điểm cao nhất</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-amber-600">{myRank > 0 ? `#${myRank}` : '--'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Hạng của bạn</p>
                    </>
                  )}
                </div>
              </div>

              {/* Table */}
              <Table>
                <TableHeader>
                  <TableRow className="text-xs text-slate-400">
                    <TableHead className="px-5">#</TableHead>
                    <TableHead className="px-3">Học sinh</TableHead>
                    <TableHead className="px-3 text-center">Điểm</TableHead>
                    <TableHead className="px-3 text-center hidden sm:table-cell">Đúng</TableHead>
                    <TableHead className="px-3 text-center hidden sm:table-cell">T.gian</TableHead>
                    <TableHead className="px-5 text-right hidden md:table-cell">Nộp lúc</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r, i) => {
                    const isMe  = !isTeacher && r.username === user?.username;
                    const rank  = i + 1;
                    const medalCls = rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-slate-400' : rank === 3 ? 'text-amber-600' : 'text-slate-300';
                    return (
                      <TableRow key={r.username}
                        className={isMe ? 'bg-indigo-50/70' : undefined}>
                        <TableCell className="px-5">
                          {rank <= 3
                            ? <FiAward size={14} className={medalCls} />
                            : <span className="text-xs text-slate-300">{rank}</span>}
                        </TableCell>
                        <TableCell className="px-3">
                          <span className={`font-medium ${isMe ? 'text-indigo-700' : 'text-slate-700'}`}>
                            {r.fullName}
                          </span>
                          {isMe && <Badge variant="info" className="ml-1.5 text-[10px]">Bạn</Badge>}
                        </TableCell>
                        <TableCell className="px-3 text-center">
                          <span className={`font-bold text-sm ${r.score >= 8 ? 'text-emerald-600' : r.score >= 5 ? 'text-amber-600' : 'text-red-500'}`}>
                            {r.score}
                          </span>
                          <span className="text-xs text-slate-300">/10</span>
                        </TableCell>
                        <TableCell className="px-3 text-center hidden sm:table-cell">
                          <span className="text-xs text-slate-500 flex items-center justify-center gap-0.5">
                            <FiCheckCircle size={11} className="text-emerald-400" />
                            {r.correctCount}/{r.totalQuestions}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 text-center hidden sm:table-cell">
                          <span className="text-xs text-slate-400 flex items-center justify-center gap-0.5">
                            <FiClock size={11} />
                            {fmtTime(r.timeSpent)}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 text-right hidden md:table-cell">
                          <span className="text-xs text-slate-400">{r.submittedAt ?? '--'}</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </div>

        <DialogFooter className="px-5 py-3 border-t border-slate-100 shrink-0">
          <Button variant="outline" className="w-full py-1.5 text-sm" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
