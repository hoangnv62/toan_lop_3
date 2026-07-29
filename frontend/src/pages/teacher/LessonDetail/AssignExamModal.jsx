import { useEffect, useState } from 'react';
import { FiX, FiLoader, FiSend, FiClock, FiEdit2 } from 'react-icons/fi';
import { getExamAssignments } from '../../../api/examService';
import { useClassExamMutations } from '../../../hooks/useClass';
import { toast } from 'react-toastify';
import { parseDateTimeToLocal, parseDateTime } from '../../../utils/date';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

function toDatetimeLocal(str) {
  return parseDateTimeToLocal(str);
}

export default function AssignExamModal({ exam, onClose }) {
  const [assignments, setAssignments] = useState(null);
  const [pendingId, setPendingId]     = useState(null);
  const [timeLimit, setTimeLimit]     = useState('');
  const [deadline, setDeadline]       = useState('');
  const [openTime, setOpenTime]       = useState('');
  const [editingId, setEditingId]     = useState(null);
  const [editTimeLimit, setEditTimeLimit] = useState('');
  const [editDeadline, setEditDeadline]   = useState('');
  const [editOpenTime, setEditOpenTime]   = useState('');
  const [actionId, setActionId]       = useState(null);
  const { assign, update: updateAssignment, unassign } = useClassExamMutations();

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setAssignments(await getExamAssignments(exam.id));
    } catch {
      setAssignments([]);
    }
  }

  function startEdit(cls) {
    setEditingId(cls.classId);
    setEditTimeLimit(cls.timeLimit ? String(Math.round(cls.timeLimit / 60)) : '');
    setEditOpenTime(toDatetimeLocal(cls.openTime));
    setEditDeadline(toDatetimeLocal(cls.deadline));
    setPendingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTimeLimit('');
    setEditDeadline('');
    setEditOpenTime('');
  }

  async function handleAssign(classId) {
    if (!timeLimit || !openTime || !deadline) {
      return toast.error('Vui lòng điền đầy đủ thời gian làm bài, thời gian mở đề và hạn nộp bài');
    }
    setActionId(classId);
    await assign(classId, exam.id, timeLimit, deadline, openTime, () => {
      setPendingId(null);
      setTimeLimit(''); setDeadline(''); setOpenTime('');
      load();
    });
    setActionId(null);
  }

  async function handleUpdate(classId) {
    if (!editTimeLimit || !editOpenTime || !editDeadline) {
      return toast.error('Vui lòng điền đầy đủ thời gian làm bài, thời gian mở đề và hạn nộp bài');
    }
    setActionId(classId);
    await updateAssignment(classId, exam.id, editTimeLimit, editDeadline, editOpenTime, () => {
      cancelEdit();
      load();
    });
    setActionId(null);
  }

  async function handleUnassign(classId) {
    setActionId(classId);
    await unassign(classId, exam.id, () => {
      cancelEdit();
      load();
    });
    setActionId(null);
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Giao bài cho lớp</DialogTitle>
          <DialogDescription className="text-xs truncate">{exam.name}</DialogDescription>
        </DialogHeader>

        {assignments === null ? (
          <div className="flex justify-center py-10">
            <FiLoader size={20} className="animate-spin text-slate-300" />
          </div>
        ) : assignments.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">Chưa có lớp nào.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {assignments.map(cls => (
              <div key={cls.classId}
                className={`rounded-xl border p-3 transition-colors ${
                  cls.assigned ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200'
                }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-900 truncate">{cls.className}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {cls.assigned ? (
                      <>
                        <Badge variant="success" className="text-xs">Đã giao</Badge>
                        <Button variant="ghost" className="py-0.5 px-2 text-xs gap-0.5" disabled={actionId === cls.classId} onClick={() => editingId === cls.classId ? cancelEdit() : startEdit(cls)}>
                          <FiEdit2 size={11} />
                          {editingId === cls.classId ? 'Hủy' : 'Sửa'}
                        </Button>
                        <Button variant="ghost" className="text-red-500 hover:bg-red-50 py-0.5 px-2 text-xs gap-0.5" disabled={actionId === cls.classId} onClick={() => handleUnassign(cls.classId)}>
                          {actionId === cls.classId
                            ? <FiLoader size={11} className="animate-spin" />
                            : <><FiX size={11} /> Thu hồi</>}
                        </Button>
                      </>
                    ) : (
                      <Button variant="gradient" className="py-0.5 px-2.5 text-xs gap-1" onClick={() => { setPendingId(cls.classId); cancelEdit(); setTimeLimit(''); setDeadline(''); setOpenTime(''); }}>
                        <FiSend size={11} /> Giao
                      </Button>
                    )}
                  </div>
                </div>

                {/* Assignment info — ẩn khi đang edit */}
                {cls.assigned && editingId !== cls.classId && (
                  <div className="mt-1.5 space-y-0.5">
                    {cls.timeLimit && (
                      <p className="text-xs text-indigo-600 flex items-center gap-1">
                        <FiClock size={10} /> Thời gian: {Math.round(cls.timeLimit / 60)} phút
                      </p>
                    )}
                    {cls.openTime && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <FiClock size={10} /> Mở: {parseDateTime(cls.openTime)?.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) ?? cls.openTime}
                      </p>
                    )}
                    {cls.deadline && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <FiClock size={10} /> Hạn: {parseDateTime(cls.deadline)?.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) ?? cls.deadline}
                      </p>
                    )}
                  </div>
                )}

                {/* Form sửa lịch giao bài */}
                {editingId === cls.classId && (
                  <div className="mt-2.5 pt-2.5 border-t border-indigo-200 space-y-2">
                    <div>
                      <Label className="block text-xs font-medium text-slate-600 mb-1">
                        Thời gian làm bài (phút) <span className="text-red-500">*</span>
                      </Label>
                      <Input type="number" min="1" className="text-sm py-1.5" placeholder="VD: 20" value={editTimeLimit} onChange={e => setEditTimeLimit(e.target.value)} />
                    </div>
                    <div>
                      <Label className="block text-xs font-medium text-slate-600 mb-1">
                        Thời gian mở bài <span className="text-red-500">*</span>
                      </Label>
                      <Input type="datetime-local" className="text-sm py-1.5" value={editOpenTime} onChange={e => setEditOpenTime(e.target.value)} />
                    </div>
                    <div>
                      <Label className="block text-xs font-medium text-slate-600 mb-1">
                        Hạn nộp bài <span className="text-red-500">*</span>
                      </Label>
                      <Input type="datetime-local" className="text-sm py-1.5" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 text-xs py-1.5" onClick={cancelEdit}>
                        Hủy
                      </Button>
                      <Button variant="gradient" className="flex-1 text-xs py-1.5" disabled={actionId === cls.classId} onClick={() => handleUpdate(cls.classId)}>
                        {actionId === cls.classId
                          ? <FiLoader size={11} className="animate-spin" />
                          : 'Lưu'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Form giao bài mới */}
                {pendingId === cls.classId && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200 space-y-2">
                    <div>
                      <Label className="block text-xs font-medium text-slate-600 mb-1">
                        Thời gian làm bài (phút) <span className="text-red-500">*</span>
                      </Label>
                      <Input type="number" min="1" className="text-sm py-1.5" placeholder="VD: 20" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} />
                    </div>
                    <div>
                      <Label className="block text-xs font-medium text-slate-600 mb-1">
                        Thời gian mở bài <span className="text-red-500">*</span>
                      </Label>
                      <Input type="datetime-local" className="text-sm py-1.5" value={openTime} onChange={e => setOpenTime(e.target.value)} />
                    </div>
                    <div>
                      <Label className="block text-xs font-medium text-slate-600 mb-1">
                        Hạn nộp bài <span className="text-red-500">*</span>
                      </Label>
                      <Input type="datetime-local" className="text-sm py-1.5" value={deadline} onChange={e => setDeadline(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 text-xs py-1.5" onClick={() => { setPendingId(null); setTimeLimit(''); setDeadline(''); setOpenTime(''); }}>
                        Hủy
                      </Button>
                      <Button variant="gradient" className="flex-1 text-xs py-1.5" disabled={actionId === cls.classId} onClick={() => handleAssign(cls.classId)}>
                        {actionId === cls.classId
                          ? <FiLoader size={11} className="animate-spin" />
                          : 'Xác nhận'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" className="w-full" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
