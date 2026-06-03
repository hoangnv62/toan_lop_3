import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../../components/TeacherLayout';
import { fetchClasses, createClass, deleteClass } from '../../api/classService';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiArrowRight, FiUsers } from 'react-icons/fi';
import Pagination from '../../components/Pagination';

const STATUS = {
  good:    { badge: 'badge-green',  label: 'Tốt',           accent: 'from-emerald-400 to-emerald-500', avatar: 'from-emerald-500 to-emerald-600' },
  warning: { badge: 'badge-yellow', label: 'Trung bình',    accent: 'from-amber-400 to-amber-500',     avatar: 'from-amber-500 to-amber-600'     },
  bad:     { badge: 'badge-red',    label: 'Cần cải thiện', accent: 'from-red-400 to-red-500',         avatar: 'from-red-500 to-red-600'         },
};
const DEFAULT_COLORS = { accent: 'from-indigo-500 to-violet-500', avatar: 'from-indigo-500 to-violet-600' };

export default function ManageClass() {
  const [classes, setClasses]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [newName, setNewName]   = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { load(page); }, [page]);

  async function load(p) {
    try {
      const data = await fetchClasses(p);
      setClasses(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch { setClasses([]); }
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return toast.error('Vui lòng nhập tên lớp');
    setCreating(true);
    try {
      await createClass(name);
      toast.success(`Tạo lớp "${name}" thành công`);
      setNewName('');
      setPage(1);
      load(1);
    } catch (err) {
      toast.error(err.message || 'Tạo thất bại');
    } finally { setCreating(false); }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Xóa lớp "${name}" sẽ xóa toàn bộ học sinh?`)) return;
    try {
      await deleteClass(id);
      toast.success('Đã xóa lớp');
      const newPage = classes.length === 1 && page > 1 ? page - 1 : page;
      setPage(newPage);
      load(newPage);
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại');
    }
  }

  return (
    <TeacherLayout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý lớp học</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} lớp</p>
        </div>
      </div>

      {/* Create */}
      <div className="card mb-6">
        <p className="text-sm font-semibold text-slate-700 mb-3">Thêm lớp học mới</p>
        <div className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="Nhập tên lớp học..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <button className="btn-primary whitespace-nowrap" onClick={handleCreate} disabled={creating}>
            <FiPlus size={16} />
            {creating ? 'Đang tạo...' : 'Thêm lớp'}
          </button>
        </div>
      </div>

      {/* Grid */}
      {classes.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FiUsers size={22} className="text-indigo-400" />
          </div>
          <p className="text-slate-500 font-semibold">Chưa có lớp học nào</p>
          <p className="text-sm text-slate-400 mt-1">Tạo lớp đầu tiên để bắt đầu</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {classes.map(c => {
            const s = STATUS[c.status] || DEFAULT_COLORS;
            const initial = c.className.trim().charAt(0).toUpperCase();
            return (
              <div key={c.classId}
                className="rounded-2xl border border-slate-100 bg-white shadow-soft hover:shadow-soft-hover hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col">

                {/* Color strip */}
                <div className={`h-1 bg-gradient-to-r ${s.accent}`} />

                <div className="p-5 flex flex-col flex-1">
                  {/* Top row */}
                  <div className="flex items-start gap-3 mb-5">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.avatar} flex items-center justify-center text-white font-extrabold text-lg shrink-0 select-none shadow-sm`}>
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h3 className="font-bold text-slate-900 text-base leading-tight truncate">{c.className}</h3>
                      {s.label && (
                        <span className={`${s.badge} mt-1.5 inline-block`}>{s.label}</span>
                      )}
                    </div>
                    <button
                      title="Xóa lớp"
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 mt-0.5"
                      onClick={() => handleDelete(c.classId, c.className)}>
                      <FiTrash2 size={14} />
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {[
                      { label: 'Học sinh',  value: c.totalStudents },
                      { label: 'Điểm TB',   value: c.avgScore  ?? '--' },
                      { label: 'Tỷ lệ đạt', value: c.passRate != null ? `${c.passRate}%` : '--' },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className="text-base font-extrabold text-slate-800 leading-none">{value}</p>
                        <p className="text-xs text-slate-400 mt-1.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <button
                    className="btn-primary w-full py-2 text-sm mt-auto"
                    onClick={() => navigate(`/class-detail/${c.classId}`)}>
                    Xem chi tiết <FiArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} pages={pages} onChange={p => setPage(p)} />
    </TeacherLayout>
  );
}
