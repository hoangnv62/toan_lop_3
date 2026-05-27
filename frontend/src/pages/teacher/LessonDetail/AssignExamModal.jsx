import { useEffect, useState } from 'react';
import { FiX, FiLoader, FiSend, FiClock, FiEdit2 } from 'react-icons/fi';
import { getExamAssignments } from '../../../api/examService';
import { assignExam, unassignExam, updateExamAssignment } from '../../../api/classService';
import { toast } from 'react-toastify';

function toDatetimeLocal(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toISOString().slice(0, 16);
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

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setAssignments(await getExamAssignments(exam.id));
    } catch {
      setAssignments([]);
    }
  }

  function startEdit(cls) {
    setEditingId(cls.class_id);
    setEditTimeLimit(cls.time_limit ? String(Math.round(cls.time_limit / 60)) : '');
    setEditOpenTime(toDatetimeLocal(cls.open_time));
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
    try {
      await assignExam(classId, exam.id, timeLimit, deadline, openTime);
      toast.success('Đã giao bài cho lớp');
      setPendingId(null);
      setTimeLimit(''); setDeadline(''); setOpenTime('');
      load();
    } catch (err) {
      toast.error(err.message || 'Giao bài thất bại');
    } finally { setActionId(null); }
  }

  async function handleUpdate(classId) {
    if (!editTimeLimit || !editOpenTime || !editDeadline) {
      return toast.error('Vui lòng điền đầy đủ thời gian làm bài, thời gian mở đề và hạn nộp bài');
    }
    setActionId(classId);
    try {
      await updateExamAssignment(classId, exam.id, editTimeLimit, editDeadline, editOpenTime);
      toast.success('Đã cập nhật lịch giao bài');
      cancelEdit();
      load();
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại');
    } finally { setActionId(null); }
  }

  async function handleUnassign(classId) {
    setActionId(classId);
    try {
      await unassignExam(classId, exam.id);
      toast.success('Đã thu hồi bài tập');
      cancelEdit();
      load();
    } catch (err) {
      toast.error(err.message || 'Thu hồi thất bại');
    } finally { setActionId(null); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-gray-900">Giao bài cho lớp</h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[210px]">{exam.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <FiX size={17} />
          </button>
        </div>

        {assignments === null ? (
          <div className="flex justify-center py-10">
            <FiLoader size={20} className="animate-spin text-gray-300" />
          </div>
        ) : assignments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Chưa có lớp nào.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {assignments.map(cls => (
              <div key={cls.class_id}
                className={`rounded-xl border p-3 transition-colors ${
                  cls.assigned ? 'border-indigo-200 bg-indigo-50/40' : 'border-gray-200'
                }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">{cls.class_name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {cls.assigned ? (
                      <>
                        <span className="badge-green text-xs">Đã giao</span>
                        <button
                          className="btn-ghost py-0.5 px-2 text-xs gap-0.5"
                          disabled={actionId === cls.class_id}
                          onClick={() => editingId === cls.class_id ? cancelEdit() : startEdit(cls)}>
                          <FiEdit2 size={11} />
                          {editingId === cls.class_id ? 'Hủy' : 'Sửa'}
                        </button>
                        <button
                          className="btn-ghost text-red-500 hover:bg-red-50 py-0.5 px-2 text-xs gap-0.5"
                          disabled={actionId === cls.class_id}
                          onClick={() => handleUnassign(cls.class_id)}>
                          {actionId === cls.class_id
                            ? <FiLoader size={11} className="animate-spin" />
                            : <><FiX size={11} /> Thu hồi</>}
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn-primary py-0.5 px-2.5 text-xs gap-1"
                        onClick={() => { setPendingId(cls.class_id); cancelEdit(); setTimeLimit(''); setDeadline(''); setOpenTime(''); }}>
                        <FiSend size={11} /> Giao
                      </button>
                    )}
                  </div>
                </div>

                {/* Assignment info — ẩn khi đang edit */}
                {cls.assigned && editingId !== cls.class_id && (
                  <div className="mt-1.5 space-y-0.5">
                    {cls.time_limit && (
                      <p className="text-xs text-indigo-600 flex items-center gap-1">
                        <FiClock size={10} /> Thời gian: {Math.round(cls.time_limit / 60)} phút
                      </p>
                    )}
                    {cls.open_time && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <FiClock size={10} /> Mở: {new Date(cls.open_time).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    )}
                    {cls.deadline && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <FiClock size={10} /> Hạn: {new Date(cls.deadline).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    )}
                  </div>
                )}

                {/* Form sửa lịch giao bài */}
                {editingId === cls.class_id && (
                  <div className="mt-2.5 pt-2.5 border-t border-indigo-200 space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Thời gian làm bài (phút) <span className="text-red-500">*</span>
                      </label>
                      <input type="number" min="1" className="input text-sm py-1.5"
                        placeholder="VD: 20" value={editTimeLimit}
                        onChange={e => setEditTimeLimit(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Thời gian mở bài <span className="text-red-500">*</span>
                      </label>
                      <input type="datetime-local" className="input text-sm py-1.5"
                        value={editOpenTime} onChange={e => setEditOpenTime(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Hạn nộp bài <span className="text-red-500">*</span>
                      </label>
                      <input type="datetime-local" className="input text-sm py-1.5"
                        value={editDeadline} onChange={e => setEditDeadline(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-secondary flex-1 text-xs py-1.5" onClick={cancelEdit}>
                        Hủy
                      </button>
                      <button
                        className="btn-primary flex-1 text-xs py-1.5"
                        disabled={actionId === cls.class_id}
                        onClick={() => handleUpdate(cls.class_id)}>
                        {actionId === cls.class_id
                          ? <FiLoader size={11} className="animate-spin" />
                          : 'Lưu'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Form giao bài mới */}
                {pendingId === cls.class_id && (
                  <div className="mt-2.5 pt-2.5 border-t border-gray-200 space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Thời gian làm bài (phút) <span className="text-red-500">*</span>
                      </label>
                      <input type="number" min="1" className="input text-sm py-1.5"
                        placeholder="VD: 20" value={timeLimit}
                        onChange={e => setTimeLimit(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Thời gian mở bài <span className="text-red-500">*</span>
                      </label>
                      <input type="datetime-local" className="input text-sm py-1.5"
                        value={openTime} onChange={e => setOpenTime(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Hạn nộp bài <span className="text-red-500">*</span>
                      </label>
                      <input type="datetime-local" className="input text-sm py-1.5"
                        value={deadline} onChange={e => setDeadline(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn-secondary flex-1 text-xs py-1.5"
                        onClick={() => { setPendingId(null); setTimeLimit(''); setDeadline(''); setOpenTime(''); }}>
                        Hủy
                      </button>
                      <button
                        className="btn-primary flex-1 text-xs py-1.5"
                        disabled={actionId === cls.class_id}
                        onClick={() => handleAssign(cls.class_id)}>
                        {actionId === cls.class_id
                          ? <FiLoader size={11} className="animate-spin" />
                          : 'Xác nhận'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button className="btn-secondary w-full mt-4" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
