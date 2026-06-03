import { useState } from 'react';
import { removeStudent } from '../../../api/classService';
import { toast } from 'react-toastify';
import { FiUsers, FiDownload, FiLoader, FiEye, FiUserX } from 'react-icons/fi';
import Pagination from '../../../components/Pagination';

function scoreStyle(score) {
  if (score == null) return { avatar: 'bg-slate-100 text-slate-500', pill: 'bg-slate-100 text-slate-400' };
  if (score >= 8)    return { avatar: 'bg-emerald-100 text-emerald-700', pill: 'bg-emerald-100 text-emerald-700' };
  if (score >= 5)    return { avatar: 'bg-indigo-100 text-indigo-700',   pill: 'bg-indigo-100 text-indigo-700'   };
  return               { avatar: 'bg-red-100 text-red-600',            pill: 'bg-red-100 text-red-600'          };
}

function ConfirmModal({ student, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FiUserX size={22} className="text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Xác nhận gỡ học sinh</h3>
          <p className="text-sm text-slate-500 mt-2">
            Gỡ <span className="font-semibold text-slate-800">{student.fullName}</span> khỏi lớp?
          </p>
          <p className="text-xs text-slate-400 mt-1">Tài khoản học sinh vẫn được giữ lại.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={onCancel}>Hủy</button>
          <button className="btn-danger flex-1" onClick={onConfirm}>Gỡ khỏi lớp</button>
        </div>
      </div>
    </div>
  );
}

export default function StudentRoster({
  classId, students, totalStudents, classAvg, page, pages,
  exportingStudents, onExportStudents, onPageChange,
  onViewExams, onViewRelatives, onRemoved,
}) {
  const [confirm, setConfirm] = useState(null);

  async function handleConfirmRemove() {
    const { studentId, fullName } = confirm;
    setConfirm(null);
    try {
      await removeStudent(classId, studentId);
      toast.success(`Đã gỡ ${fullName} khỏi lớp`);
      onRemoved();
    } catch (err) {
      toast.error(err.message || 'Gỡ thất bại');
    }
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

      <div className="card">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiUsers size={16} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Danh sách học sinh</h3>
            <span className="badge-indigo">{totalStudents}</span>
            {classAvg && (
              <span className="text-xs text-slate-400">· TB lớp:
                <span className="font-semibold text-slate-700 ml-1">{classAvg}</span>
              </span>
            )}
          </div>
          <button
            className="btn-secondary py-1.5 px-3 text-xs gap-1"
            onClick={onExportStudents}
            disabled={exportingStudents}>
            {exportingStudents
              ? <FiLoader size={13} className="animate-spin" />
              : <FiDownload size={13} />}
            {exportingStudents ? 'Đang xuất...' : 'Xuất Excel'}
          </button>
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
              const style = scoreStyle(s.avg_score);
              return (
                <div key={s.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">

                  {/* Index */}
                  <span className="text-xs text-slate-300 w-5 text-right shrink-0 font-mono select-none">
                    {(page - 1) * 15 + idx + 1}
                  </span>

                  {/* Avatar — color reflects score level */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 select-none ${style.avatar}`}>
                    {s.full_name.trim().charAt(0).toUpperCase()}
                  </div>

                  {/* Name + username */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{s.full_name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{s.username}</p>
                  </div>

                  {/* Score pill */}
                  <div className={`shrink-0 w-14 text-center px-2 py-1 rounded-lg text-xs font-bold ${style.pill}`}>
                    {s.avg_score != null ? s.avg_score : '—'}
                  </div>

                  {/* Actions — icon-only, always visible */}
                  <div className="flex items-center gap-0.5 shrink-0 w-20 justify-end">
                    <button
                      title="Xem bài làm"
                      className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      onClick={() => onViewExams(s)}>
                      <FiEye size={14} />
                    </button>
                    <button
                      title="Người thân"
                      className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      onClick={() => onViewRelatives(s)}>
                      <FiUsers size={14} />
                    </button>
                    <button
                      title="Gỡ khỏi lớp"
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      onClick={() => setConfirm({ studentId: s.id, fullName: s.full_name })}>
                      <FiUserX size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Pagination page={page} pages={pages} onChange={onPageChange} />
      </div>
    </>
  );
}
