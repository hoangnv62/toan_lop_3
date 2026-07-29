import { useState } from 'react';
import { FiUsers, FiDownload, FiLoader, FiEye, FiUserX } from 'react-icons/fi';
import Pagination from '../../../components/Pagination';
import { useClassStudentMutations } from '../../../hooks/useClass';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

function scoreStyle(score) {
  if (score == null) return { avatar: 'bg-slate-100 text-slate-500', pill: 'bg-slate-100 text-slate-400' };
  if (score >= 8)    return { avatar: 'bg-emerald-100 text-emerald-700', pill: 'bg-emerald-100 text-emerald-700' };
  if (score >= 5)    return { avatar: 'bg-indigo-100 text-indigo-700',   pill: 'bg-indigo-100 text-indigo-700'   };
  return               { avatar: 'bg-red-100 text-red-600',            pill: 'bg-red-100 text-red-600'          };
}

function ConfirmModal({ student, onConfirm, onCancel }) {
  return (
    <Dialog open onOpenChange={open => !open && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center sm:text-center">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-1">
            <FiUserX size={22} className="text-red-500" />
          </div>
          <DialogTitle>Xác nhận gỡ học sinh</DialogTitle>
          <DialogDescription>
            Gỡ <span className="font-semibold text-slate-800">{student.fullName}</span> khỏi lớp?
          </DialogDescription>
          <p className="text-xs text-slate-400">Tài khoản học sinh vẫn được giữ lại.</p>
        </DialogHeader>
        <DialogFooter className="sm:justify-stretch">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Hủy</Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm}>Gỡ khỏi lớp</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentRoster({
  classId, students, totalStudents, classAvg, page, pages,
  exportingStudents, onExportStudents, onPageChange,
  onViewExams, onViewRelatives, onRemoved,
}) {
  const [confirm, setConfirm] = useState(null);
  const { remove } = useClassStudentMutations();

  async function handleConfirmRemove() {
    const { studentId } = confirm;
    setConfirm(null);
    await remove(classId, studentId, onRemoved);
  }

  return (
    <>
      {confirm && (
        <ConfirmModal
          student={confirm}
          onConfirm={handleConfirmRemove}
          onCancel={() => setConfirm(null)}
        />
      )}

      <Card className="p-5 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiUsers size={16} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Danh sách học sinh</h3>
            <Badge variant="info">{totalStudents}</Badge>
            {classAvg && (
              <span className="text-xs text-slate-400">· TB lớp:
                <span className="font-semibold text-slate-700 ml-1">{classAvg}</span>
              </span>
            )}
          </div>
          <Button variant="outline" className="py-1.5 px-3 text-xs gap-1" onClick={onExportStudents} disabled={exportingStudents}>
            {exportingStudents
              ? <FiLoader size={13} className="animate-spin" />
              : <FiDownload size={13} />}
            {exportingStudents ? 'Đang xuất...' : 'Xuất Excel'}
          </Button>
        </div>

        {/* Column labels */}
        {!!students?.length && (
          <div className="flex items-center gap-3 px-3 mb-1">
            <span className="w-5 shrink-0" />
            <span className="w-9 shrink-0" />
            <span className="flex-1 text-xs font-medium text-slate-400 uppercase tracking-wide">Học sinh</span>
            <span className="w-14 text-xs font-medium text-slate-400 uppercase tracking-wide text-center shrink-0">Điểm TB</span>
            <span className="w-20 shrink-0" />
          </div>
        )}

        {/* List */}
        {!students?.length ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FiUsers size={20} className="text-slate-400" />
            </div>
            <p className="text-sm text-slate-400">Chưa có học sinh trong lớp</p>
          </div>
        ) : (
          <div className="space-y-1">
            {students.map((s, idx) => {
              const name  = s.fullName || s.full_name || '';
              const style = scoreStyle(s.avgScore ?? s.avg_score);
              return (
                <div key={s.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">

                  {/* Index */}
                  <span className="text-xs text-slate-300 w-5 text-right shrink-0 font-mono select-none">
                    {(page - 1) * 15 + idx + 1}
                  </span>

                  {/* Avatar — color reflects score level */}
                  <Avatar className={`size-9 rounded-xl ${style.avatar}`}>
                    <AvatarFallback className="rounded-xl bg-transparent text-sm font-bold text-inherit">
                      {name.trim().charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name + username */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{s.username}</p>
                  </div>

                  {/* Score pill */}
                  <div className={`shrink-0 w-14 text-center px-2 py-1 rounded-lg text-xs font-bold ${style.pill}`}>
                    {s.avgScore != null ? s.avgScore : '—'}
                  </div>

                  {/* Actions — icon-only, always visible */}
                  <div className="flex items-center gap-0.5 shrink-0 w-20 justify-end">
                    <Button
                      variant="ghost" size="icon-sm"
                      title="Xem bài làm"
                      className="text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"
                      onClick={() => onViewExams(s)}>
                      <FiEye size={14} />
                    </Button>
                    <Button
                      variant="ghost" size="icon-sm"
                      title="Người thân"
                      className="text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"
                      onClick={() => onViewRelatives(s)}>
                      <FiUsers size={14} />
                    </Button>
                    <Button
                      variant="ghost" size="icon-sm"
                      title="Gỡ khỏi lớp"
                      className="text-slate-300 hover:text-red-500 hover:bg-red-50"
                      onClick={() => setConfirm({ studentId: s.id, fullName: name })}>
                      <FiUserX size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Pagination page={page} pages={pages} onChange={onPageChange} />
      </Card>
    </>
  );
}
